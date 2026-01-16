from db.connection import get_db_conn
from models import Candidate
from sqlalchemy import select
import pandas as pd

csv_path = r"C:\Users\harshavardhancg\Downloads\UPDATED GV _ CORP(Sheet1).csv"


def correct_gift_cards():
    db = next(get_db_conn())
    df = pd.read_csv(csv_path, dtype={"GV-1": str, "GV 2 - UPDATED": str})
    print("df.shape", df.shape)
    uneq = []
    eq = []

    no_cands = []
    for _, row in df.iterrows():
        try:
            cand = db.scalar(select(Candidate).where(Candidate.id == row["E>NO"]))
            if not cand:
                no_cands.append(row["E>NO"])
                continue
            if cand.gift_card_code == row["GV-1"]:
                eq.append(cand.id)
            if (
                row["GV 2 - UPDATED"] != "0"
                and cand.gift_card_code != row["GV 2 - UPDATED"]
            ):
                uneq.append(cand.id)
                cand.gift_card_code = row["GV 2 - UPDATED"]
                db.commit()
        except Exception as e:
            print("ERR", e)

    print("No cands", no_cands)
    print()
    print("LEn of No Cands", len(no_cands))
    print()
    print("UNEq", uneq)
    print()
    print("LEn of uneq", len(uneq))
    print("LEn of eq", len(eq))


correct_gift_cards()
