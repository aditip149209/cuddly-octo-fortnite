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

    content = await file.read()
    try:
        img = Image.open(io.BytesIO(content)).convert("L")
        img = img.resize((32, 32))
        features = np.array(img).flatten().reshape(1, -1)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    model_file = manifest["models"][model]
    model_abs_path = os.path.join("server", "fastapi_bundle", model_file)
    preprocessor_path = os.path.join("server", "fastapi_bundle", manifest["preprocessing"]["bundle"])
    
    loaded_model = pickle.load(open(model_abs_path, "rb"))
    preprocessor = pickle.load(open(preprocessor_path, "rb"))
    
    X_processed = preprocessor.transform(features)
    prediction = loaded_model.predict(X_processed)
    
    # 3 classes logic (placeholder if output is int)
    class_map = {0: "Class 0", 1: "Class 1", 2: "Class 2"}
    pred_val = int(prediction[0])
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
            id="best_model", label="Best Model (SVM RBF)", algorithm="Support Vector Machine",
            hyperparameters="kernel=rbf", description="Selected best performing model."
        )
    ]
