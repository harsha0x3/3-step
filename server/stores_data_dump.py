from controllers import store_controller as sc
from models.schemas import store_schemas as ss
from models.schemas.auth_schemas import AdminCreateUserRequest, RoleEnum
from controllers.user_management_controller import admin_create_user
from db.connection import get_db_conn
import pandas as pd
from models import City, Store, StoreCityAssociation
from sqlalchemy import select

STORES_DATA_FILE = (
    r"C:\Users\harshavardhancg\Downloads\Store list for Titan Deal(Sheet1).csv"
)

NEW_STORES_DATA_FILE = (
    r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\new_stores_list.csv"
)


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = pd.read_csv(path) if path.endswith(".csv") else pd.read_excel(path)
    # df["Store Manager Mobile no"] = df["Store Manager Mobile no"].astype(str)
    # df["Mobile no"] = df["Mobile no"].astype(str)
    print("Read Complete..", len(df["Store Code"].str.lower().str.strip().unique()))
    return df


def dump_stores_data():
    print("Started..")

    stores_data = read_data(NEW_STORES_DATA_FILE)
    db = next(get_db_conn())
    for idx, row in stores_data.iterrows():
        if (
            pd.isna(row.get("City", ""))
            or pd.isna(row.get("Store Name", ""))
            or pd.isna(row.get("Store Code", ""))
        ):
            print(f"Skipping {idx} due to missing data")
            continue
        print(f"Processing {idx}")
        city_ids = db.scalars(
            select(City.id).where(City.name == row.get("City", ""))
        ).all()

        payload = ss.AddNewStore(
            id=row.get("Store Code", ""),
            city_ids=city_ids or [],
            name=row.get("Store Name", ""),
            address=row.get("Address", "") if pd.notna(row.get("Address", "")) else "",
            count=0,
        )
        for db in get_db_conn():
            try:
                new_store = sc.add_new_store(payload=payload, db=db)
                if new_store:
                    print(f"Added store - {row.get('Store Name', '')} - {new_store.id}")

            except Exception as e:
                with open("failed_stores.log", "a") as f:
                    f.write(f"Failed to add store {row.get('Store Name', '')}: \n")
                print(e)
                continue


def map_stores_to_cities():
    print("Started..")

    stores_data = read_data(NEW_STORES_DATA_FILE)

    for idx, row in stores_data.iterrows():
        db = next(get_db_conn())
        if pd.isna(row.get("City", "")) or pd.isna(row.get("Store Code", "")):
            print(f"Skipping {idx} due to missing data")
            continue
        print(f"Processing {idx}")

        # city_ids = db.scalars(
        #     select(City.id).where(City.name == row.get("City", ""))
        # ).all()

        city = db.scalar(select(City).where(City.name == row.get("City", "")))

        store = db.get(Store, row.get("Store Code", ""))
        if store:
            try:
                store_city_ass = db.scalar(
                    select(StoreCityAssociation).where(
                        StoreCityAssociation.store_id == store.id,
                        StoreCityAssociation.city_id == city.id,
                    )
                )
                if not store_city_ass:
                    new_store_city_ass = StoreCityAssociation(
                        store_id=store.id, city_id=city.id
                    )
                    db.add(new_store_city_ass)
                    db.commit()
                    db.refresh(new_store_city_ass)
                print(f"Mapped store - {store.name} - {store.id} to cities")
            except Exception as e:
                with open("failed_store_city_mappings.log", "a") as f:
                    f.write(f"Failed to map store {store.name}: \n")
                print(e)
                continue


# map_stores_to_cities()
# def dump_stores_data():
#     print("Started..")

#     stores_data = read_data(NEW_STORES_DATA_FILE)
#     for idx, row in stores_data.iterrows():
#         print(f"Processing {idx}")
#         payload = ss.AddNewStore(
#             id=row.get("Store Code", ""),
#             name=row.get("Store Name", ""),
#             city=row.get("City", ""),
#             mobile_number=row.get("Mobile No", ""),
#             address=row.get("Address", ""),
#             count=row.get("Count", 0),
#         )
#         for db in get_db_conn():
#             try:
#                 new_store = sc.add_new_store(payload=payload, db=db)
#                 if new_store:
#                     print(
#                         f"Adding new user - {row.get('Cluster Manager', '')} - {
#                             row.get('Store Manager Mobile no', '')
#                         }"
#                     )

#                     if row.get("Cluster Manager") and row.get(
#                         "Store Manager Mobile no"
#                     ):
#                         new_user_payload = AdminCreateUserRequest(
#                             full_name=row.get("Cluster Manager", ""),
#                             mobile_number=row.get("Store Manager Mobile no", ""),
#                             store_id=new_store.id,
#                             role=RoleEnum.store_agent,
#                         )
#                         new_user = admin_create_user(new_user_payload, db)
#                         # print(new_user)
#                         return new_user
#             except Exception as e:
#                 print(e)
#                 continue

# dump_stores_data()


def dump_cities():
    print("Started..")

    stores_data = read_data(NEW_STORES_DATA_FILE)
    unique_cities = stores_data["City"].unique().tolist()
    print(f"Unique Cities Found: {len(unique_cities)}")

    from models.cities import City

    for city_name in unique_cities:
        print(f"Processing city: {city_name}")
        new_city = City(name=city_name)
        for db in get_db_conn():
            try:
                db.add(new_city)
                db.commit()
                db.refresh(new_city)
                print(f"Added city: {city_name}")
            except Exception as e:
                print(f"Error adding city {city_name}: {e}")
                continue


dump_cities()
