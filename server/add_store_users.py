from controllers.user_management_controller import admin_create_user
from models.schemas import auth_schemas as a_schemas
from models import Store
from sqlalchemy import select
from db.connection import get_db_conn
import pandas as pd

store_n_spoc = pd.read_csv(
    r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\StoresWithSpoc.csv"
)

db = next(get_db_conn())
for _, row in store_n_spoc.iterrows():
    try:
        if pd.notna(row["SPOC Name"]):
            store = db.scalar(select(Store).where(Store.id == row["store code"]))
            if not store:
                print("Store not found", row["store code"])
                continue

            payload = a_schemas.AdminCreateUserRequest(
                full_name=row["SPOC Name"],
                mobile_number=row["SPOC Contact"],
                role=a_schemas.RoleEnum.store_agent,
                store_id=store.id,
            )

            admin_create_user(payload=payload, db=db)
    except Exception as e:
        print("ERR", e)
        continue
