import pandas as pd
from sqlalchemy import select, and_
from db.connection import get_db_conn
from models import Candidate

csv_path = r"C:\Users\harshavardhancg\Downloads\Employee MAster List_Titan with Card no(FINAL 8YRS ABOVE).csv"


def clean(val):
    if pd.isna(val):
        return None
    return str(val).replace("\xa0", " ").strip()


def dump_gift_card_codes():
    print("IN")
    df = pd.read_csv(csv_path, dtype={"CROMA GIFT CARD": str})
    df = df.drop_duplicates()

    db = next(get_db_conn())  # ✅ correct

    try:
        for _, row in df.iterrows():
            try:
                candidate = db.scalar(
                    select(Candidate).where(
                        and_(
                            Candidate.full_name == clean(row["Name"]),
                            Candidate.division == clean(row["Division Name"]),
                            Candidate.city == clean(row["City"]),
                        )
                    )
                )

                if not candidate:
                    print(
                        f"No candidate - {getattr(row, 'CROMA GIFT CARD')} - {row['Name']} - {row['Division Name']}"
                    )
                    continue
                if candidate.gift_card_code:
                    print(
                        f"gift card exists id: {candidate.id} - {candidate.gift_card_code}"
                    )
                    continue

                candidate.gift_card_code = row["CROMA GIFT CARD"]

            except Exception as e:
                db.rollback()
                # print(e)
                with open("new_errs.txt", "a", encoding="utf-8") as f:
                    f.write(f"{str(e)} - \n {str(row)} \n")

        db.commit()
    finally:
        db.close()


dump_gift_card_codes()
