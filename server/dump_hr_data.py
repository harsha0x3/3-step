from controllers.user_management_controller import admin_create_user
from models.schemas.auth_schemas import AdminCreateUserRequest, RoleEnum
from db.connection import get_db_conn
import pandas as pd

HR_DATA = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\hr_admin_spoc.csv"


def dump_hr_data():
    print("Started >>>\n")
    df = pd.read_csv(HR_DATA, dtype={"ADMIN / HR SPOC MOB NO": str})
    print(f"DF SHAPE >> {df.shape}\n")
    for idx, row in df.iterrows():
        print(f"Processing - {idx}")
        payload = AdminCreateUserRequest(
            full_name=row.get("ADMIN /HR SPOC", ""),
            mobile_number=row.get("ADMIN / HR SPOC MOB NO", ""),
            role=RoleEnum.verifier,
        )
        try:
            db = next(get_db_conn())
            admin_create_user(payload=payload, db=db)

        except Exception as e:
            print("Error creating user >> \n", e)


dump_hr_data()
