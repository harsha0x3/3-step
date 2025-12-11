import pandas as pd
from db.connection import get_db_conn
from controllers.candidates_controller import add_new_candidate
from models.schemas import candidate_schemas
from models import Candidate, VendorSpoc
from sqlalchemy import select

excel_path = r"C:\Users\harshavardhancg\Downloads\List of off-roll associates for LT project_More than 8 years.xlsx"

REQUIRED_COLS = ["E.No", "Name", "Mobile Number", "DOB", "State", "City"]


def dump_candidate_data():
    print("IN")
    df = pd.read_csv(
        r"C:\Users\harshavardhancg\Titan\hard_verify\server\notebooks\final_no_e_no_dups2.csv",
        dtype={"Mobile Number": str},
    )
    # missing_cols = []
    # for col in REQUIRED_COLS:
    #     print(col)
    #     if col not in df.columns:
    #         missing_cols.append(col)

    # if missing_cols:
    #     print("err")
    #     raise Exception(f"Following cols are missing, {', '.join(missing_cols)}")

    # df = df.rename(
    #     columns={
    #         "E.No": "id",
    #         "Name": "full_name",
    #         "Mobile Number": "mobile_number",
    #         "DOB": "dob",
    #         "State": "state",
    #         "City": "city",
    #     }
    # )

    for _, row in df.iterrows():
        print(f"Processing {_}")
        mobile = row["Mobile Number"]
        payload = candidate_schemas.NewCandidatePayload(
            id=row["E.No"],
            full_name=row["Name"],
            mobile_number=None
            if pd.isna(mobile) or str(mobile).strip() == ""
            else str(mobile),
            city=row["City"],
            state=row["State"],
            division=row["Division Name"],
        )
        for db in get_db_conn():
            try:
                add_new_candidate(payload=payload, db=db)
            except Exception as e:
                with open("errs.txt", "a", encoding="utf-8") as f:
                    f.write(f"{str(e)} - \n {str(row)} \n")
                print(e)
                continue


# dump_candidate_data()

# payload = (
#     candidate_schemas.NewCandidatePayload(
#         id="147700011",
#         full_name="ABDUL AWUAL MOLLICK",
#         mobile_number="987654321",
#         city="HYDERABAD",
#         state="Telangana",
#         division="Eyecare Division",
#     ),
# )


# for db in get_db_conn():
#     try:
#         print("started")
#         new_c = add_new_candidate(
#             payload=candidate_schemas.NewCandidatePayload(
#                 id="145800368",
#                 full_name="MUNIRAJU ",
#                 mobile_number=None,
#                 city="CHIKKABALLAPURA",
#                 state="Karnataka",
#                 division="Eyecare Division",
#             ),
#             db=db,
#         )
#         print("done", new_c)
#     except Exception as e:
#         print(e)
#         continue


def remove_os(number: str):
    if number.endswith(".0"):
        number = number[:-2]
    return number


def sanitize_phone(number):
    if number.startswith("91") and len(number) > 10:
        number = number[2:]

    return number if len(number) == 10 else None


# for db in get_db_conn():
#     try:
#         print("started")
#         candidates = db.scalars(select(Candidate)).all()
#         for candidate in candidates:
#             if candidate.mobile_number and len(candidate.mobile_number) > 10:
#                 print("processing..")
#                 candidate.mobile_number = remove_os(candidate.mobile_number)
#                 candidate.mobile_number = sanitize_phone(candidate.mobile_number)
#                 db.commit()
#         print("done")
#     except Exception as e:
#         print(e)
#         continue

# for db in get_db_conn():
#     try:
#         print("started")
#         v_spocs = db.scalars(select(VendorSpoc)).all()
#         for v_spoc in v_spocs:
#             if v_spoc.mobile_number and len(v_spoc.mobile_number) > 10:
#                 print("processing..")
#                 v_spoc.mobile_number = remove_os(v_spoc.mobile_number)
#                 v_spoc.mobile_number = sanitize_phone(v_spoc.mobile_number)
#                 db.commit()
#         print("done")
#     except Exception as e:
#         print(e)
#         continue
