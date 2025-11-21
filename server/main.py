from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    auth_routes,
    store_routes,
    candidate_routes,
    verification_routes,
    vendor_routes,
    dashboard_routes,
)
from db.connection import init_db
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_UPLOAD_DIR = os.path.join(BASE_SERVER_DIR, "uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan, root_path="/hard_verify/api/v1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/uploads", StaticFiles(directory=BASE_UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health_check():
    return {"msg": "I'm alive", "status": "ok"}


app.include_router(auth_routes.router)
app.include_router(store_routes.router)
app.include_router(candidate_routes.router)
app.include_router(verification_routes.router)
app.include_router(vendor_routes.router)
app.include_router(dashboard_routes.router)
