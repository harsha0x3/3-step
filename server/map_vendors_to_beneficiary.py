import pandas as pd
from db.connection import get_db_conn
from sqlalchemy import select
from models import Candidate, VendorSpoc, Vendor
from controllers.vendors_controller import add_vendor, add_new_vendor_spoc
from models.schemas import vendor_schemas as vs
import asyncio

csv_path = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\Beneficiaries_with_gift_cards.csv"


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = pd.read_csv(path) if path.endswith(".csv") else pd.read_excel(path)
    return df


async def map_vendor_to_beneficiary():
    print("Started..")
    data = read_data(csv_path).fillna("")

    db = next(get_db_conn())  # ✅ ONE session

    try:
        for idx, row in data.iterrows():
            print(f"Processing {idx}")

            try:
                vendor_spoc = db.scalar(
                    select(VendorSpoc).where(
                        VendorSpoc.full_name == row.get("Vendor SPOC Name", "").strip()
                    )
                )

                if not vendor_spoc:
                    vendor = db.scalar(
                        select(Vendor).where(
                            Vendor.vendor_name == row.get("Vendor Name", "").strip()
                        )
                    )

                    if not vendor:
                        vendor_payload = vs.NewVendor(
                            vendor_name=row["Vendor Name"],
                            vendor_owner=row["Vendor Owner / Resp Person Name"],
                            mobile_number=row["Vendor Owner / Resp Person Mobile No"]
                            or None,
                        )
                        vendor = add_vendor(payload=vendor_payload, db=db)

                    spoc_payload = vs.NewVendorSpoc(
                        vendor_id=vendor.id,
                        full_name=row["Vendor SPOC Name"],
                        mobile_number=row["Vendor SPOC Mobile"] or None,
                    )

                    vendor_spoc = await add_new_vendor_spoc(
                        payload=spoc_payload, db=db, photo=None
                    )

                candidate = db.scalar(
                    select(Candidate).where(
                        Candidate.id == str(row.get("E.No", "")).strip()
                    )
                )

                if not candidate:
                    print(f"Candidate not found: {row.get('E.No')}")
                    continue

                if not candidate.vendor_spoc_id:
                    candidate.vendor_spoc_id = vendor_spoc.id
                    db.add(candidate)

                db.commit()

            except Exception as e:
                db.rollback()
                print(f"DB ERROR at row {idx}:", e)

    finally:
        db.close()  # ✅ ABSOLUTELY REQUIRED


asyncio.run(map_vendor_to_beneficiary())
