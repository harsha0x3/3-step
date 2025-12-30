# utils\log_config.py
import sys
from dotenv import load_dotenv
import os
import logging
import logging.config

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
LOGS_DIR = os.path.join(BASE_SERVER_DIR, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": (
                "%(asctime)s | %(levelname)s | %(name)s | "
                "%(message)s | %(pathname)s:%(lineno)d"
            )
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "default",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": os.path.join(LOGS_DIR, "app.log"),
            "maxBytes": 10_000_000,
            "backupCount": 5,
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console", "file"],
    },
}


logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app.errors")
