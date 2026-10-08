from app.database import SessionLocal, engine, Base
from app.models import ULB, DailyWasteLog, User
from app.master_data import ULB_DATA
from app.seed import seed_database
import os

db = SessionLocal()
try:
    print("Updating ULBs with official static figures...")
    for item in ULB_DATA:
        ulb = db.query(ULB).filter(ULB.name == item["name"]).first()
        if ulb:
            ulb.households = item["households"]
            ulb.default_mcc_capacity = item["mcc"]
            ulb.default_mrf_capacity = item["mrf"]
            ulb.default_biometh_capacity = item["biometh"]
            ulb.default_other_capacity = item["other"]
    db.commit()
    print("All 169 ULBs updated with official figures!")
finally:
    db.close()
