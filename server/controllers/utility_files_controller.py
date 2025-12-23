from models import UtilityFile
from utils.helpers import save_utility_pdf, normalize_path
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
import os


async def save_utility_files(file: UploadFile, db: Session, type: str):
    try:
        existing_file = db.scalar(select(UtilityFile).where(UtilityFile.type == type))
        if existing_file:
            existing_path = normalize_path(existing_file.path)
            if os.path.exists(existing_path):
                os.remove(existing_path)
        utility_file_path = await save_utility_pdf(file=file, file_name=type)
        if existing_file:
            existing_file.path = utility_file_path
        else:
            existing_file = UtilityFile(type=type, path=utility_file_path)
            db.add(existing_file)
        db.commit()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding file.",
        )


def get_utility_file(db: Session, file_type: str):
    try:
        utility_file = db.scalar(
            select(UtilityFile).where(UtilityFile.type == file_type)
        )

        if not utility_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utility file not found",
            )
        return utility_file
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting utility file.",
        )


def get_all_utility_files(db: Session):
    try:
        utility_files = db.scalars(select(UtilityFile)).all()
        if not utility_files:
            return []
        return utility_files
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting all utility files",
        )
