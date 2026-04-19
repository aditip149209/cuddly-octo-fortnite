import pickle
import os

path = os.path.join("server", "fastapi_bundle", "models", "preprocessing_bundle.pkl")
with open(path, "rb") as f:
    b = pickle.load(f)
    print(b)
