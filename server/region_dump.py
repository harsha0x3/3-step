import pandas as pd
from db.connection import get_db_conn
from controllers.region_controller import create_new_region
from sqlalchemy import select, func

from models import Region, User, RegionUserAssociation, Candidate

csv_path = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\notebooks\distribution_locations.csv"
hr_regions_csv = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\notebooks\hrs_with_regions.csv"
bens_csv = r"C:\Users\harshavardhancg\CodeBase\hard_verify\server\Beneficiaries_with_gift_cards.csv"


def dump_regions():
    df = pd.read_csv(csv_path)
    print("DF SHAPE ", df.shape)
    print("COLUMNS ", df.columns)
    db = next(get_db_conn())
    for _, row in df.iterrows():
        try:
            create_new_region(db=db, name=row["Distrubution location"])
        except Exception as e:
            print("Error: >> \n", e)
            continue


# dump_regions()


def map_regions_to_hr():
    df = pd.read_csv(hr_regions_csv)
    print("DF SHAPE ", df.shape)
    print("COLUMNS ", df.columns)
    db = next(get_db_conn())
    for _, row in df.iterrows():
        try:
            user = db.scalar(
                select(User).where(
                    func.lower(User.full_name) == row["ADMIN /HR SPOC"].lower()
                )
            )
            if not user:
                print(" NO USER ", row["ADMIN /HR SPOC"].lower())
            region = db.scalar(
                select(Region).where(
                    func.lower(Region.name) == row["Distrubution location"]
                )
            )
            if not region:
                print(" NO REGION ", row["Distrubution location"])

            new_reg_user_ass = RegionUserAssociation(
                user_id=user.id, region_id=region.id
            )
            db.add(new_reg_user_ass)
            db.commit()
            db.refresh(new_reg_user_ass)
        except Exception as e:
            print("ERROR :", e)
            continue


# map_regions_to_hr()


def map_regions_to_bens():
    df = pd.read_csv(bens_csv)
    print("DF SHAPE ", df.shape)
    print("COLUMNS ", df.columns)
    db = next(get_db_conn())
    for _, row in df.iterrows():
        try:
            candidate = db.scalar(select(Candidate).where(Candidate.id == row["E.No"]))
            if not candidate:
                print("NO candidate found")
                continue
            region = db.scalar(
                select(Region).where(
                    func.lower(Region.name) == row["Distrubution location"]
                )
            )
            if not region:
                print(" NO REGION ", row["Distrubution location"])
                continue

            candidate.region_id = region.id
            db.commit()

        except Exception as e:
            print("ERROR :", e)
            continue


# map_regions_to_bens()


def add_region():
    name = "test_region"
    db = next(get_db_conn())
    try:
        create_new_region(db=db, name=name)
    except Exception as e:
        print("ERROR in adding region", e)


# add_region()


def map_test_regions():
    db = next(get_db_conn())
    users = db.scalars(select(User).where(User.role == "registration_officer")).all()
    count = 0
    for usr in users:
        if not usr.regions:
            try:
                new_usr_assoc = RegionUserAssociation(
                    region_id="e8f74ca2-eee4-4db6-8007-68a8ff30d825", user_id=usr.id
                )
                db.add(new_usr_assoc)
                db.commit()
            except Exception as e:
                print("ERRO ", e)
                continue

    print("COUNT ", count)


map_test_regions()
