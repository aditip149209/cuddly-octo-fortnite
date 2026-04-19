from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import datetime
import uuid

app = FastAPI(title="ML Dashboard API")

# Setup CORS for the React frontend (usually running on port 5173 for Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------
# SCHEMAS
# ---------------------

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

# ---------------------
# ENDPOINTS
# ---------------------

@app.post("/api/inference", response_model=InferenceResponse)
async def run_inference(
    file: UploadFile = File(...),
    model: str = Form(...)
):
    """
    Endpoint: POST /api/inference
    Payload format: multipart/form-data
    - file: The image file
    - model: String identifier (e.g., 'svm', 'cnn')
    """
    
    # [PLACEHOLDER] TODO: Actually process the image and run inference
    # content = await file.read()
    # result = my_ml_function(content, model)

    return InferenceResponse(
        id=str(uuid.uuid4()),
        result=f"Simulated result for {model} on {file.filename}",
        confidence=98.5,
        model=model,
        timestamp=datetime.datetime.now().isoformat()
    )


@app.get("/api/history", response_model=List[HistoryItem])
async def get_history():
    """
    Endpoint: GET /api/history
    Response schema: JSON array of HistoryItem objects
    """
    
    # [PLACEHOLDER] TODO: Fetch this from a proper database (PostgreSQL, Firebase, etc.)
    return [
        HistoryItem(
            id="1",
            filename="lung_xray_01.jpg",
            model="ResNet",
            result="Negative (99%)",
            date="2026-04-18T10:00:00Z"
        ),
        HistoryItem(
            id="2",
            filename="mri_scan_v2.png",
            model="CNN",
            result="Positive (87%)",
            date="2026-04-19T08:30:00Z"
        )
    ]


@app.get("/api/models", response_model=List[ModelInfo])
async def get_models_info():
    """
    Endpoint: GET /api/models
    Response schema: JSON array of ModelInfo objects
    """
    
    # [PLACEHOLDER] TODO: Fetch from DB or a config file
    return [
        ModelInfo(
            id="svm",
            label="SVM",
            algorithm="Support Vector Machine",
            hyperparameters="C=1.0, kernel=rbf, gamma=scale",
            description="A robust linear and non-linear classifier."
        ),
        ModelInfo(
            id="cnn",
            label="CNN",
            algorithm="Convolutional Neural Network",
            hyperparameters="layers=5, learning_rate=0.001",
            description="Deep learning architecture designed for structured grid data."
        ),
        ModelInfo(
            id="knn",
            label="KNN",
            algorithm="K-Nearest Neighbors",
            hyperparameters="n_neighbors=5, metric=minkowski",
            description="Simple non-parametric method."
        ),
        ModelInfo(
            id="kmeans",
            label="K-Means",
            algorithm="K-Means Clustering",
            hyperparameters="n_clusters=8, max_iter=300",
            description="Unsupervised clustering algorithm."
        ),
        ModelInfo(
            id="resnet",
            label="ResNet",
            algorithm="Residual Neural Network",
            hyperparameters="learning_rate=0.01, epochs=100",
            description="State-of-the-art deep convolutional network."
        ),
        ModelInfo(
            id="random_forest",
            label="Random Forest",
            algorithm="Random Forest Classifier",
            hyperparameters="n_estimators=100, max_depth=None",
            description="Ensemble learning method based on trees."
        )
    ]
