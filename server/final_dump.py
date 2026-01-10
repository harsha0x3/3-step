import pandas as pd
from db.connection import get_db_conn
from controllers.candidates_controller import add_new_candidate
from models.schemas import candidate_schemas
from models import Candidate, VendorSpoc
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

csv_path = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\Beneficiaries_with_gift_cards.csv"


class CreateCand(candidate_schemas.NewCandidatePayload, BaseModel):
    gift_card_code: str | None


def dump_candidates_data():
    print("IN")
    df = pd.read_csv(
        csv_path,
        dtype={"Mobile Number": str, "CROMA Gift Card": str},
    )
    print(df.columns)
    db = next(get_db_conn())

    for _, row in df.iterrows():
        print(f"Processing {_}")
        try:
            payload = CreateCand(
                id=row["E.No"],
                full_name=row["Name"],
                mobile_number=None
                if pd.isna(row["Mobile Number"])
                or str(row["Mobile Number"]).strip() == ""
                else str(row["Mobile Number"]),
                city=row["City"],
                state=row["State"],
                division=row["Division Name"],
                gift_card_code=row["CROMA Gift Card"]
                if pd.notna(row["CROMA Gift Card"])
                else None,
            )
        except Exception as e:
            raise
        try:
            new_candidate = Candidate(
                id=payload.id,
                full_name=payload.full_name,
                dob=payload.dob,
                mobile_number=payload.mobile_number,
                city=payload.city,
                state=payload.state,
                store_id=payload.store_id if payload.store_id else None,
                division=payload.division,
                gift_card_code=payload.gift_card_code,
            )
            if payload.aadhar_number:
                new_candidate.set_aadhar_number(payload.aadhar_number)
                new_candidate.set_mask_aadhar_number(payload.aadhar_number)

            db.add(new_candidate)
            db.commit()
            db.refresh(new_candidate)

        except IntegrityError as e:
            db.rollback()
            error_message = str(e.orig)

            if "Duplicate entry" in error_message:
                # Check which column caused the duplicate error
                if ".id" in error_message:
                    # Retry if duplicate ID
                    raise Exception(
                        "Failed to generate unique Employee ID after several attempts. Try again",
                    )
                elif ".coupon_code" in error_message:
                    print(error_message)
                    raise Exception(
                        "Failed to generate unique Coupon after several attempts. Try again",
                    )

                elif (
                    ".mobile_number" in error_message
                    or "key 'mobile_number'" in error_message
                ):
                    print(error_message)

                    new_candidate = Candidate(
                        id=payload.id,
                        full_name=payload.full_name,
                        dob=payload.dob,
                        mobile_number=None,
                        city=payload.city,
                        state=payload.state,
                        store_id=payload.store_id if payload.store_id else None,
                        division=payload.division,
                        gift_card_code=payload.gift_card_code,
                    )
                    if payload.aadhar_number:
                        new_candidate.set_aadhar_number(payload.aadhar_number)
                        new_candidate.set_mask_aadhar_number(payload.aadhar_number)

                    db.add(new_candidate)
                    db.commit()
                    db.refresh(new_candidate)

                else:
                    raise Exception(
                        f"Duplicate entry detected: {error_message}",
                    )

            else:
                raise Exception(
                    f"Database error: {error_message}",
                )
        except Exception as e:
            with open("errs.txt", "a", encoding="utf-8") as f:
                f.write(f"{str(e)} - \n {str(row)} \n")
            print(e)
            continue


dump_candidates_data()
