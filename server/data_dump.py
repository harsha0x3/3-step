import pandas as pd
from db.connection import get_db_conn
from controllers.candidates_controller import add_new_candidate
from models.schemas import candidate_schemas

excel_path = r"C:\Users\harshavardhancg\Downloads\List of off-roll associates for LT project_More than 8 years.xlsx"

REQUIRED_COLS = ["E.No", "Name", "Mobile Number", "DOB", "State", "City"]


def dump_candidate_data():
    print("IN")
    df = pd.read_csv(
        r"C:\Users\harshavardhancg\Titan\hard_verify\server\notebooks\filtered_data.csv",
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
                print(e)
                continue


# dump_candidate_data()

payload = (
    candidate_schemas.NewCandidatePayload(
        id="147700011",
        full_name="ABDUL AWUAL MOLLICK",
        mobile_number="987654321",
        city="HYDERABAD",
        state="Telangana",
        division="Eyecare Division",
    ),
)


for db in get_db_conn():
    try:
        print("started")
        new_c = add_new_candidate(
            payload=candidate_schemas.NewCandidatePayload(
                id="145800368",
                full_name="MUNIRAJU ",
                mobile_number=None,
                city="CHIKKABALLAPURA",
                state="Karnataka",
                division="Eyecare Division",
            ),
            db=db,
        )
        print("done", new_c)
    except Exception as e:
        print(e)
        continue
