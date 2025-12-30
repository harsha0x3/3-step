import pandas as pd
from db.connection import get_db_conn
from sqlalchemy import select
from models import Candidate, VendorSpoc

csv_path = r"C:\Users\harshavardhancg\Downloads\Final Sheet - 1378 Nos(FINAL 8YRS ABOVE - 1378 Nos)(Final Sheet - 1378 Nos(FINAL 8Y).csv"


def read_data(path: str) -> pd.DataFrame:
    print("Reading..")
    df = pd.read_csv(path) if path.endswith(".csv") else pd.read_excel(path)
    return df


def map_vendor_to_beneficiary():
    print("Started..")
    data = read_data(csv_path).fillna("")  # ✅ fix NaN issue
    for idx, row in data.iterrows():
        print(f"Processing {idx}")
        for db in get_db_conn():
            try:
                vendor_spoc = db.scalar(
                    select(VendorSpoc).where(
                        VendorSpoc.full_name
                        == str(row.get("Vendor SPOC Name", "Unknown"))
                    )
                )
                if not vendor_spoc:
                    print(
                        f"Vendor SPOC not found for row {idx} {row['Vendor SPOC Name']}"
                    )
                    continue
                candidate = db.scalar(
                    select(Candidate).where(
                        Candidate.id == str(row.get("E.No", "Unknown"))
                    )
                )
                if not candidate:
                    print(f"Candidate not found for row {idx} {row['E.No']}")
                    continue
                if not candidate.vendor_spoc_id:
                    candidate.vendor_spoc_id = vendor_spoc.id
                    print("Data mapped")
                db.add(candidate)
                db.commit()
            except Exception as e:
                print(f"DB ERROR at row {idx}:", e)


map_vendor_to_beneficiary()
