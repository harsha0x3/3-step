print(">>> [1] main.py import started")

from fastapi import FastAPI, Request, Response

print(">>> [2] fastapi imported")

from collections.abc import Callable
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

print(">>> [3] middleware imports done")

print(">>> [4] importing routes...")
print(">>> importing auth_routes")
from routes import auth_routes

print(">>> auth_routes OK")

print(">>> importing store_routes")
from routes import store_routes

print(">>> store_routes OK")

print(">>> importing candidate_routes")
from routes import candidate_routes

print(">>> candidate_routes OK")

print(">>> importing verification_routes")
from routes import verification_routes

print(">>> verification_routes OK")

print(">>> importing vendor_routes")
from routes import vendor_routes

print(">>> vendor_routes OK")

print(">>> importing dashboard_routes")
from routes import dashboard_routes

print(">>> dashboard_routes OK")

print(">>> importing user_management_routes")
from routes import user_management_routes

print(">>> user_management_routes OK")

print(">>> importing utility_file_routes")
from routes import utility_file_routes

print(">>> utility_file_routes OK")

print(">>> importing secure_file_serving_routes")
from routes import secure_file_serving_routes
from routes import region_routes

print(">>> secure_file_serving_routes OK")


print(">>> [5] routes imported")

print(">>> [6] importing db connection")
from db.connection import init_db

print(">>> [7] db connection imported")

print(">>> [8] importing logging config")
from utils.log_config import LOGGING_CONFIG

print(">>> [9] logging config imported")

import logging
import logging.config
import os
from dotenv import load_dotenv

print(">>> [10] standard libs imported")

print(">>> [11] loading env")
load_dotenv()
print(">>> [12] env loaded")

print(">>> [13] configuring logging")
logging.config.dictConfig(LOGGING_CONFIG)
print(">>> [14] logging configured")

logger = logging.getLogger("app.errors")
print(">>> [15] logger acquired")

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_UPLOAD_DIR = os.path.join(BASE_SERVER_DIR, "uploads")
print(">>> [16] base dirs set")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(">>> [17] lifespan start - init_db()")
    init_db()
    print(">>> [18] lifespan yield")
    yield
    print(">>> [19] lifespan shutdown")


print(">>> [20] creating FastAPI app")

ENV = os.getenv("ENV", "development")

app = FastAPI(
    lifespan=lifespan,
    root_path="/hard_verify/api/v1.0",
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json",
)
print(">>> [21] FastAPI app created")

print(">>> [22] adding CORS middleware")
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
print(">>> [23] CORS middleware added")


@app.middleware("http")
async def remove_server_header(
    request: Request, call_next: Callable[[Request], Response]
) -> Response:
    return await call_next(request)


print(">>> [26] middleware registered")


@app.get("/health")
async def health_check():
    return {"msg": "I'm alive", "status": "ok"}


print(">>> [27] health route registered")

print(">>> [28] including routers")
app.include_router(auth_routes.router)
print(">>> [29] auth_routes included")
app.include_router(store_routes.router)
print(">>> [30] store_routes included")
app.include_router(candidate_routes.router)
print(">>> [31] candidate_routes included")
app.include_router(verification_routes.router)
print(">>> [32] verification_routes included")
app.include_router(vendor_routes.router)
print(">>> [33] vendor_routes included")
app.include_router(dashboard_routes.router)
print(">>> [34] dashboard_routes included")
app.include_router(user_management_routes.router)
print(">>> [35] user_management_routes included")
app.include_router(utility_file_routes.router)
print(">>> [36] utility_file_routes included")
app.include_router(secure_file_serving_routes.router)
print(">>> [37] secure_file_serving_routes included")
app.include_router(region_routes.router)

print(">>> [38] main.py import completed")
