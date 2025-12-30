from db.connection import get_db_conn
from models import Candidate
from sqlalchemy import select

gift_code: int = 2001340431168357

db = next(get_db_conn())

candidates = db.scalars(select(Candidate)).all()

for cand in candidates:
    if cand.gift_card_code is None:
        print("added gift card code")
        cand.gift_card_code = str(gift_code)
        db.commit()
        gift_code = gift_code + 1
