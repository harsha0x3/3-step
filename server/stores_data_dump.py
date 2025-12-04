from controllers import store_controller as sc
from models.schemas import store_schemas as ss
from models.schemas.auth_schemas import AdminCreateUserRequest, RoleEnum
from controllers.user_management_controller import admin_create_user
from db.connection import get_db_conn
import pandas as pd

STORES_DATA_FILE = (
    r"C:\Users\harshavardhancg\Downloads\Store list for Titan Deal(Sheet1).csv"
)


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = (
        pd.read_csv(path, skipfooter=1)
        if path.endswith(".csv")
        else pd.read_excel(path, skipfooter=1)
    )
    df["Store Manager Mobile no"] = df["Store Manager Mobile no"].astype(str)
    df["Mobile no"] = df["Mobile no"].astype(str)
    return df


def dump_stores_data():
    print("Started..")

    stores_data = read_data(STORES_DATA_FILE)
    for idx, row in stores_data.iterrows():
        print(f"Processing {idx}")
        payload = ss.AddNewStore(
            id=row.get("Store Code", ""),
            name=row.get("Store Name", ""),
            city=row.get("Location", ""),
            mobile_number=row.get("Mobile No", ""),
            count=row.get("Count", 0),
        )
        for db in get_db_conn():
            try:
                new_store = sc.add_new_store(payload=payload, db=db)
                if new_store:
                    print(
                        f"Adding new user - {row.get('Cluster Manager', '')} - {
                            row.get('Store Manager Mobile no', '')
                        }"
                    )

                    if row.get("Cluster Manager") and row.get(
                        "Store Manager Mobile no"
                    ):
                        new_user_payload = AdminCreateUserRequest(
                            full_name=row.get("Cluster Manager", ""),
                            mobile_number=row.get("Store Manager Mobile no", ""),
                            store_id=new_store.id,
                            role=RoleEnum.store_agent,
                        )
                        new_user = admin_create_user(new_user_payload, db)
                        # print(new_user)
                        return new_user
            except Exception as e:
                print(e)
                continue


dump_stores_data()
