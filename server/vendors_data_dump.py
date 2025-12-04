import pandas as pd
from db.connection import get_db_conn
from controllers.vendors_controller import add_vendor
from models.schemas import vendor_schemas

csv_path = (
    r"C:\Users\harshavardhancg\Titan\hard_verify\server\notebooks\vendors_table.csv"
)


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = pd.read_csv(path) if path.endswith(".csv") else pd.read_excel(path)
    df["Vendor Owner / Resp Person Mobile No"] = df[
        "Vendor Owner / Resp Person Mobile No"
    ].astype(str)
    return df


def dump_vendor_data():
    print("Started..")

    vendors_data = read_data(csv_path).fillna("")  # ✅ fix NaN issue

    for idx, row in vendors_data.iterrows():
        print(f"Processing {idx}")
        payload = vendor_schemas.NewVendor(
            vendor_name=str(row.get("Vendor Name", "Unknown")),
            vendor_owner=str(row.get("Vendor Owner / Resp Person Name", "")),
            mobile_number=str(row.get("Vendor Owner / Resp Person Mobile No", "")),
        )
        for db in get_db_conn():
            try:
                add_vendor(payload=payload, db=db)
            except Exception as e:
                print(f"DB ERROR at row {idx}:", e)


# dump_vendor_data()

# payload = vendor_schemas.NewVendor(
#     vendor_name="JYOTHI WOOD WORKS",
#     vendor_owner="Muni Ready/ Devaraj",
#     mobile_number="8825948058/ 9538312654",
# )
# for db in get_db_conn():
#     try:
#         add_vendor(payload=payload, db=db)
#     except Exception as e:
#         print("DB ERROR at row:", e)
