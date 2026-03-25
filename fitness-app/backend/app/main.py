from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import diet  # Make sure this import is correct

app = FastAPI(title="Fitness Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(diet.router)

@app.get("/")
def home():
    return {"message": "Fitness App Running 🚀", "api": "USDA", "status": "ready"}
