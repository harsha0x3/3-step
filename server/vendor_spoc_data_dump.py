import pandas as pd
from db.connection import get_db_conn
from controllers.vendors_controller import add_new_vendor_spoc
from models.schemas import vendor_schemas
from sqlalchemy import select
from models import Vendor
import asyncio

csv_path = r"C:\Users\harshavardhancg\Titan\hard_verify\server\notebooks\vendors_with_spoc_table.csv"


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = (
        pd.read_csv(path, dtype={"Vendor SPOC Mobile No": str})
        if path.endswith(".csv")
        else pd.read_excel(path, dtype={"Vendor SPOC Mobile No": str})
    )
    return df


async def dump_vendor_spoc():
    print("Started..")
    vendor_spoc_data = read_data(csv_path).fillna("")  # ✅ fix NaN issue
    for idx, row in vendor_spoc_data.iterrows():
        print(f"Processing {idx}")
        for db in get_db_conn():
            try:
                vendor_data = db.scalar(
                    select(Vendor).where(
                        Vendor.vendor_name == str(row.get("Vendor Name", "Unknown"))
                    )
                )
                print(f"VENDOR DATA - {vendor_data.id} , {vendor_data.vendor_name}")
                if not vendor_data:
                    print(f"Vendor not found for row {idx} {row['Vendor Name']}")
                    continue
                payload = vendor_schemas.NewVendorSpoc(
                    vendor_id=vendor_data.id,
                    full_name=str(row.get("Vendor SPOC Name", "Unknown")),
                    mobile_number=str(row.get("Vendor SPOC Mobile No", "")),
                )
                await add_new_vendor_spoc(payload=payload, photo=None, db=db)

            except Exception as e:
                print(f"DB ERROR at row {idx}:", e)
        # payload = vendor_schemas.NewVendorSpoc(
        #     vendor_id=int(row.get("Vendor ID", 0)),
        #     full_name=str(row.get("Vendor SPOC Name", "Unknown")),
        #     mobile_number=str(row.get("Vendor SPOC Mobile No", "")),
        #     email=str(row.get("Vendor SPOC Email", "")),
        # )
        # for db in get_db_conn():
        #     try:
        #         add_new_vendor_spoc(payload=payload, photo=None, db=db)
        #     except Exception as e:
        #         print(f"DB ERROR at row {idx}:", e)


asyncio.run(dump_vendor_spoc())
