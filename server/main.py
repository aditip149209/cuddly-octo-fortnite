from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime
import uuid
import json
import os
import pickle
import numpy as np
from PIL import Image
import io

from server.db import init_db, add_history, get_user_history

app = FastAPI(title="ML Dashboard API")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InferenceResponse(BaseModel):
    id: str
    result: str
    confidence: float
    model: str
    timestamp: str

class HistoryItem(BaseModel):
    id: str
    filename: str
    model: str
    result: str
    date: str

class ModelInfo(BaseModel):
    id: str
    label: str
    algorithm: str
    hyperparameters: str
    description: str

@app.post("/api/inference", response_model=InferenceResponse)
async def run_inference(
    file: UploadFile = File(...),
    model: str = Form(...),
    user_id: str = Form(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    manifest_path = os.path.join("server", "fastapi_bundle", "manifest.json")
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    
    valid_models = ["svm_rbf", "random_forest", "mlp", "knn_pca", "kmeans_pca", "best_model"]
    if model not in valid_models:
        return {"error": "Invalid model selection"}

    import cv2

    img_buffer = await file.read()
    try:
        # Convert byte stream to OpenCV image (like cv2.imread does)
        nparr = np.frombuffer(img_buffer, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Corrupted image")

        img = cv2.resize(img, (128, 128))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        equalized = cv2.equalizeHist(gray)

        h, w = equalized.shape
        cropped = equalized[int(h * 0.1) : int(h * 0.9), int(w * 0.1) : int(w * 0.9)]

        signal = cropped.flatten().astype(np.float32)
        # moving average
        window_size = 5
        if signal.size < window_size:
            filtered_signal = signal
        else:
            kernel = np.ones(window_size, dtype=np.float32) / float(window_size)
            filtered_signal = np.convolve(signal, kernel, mode="valid")

        # spectral features
        fft_vals = np.abs(np.fft.fft(filtered_signal))
        fft_sum = np.sum(fft_vals)

        if fft_sum <= 0:
            extracted_features = np.array([0.0, 0.0, 0.0, 0.0], dtype=np.float32)
        else:
            mean_freq = float(np.mean(fft_vals))
            indices = np.arange(len(fft_vals), dtype=np.float32)
            spectral_centroid = float(np.sum(indices * fft_vals) / fft_sum)
            bandwidth = float(np.sqrt(np.sum(((indices - spectral_centroid) ** 2) * fft_vals) / fft_sum))
            flatness = float(np.exp(np.mean(np.log(fft_vals + 1e-10))) / (mean_freq + 1e-10))
            
            extracted_features = np.array([mean_freq, spectral_centroid, bandwidth, flatness], dtype=np.float32)
            
        features = extracted_features.reshape(1, -1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # Load resources with joblib instead of pickle
    # since models were saved with joblib.dump
    import joblib
    model_file = manifest["models"][model]
    model_abs_path = os.path.join("server", "fastapi_bundle", model_file)
    preprocessor_path = os.path.join("server", "fastapi_bundle", manifest["preprocessing"]["bundle"])
    
    loaded_model = joblib.load(model_abs_path)
    preprocessor = joblib.load(preprocessor_path)
    
    # Feature engineering as done in training script before scaler processing
    row_mean = np.mean(features, axis=1, keepdims=True)
    row_std = np.std(features, axis=1, keepdims=True)
    row_min = np.min(features, axis=1, keepdims=True)
    row_max = np.max(features, axis=1, keepdims=True)
    
    features_stack = np.hstack((features, row_mean, row_std, row_min, row_max))
    
    if model in ["kmeans_pca", "knn_pca"]:
        X_scaled = preprocessor['scaler'].transform(features_stack)
        if 'pca' in preprocessor:
            X_processed = preprocessor['pca'].transform(X_scaled)
        else:
            X_processed = X_scaled
    else:
        # svm_rbf, random_forest, mlp, best_model were trained on the raw 8 appended features
        # without scaling or pca !
        X_processed = features_stack

    prediction = loaded_model.predict(X_processed)
    pred_val = int(prediction[0])
    
    if model == "kmeans_pca":
        kmeans_map_path = os.path.join("server", "fastapi_bundle", manifest["preprocessing"]["kmeans_label_map"])
        with open(kmeans_map_path, "r") as f:
            kmeans_map = json.load(f)["mapping"]
        pred_val = int(kmeans_map.get(str(pred_val), pred_val))
    
    # 3 classes logic (placeholder if output is int)
    class_map = {0: "Class 0", 1: "Class 1", 2: "Class 2"}
    class_name = class_map.get(pred_val, f"Class {pred_val}")
    
    new_id = str(uuid.uuid4())
    timestamp = datetime.datetime.now().isoformat()

    add_history(new_id, user_id, file.filename, model, class_name, timestamp)

    return InferenceResponse(
        id=new_id,
        result=class_name,
        confidence=99.9, # Fake conf for sklearn
        model=model,
        timestamp=timestamp
    )

@app.get("/api/history", response_model=List[HistoryItem])
async def get_history(user_id: str):
    rows = get_user_history(user_id)
    return [
        HistoryItem(
            id=row["id"],
            filename=row["filename"],
            model=row["model"],
            result=row["result"],
            date=row["date"]
        )
        for row in rows
    ]

@app.get("/api/models", response_model=List[ModelInfo])
async def get_models_info():
    return [
        ModelInfo(
            id="best_model", label="Best Model", algorithm="Selected Best",
            hyperparameters="Auto", description="Selected best performing model overall."
        ),
        ModelInfo(
            id="svm_rbf", label="SVM (RBF Kernel)", algorithm="Support Vector Machine",
            hyperparameters="kernel=rbf", description="Non-linear classifier using Radial Basis Function."
        ),
        ModelInfo(
            id="random_forest", label="Random Forest", algorithm="Random Forest Classifier",
            hyperparameters="n_estimators=300", description="Ensemble learning method based on decision trees."
        ),
        ModelInfo(
            id="mlp", label="MLP (Neural Network)", algorithm="Multi-Layer Perceptron",
            hyperparameters="hidden_layer_sizes=(64, 32, 16)", description="A feedforward artificial neural network."
        ),
        ModelInfo(
            id="knn_pca", label="KNN (PCA)", algorithm="K-Nearest Neighbors",
            hyperparameters="weights=distance", description="Classification based on closest training examples."
        ),
        ModelInfo(
            id="kmeans_pca", label="K-Means (PCA)", algorithm="K-Means Clustering",
            hyperparameters="n_clusters=3", description="Unsupervised clustering algorithm mapped to labels."
        )
    ]
