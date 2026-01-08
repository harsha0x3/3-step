import pandas as pd
from sqlalchemy import select, and_
from db.connection import get_db_conn
from models import Candidate

csv_path = r"C:\Users\harshavardhancg\Downloads\Final Sheet - 1378 Nos(FINAL 8YRS ABOVE - 1378 Nos) new(Final Sheet - 1378 Nos(FINAL 8Y).csv"


def clean(val):
    if pd.isna(val):
        return None
    return str(val).replace("\xa0", " ").strip()


def dump_gift_card_codes():
    print("IN")
    df = pd.read_csv(csv_path, dtype={"CROMA Gift Card": str, "E.No": str})
    df = df.drop_duplicates()
    print("DATA SHAPe ", df.shape)

    db = next(get_db_conn())  # ✅ correct

    try:
        not_found_cands_count = 0
        not_found_cands = []
        added_cands = 0
        no_gift_cards = []

        for _, row in df.iterrows():
            try:
                candidate = db.scalar(
                    select(Candidate).where(and_(Candidate.id == row["E.No"].strip()))
                )

                if not candidate:
                    not_found_cands_count += 0
                    print(
                        f"No candidate - {getattr(row, 'CROMA Gift Card')} - {row['E.No']} - {row['Name']} - {row['Division Name']}"
                    )
                    not_found_cands.append(
                        f"No candidate - {getattr(row, 'CROMA Gift Card')} - {row['E.No']} - {row['Name']} - {row['Division Name']}"
                    )
                    continue

                if pd.isna(row["CROMA Gift Card"]):
                    print(f"GIFT CARD IS EMPTY - {row['E.No']} - {row['Name']}")
                    no_gift_cards.append(
                        f"GIFT CARD IS EMPTY - {row['E.No']} - {row['Name']}"
                    )
                    continue
                candidate.gift_card_code = row["CROMA Gift Card"]
                db.commit()

                added_cands += 1

            except Exception as e:
                db.rollback()
                print(e)
                with open("new_errs.txt", "a", encoding="utf-8") as f:
                    f.write(f"{str(e)} - \n {str(row)} \n")

        print("\n---------------------------------------\n")
        print("not_found_cands: ", not_found_cands)
        print("\n---------------------------------------\n")
        print("not_found_cands len: ", len(not_found_cands))
        print("\n---------------------------------------\n")
        print("added_cands ", added_cands)
        print("\n---------------------------------------\n")
        print("no_gift_cards ", no_gift_cards)
        print("\n---------------------------------------\n")

    finally:
        db.close()


dump_gift_card_codes()
