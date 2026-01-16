# utilityroutes

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Path,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Annotated, Literal
from db.connection import get_db_conn
from services.auth.deps import get_current_user
from models.schemas.auth_schemas import UserOut
from controllers.utility_files_controller import (
    save_utility_files,
    get_utility_file,
    get_all_utility_files,
)
import os
from utils.helpers import normalize_path

router = APIRouter(prefix="/utility_files", tags=["Utility Files"])


@router.get("/all", status_code=status.HTTP_200_OK)
def fetch_all_utility_files(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    result = get_all_utility_files(db=db)

    return result


@router.post("/{file_type}", status_code=status.HTTP_201_CREATED)
async def upload_utility_file(
    db: Annotated[Session, Depends(get_db_conn)],
    file: Annotated[UploadFile, File(...)],
    file_type: Annotated[
        Literal[
            "voucher_distribution_sop",
            "laptop_distribution_sop",
            "login_sop",
            "upgrade_laptop_sop",
        ],
        Path(...),
    ],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        await save_utility_files(file=file, db=db, type=file_type)
        return {"msg": "File uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading file",
        )


@router.get("/{file_type}", status_code=status.HTTP_200_OK)
def fetch_utility_file(
    db: Annotated[Session, Depends(get_db_conn)],
    file_type: Annotated[
        Literal[
            "voucher_distribution_sop",
            "laptop_distribution_sop",
            "login_sop",
            "login_video",
            "upgrade_laptop_sop",
            "voucher_distribution_video",
            "laptop_upgrade_now_video",
            "laptop_upgrade_later_video",
            "laptop_distribution_normal_video",
        ],
        Path(...),
    ],
):
    result = get_utility_file(db=db, file_type=file_type)
    file_path = normalize_path(result.path)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=os.path.basename(file_path),
    )
