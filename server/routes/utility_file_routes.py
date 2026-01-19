# utilityroutes

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Path,
    Request,
)
from fastapi.responses import FileResponse, StreamingResponse
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
import mimetypes
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


# @router.get("/{file_type}", status_code=status.HTTP_200_OK)
# def fetch_utility_file(
#     db: Annotated[Session, Depends(get_db_conn)],
#     file_type: Annotated[
#         Literal[
#             "voucher_distribution_sop",
#             "laptop_distribution_sop",
#             "login_sop",
#             "login_video",
#             "upgrade_laptop_sop",
#             "voucher_distribution_video",
#             "laptop_upgrade_now_video",
#             "laptop_upgrade_later_video",
#             "laptop_distribution_normal_video",
#         ],
#         Path(...),
#     ],
# ):
#     result = get_utility_file(db=db, file_type=file_type)
#     file_path = normalize_path(result.path)

#     if not os.path.exists(file_path):
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="File not found",
#         )

#     mime_type, _ = mimetypes.guess_file_type(file_path)

#     return FileResponse(
#         path=file_path,
#         media_type=mime_type,
#         filename=os.path.basename(file_path),
#     )


@router.get("/{file_type}", status_code=status.HTTP_200_OK)
def fetch_utility_file_(
    request: Request,
    db: Annotated[Session, Depends(get_db_conn)],
    file_type: Annotated[
        Literal[
            "login_video",
            "voucher_distribution_video",
            "laptop_upgrade_now_video",
            "laptop_upgrade_later_video",
            "laptop_distribution_normal_video",
            "login_sop",
            "voucher_distribution_sop",
            "laptop_distribution_sop",
            "upgrade_laptop_sop",
        ],
        Path(...),
    ],
):
    import traceback

    try:
        CHUNK_SIZE = 1024 * 1024
        result = get_utility_file(db=db, file_type=file_type)
        file_path = normalize_path(result.path)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        file_size = os.path.getsize(file_path)
        range_header = request.headers.get("range")

        def iter_file(start=0, end=None):
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = (end - start + 1) if end else file_size
                while remaining > 0:
                    chunk = f.read(min(CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        if range_header:
            # Example: bytes=0-1023
            bytes_range = range_header.replace("bytes=", "")
            start_str, end_str = bytes_range.split("-")

            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
            }

            return StreamingResponse(
                iter_file(start, end),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                media_type="video/mp4",
                headers=headers,
            )

        return StreamingResponse(
            iter_file(),
            media_type="video/mp4",
            headers={
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes",
            },
        )
    except HTTPException:
        print("HTTP")
        traceback.print_exc()
        raise
    except Exception as e:
        print("Unexce")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error in fetching the file.",
        )


@router.get("/path/{file_type}", status_code=status.HTTP_200_OK)
def fetch_utility_file_path(
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

    return file_path
