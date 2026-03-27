from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine
from app.models.schema import Base
from app.routes.health import router as health_router
from app.routes.upload import router as upload_router
from app.routes.user import router as user_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FemTwin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(health_router)
app.include_router(upload_router)

@app.get("/")
def root():
    return {"message": "FemTwin API running"}
