from fastapi import FastAPI, Request, Response
from collections.abc import Callable
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    auth_routes,
    store_routes,
    candidate_routes,
    verification_routes,
    vendor_routes,
    dashboard_routes,
    user_management_routes,
    utility_file_routes,
    secure_file_serving_routes,
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
        "localhost:8000",
        "localhost:8070",
        "https://mdl.titan.in",
        "https://www.mdl.titan.in",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.middleware("http")
async def remove_server_header(
    request: Request, call_next: Callable[[Request], Response]
) -> Response:
    response = await call_next(request)
    # Remove the server header safely
    if "Server" in response.headers:
        del response.headers["Server"]
    if "server" in response.headers:
        del response.headers["server"]
    return response


# app.mount("/uploads", StaticFiles(directory=BASE_UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health_check():
    return {"msg": "I'm alive", "status": "ok"}


app.include_router(auth_routes.router)
app.include_router(store_routes.router)
app.include_router(candidate_routes.router)
app.include_router(verification_routes.router)
app.include_router(vendor_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(user_management_routes.router)
app.include_router(utility_file_routes.router)
app.include_router(secure_file_serving_routes.router)
