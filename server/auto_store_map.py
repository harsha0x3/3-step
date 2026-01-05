import pandas as pd
from db.connection import get_db_conn
from sqlalchemy import select, func
from models import Candidate, Store

csv_path = r"C:\Users\harshavardhancg\Downloads\Copy of Final Sheet - 1378 Nos(FINAL 8YRS ABOVE - 1378 Nos)(Final Sheet - 1378 Nos(FINAL 8Y) (1).csv"


def map_stores():
    df = pd.read_csv(csv_path)
    print(f"SHAPE: - {df.shape} \n")

    for idx, row in df.iterrows():
        print(f"Processing - {idx}")
        try:
            db = next(get_db_conn())
            candidate = db.scalar(
                select(Candidate).where(Candidate.id == row.get("E.No", "").strip())
            )
            if not candidate:
                with open("store_map_logs.log", "a", encoding="utf-8") as f:
                    f.write(f"Candidate not found - id: {row.get('E.No', '')} \n")
                continue
            store = db.scalar(
                select(Store).where(Store.id == row.get("Store Code", ""))
            )

            if not store:
                with open("store_map_logs.log", "a", encoding="utf-8") as f:
                    f.write(f"Store not found - id: {row.get('Store Code', '')} \n")
                continue
            candidate.store_id = store.id
            db.commit()
            print(f"Mapped Data")
        except Exception as e:
            print("Error", e)


map_stores()
