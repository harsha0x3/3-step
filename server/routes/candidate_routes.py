from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    UploadFile,
    File,
    Path,
)
from sqlalchemy.orm import Session
from typing import Annotated, Literal

from db.connection import get_db_conn
from models.schemas.candidate_schemas import (
    NewCandidatePayload,
    CandidatesSearchParams,
    UpdatedCandidatePayload,
    CandidateOut,
)
from controllers.candidates_controller import (
    add_new_candidate,
    get_all_candidates,
    get_candidates_of_store,
    update_candidate_details,
    upload_candidate_img,
    upload_parent_img,
    update_candidate_verification_status,
    get_candidate_details_by_id,
)

from controllers.store_controller import get_store_of_user
from models.schemas.auth_schemas import UserOut
from services.auth.deps import get_current_user

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ✅ Add a new candidate
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: NewCandidatePayload,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Create a new candidate record under a store.
    - Requires a valid store_id in payload.
    - Automatically hashes Aadhaar number.
    """
    # Only admin or store personnel can add candidates
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to add candidates",
        )

    new_candidate = add_new_candidate(payload, db)
    return {
        "msg": "Candidate added successfully",
        "data": new_candidate,
    }


@router.patch("/{candidate_id}/upload-photo", status_code=status.HTTP_200_OK)
async def upload_candidate_photo(
    photo: Annotated[UploadFile, File(...)],
    candidate_id: Annotated[
        str, Path(title="Id of the candidate whose image is being uploaded")
    ],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorised to uplad images"
        )

    return await upload_candidate_img(photo=photo, candidate_id=candidate_id, db=db)


@router.patch("/{candidate_id}/upload-parent-photo", status_code=status.HTTP_200_OK)
async def upload_parent_photo(
    parent_photo: Annotated[UploadFile, File(...)],
    candidate_id: Annotated[
        str, Path(title="Id of the candidate whose parent's image is being uploaded")
    ],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorised to uplad images"
        )

    return await upload_parent_img(photo=parent_photo, candidate_id=candidate_id, db=db)


# ✅ Get all candidates (with optional search)
@router.get("/", status_code=status.HTTP_200_OK)
async def list_candidates(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_by: Annotated[
        Literal["id", "full_name", "aadhar_last_four_digits"] | None,
        Query(title="Search candidates by: id, full_name, or aadhar_last_four_digits"),
    ] = None,
    search_term: Annotated[str | None, Query(title="Search term")] = None,
):
    """
    Retrieve all candidates.
    Optional filters:
      - search_by: one of ['id', 'full_name', 'aadhar_last_four_digits']
      - search_term: value to search for
    """
    if current_user.role != "admin" and current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )

    params = CandidatesSearchParams(search_by=search_by, search_term=search_term)
    candidates = get_all_candidates(db, params)
    return {
        "msg": "Candidates fetched successfully",
        "data": {"candidates": candidates, "count": len(candidates)},
    }


# ✅ Get all candidates belonging to a specific store
@router.get("/store", status_code=status.HTTP_200_OK)
async def list_candidates_of_store(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Retrieve all candidates associated with a specific store.
    """
    # Only admin or that store's personnel can access this
    if current_user.role not in ["admin", "store_personnel"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view candidates of store",
        )

    store = get_store_of_user(db=db, user=current_user)

    candidates = get_candidates_of_store(db, store.id)
    if not candidates:
        return {
            "msg": "No candidates present",
            "data": {"candidates": candidates, "count": 0},
        }
    return {
        "msg": "Candidates fetched successfully",
        "data": {"candidates": candidates, "count": len(candidates)},
    }


# ✅ Update an existing candidate
@router.patch("/{candidate_id}", status_code=status.HTTP_200_OK)
async def update_candidate(
    candidate_id: str,
    payload: UpdatedCandidatePayload,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Update an existing candidate's details.
    Aadhaar number is not editable.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update candidates",
        )

    updated_candidate = update_candidate_details(candidate_id, payload, db)
    return {
        "msg": "Candidate updated successfully",
        "data": updated_candidate,
    }


@router.post("/verify/{candidate_id}", status_code=status.HTTP_200_OK)
async def verify_candidate(
    candidate_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Verify a candidate.
    """
    if current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to verify candidates",
        )

    updated_candidate = update_candidate_verification_status(
        candidate_id=candidate_id,
        db=db,
        is_verified=True,
    )
    return {
        "msg": "Candidate verified successfully",
        "data": CandidateOut.model_validate(updated_candidate),
    }


@router.get("/details/{candidate_id}", status_code=status.HTTP_200_OK)
async def get_candidate(
    candidate_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    res = get_candidate_details_by_id(candidate_id, db)
    return {"msg": "Candidate fetched successfully", "data": {"candidate": res}}
