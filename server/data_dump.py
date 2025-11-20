import pandas as pd
from db.connection import get_db_conn
from controllers.candidates_controller import add_new_candidate
from models.schemas import candidate_schemas

excel_path = r"C:\Users\harshavardhancg\Downloads\List of off-roll associates for LT project_More than 8 years.xlsx"

REQUIRED_COLS = ["E.No", "Name", "Mobile Number", "DOB", "State", "City"]


def dump_candidate_data():
    print("IN")
    df = pd.read_csv(
        r"C:\Users\harshavardhancg\Titan\hard_verify\server\notebooks\data_head.csv"
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
    print("renamed")

    for _, row in df.iterrows():
        print(f"Processing {_}")
        payload = candidate_schemas.NewCandidatePayload(
            id=row["id"],
            full_name=row["full_name"],
            mobile_number=str(row["mobile_number"]),
            dob=row["dob"],
            city=row["city"],
            state=row["state"],
            division=row["Division Name"],
        )
        for db in get_db_conn():
            try:
                add_new_candidate(payload=payload, db=db)
            except Exception as e:
                print(e)
                continue


dump_candidate_data()
