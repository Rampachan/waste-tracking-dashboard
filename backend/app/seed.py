from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import ULB, User, DailyWasteLog
from .security import hash_password
from .master_data import ULB_DATA

def clean_username(name: str) -> str:
    cleaned = "".join([c.lower() if c.isalnum() else "_" for c in name])
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return f"ulb_{cleaned.strip('_')}"

def seed_database(db: Session):
    Base.metadata.create_all(bind=engine)

    # 1. Seed ULBs if table is empty
    existing_count = db.query(ULB).count()
    if existing_count < len(ULB_DATA):
        print(f"Seeding {len(ULB_DATA)} ULBs...")
        for item in ULB_DATA:
            existing = db.query(ULB).filter(ULB.name == item["name"]).first()
            if not existing:
                ulb = ULB(
                    s_no=item["s_no"],
                    region=item["region"],
                    category=item["category"],
                    name=item["name"],
                    households=item["households"],
                    default_mcc_capacity=item["mcc"],
                    default_mrf_capacity=item["mrf"],
                    default_biometh_capacity=item["biometh"],
                    default_other_capacity=item["other"]
                )
                db.add(ulb)
        db.commit()
        print("ULBs seeded successfully.")

    # 2. Seed Administrative Users
    default_password_hash = hash_password("director@123")
    hq_password_hash = hash_password("hq@123")
    admin_password_hash = hash_password("admin@123")
    ulb_password_hash = hash_password("ulb@123")

    if not db.query(User).filter(User.username == "director").first():
        db.add(User(
            username="director",
            password_hash=default_password_hash,
            role="DIRECTOR",
            full_name="Director of Municipal Administration"
        ))

    if not db.query(User).filter(User.username == "hq").first():
        db.add(User(
            username="hq",
            password_hash=hq_password_hash,
            role="HQ_USER",
            full_name="HQ State Command Centre Officer"
        ))

    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(
            username="admin",
            password_hash=admin_password_hash,
            role="ADMIN",
            full_name="System Administrator"
        ))
    db.commit()

    # 3. Seed ULB Operator Accounts for each ULB
    all_ulbs = db.query(ULB).all()
    for ulb in all_ulbs:
        u_name = clean_username(ulb.name)
        user_exists = db.query(User).filter(User.username == u_name).first()
        if not user_exists:
            db.add(User(
                username=u_name,
                password_hash=ulb_password_hash,
                role="ULB_USER",
                full_name=f"{ulb.name} Municipal In-charge",
                ulb_id=ulb.id
            ))
    db.commit()

    # 3.5. Seed Default SWM Processing Facilities (MCCs & MRFs) for each ULB
    from .models import SwmFacility, DailyFacilityLog
    facility_count = db.query(SwmFacility).count()
    if facility_count == 0:
        print("Seeding default MCC and MRF facilities for all ULBs...")
        for ulb in all_ulbs:
            # Seed MCC Facilities (Wet Waste)
            mcc_cap = ulb.default_mcc_capacity or 10.0
            if mcc_cap > 0:
                cap1 = round(mcc_cap * 0.6, 2)
                cap2 = round(mcc_cap * 0.4, 2)
                db.add(SwmFacility(
                    ulb_id=ulb.id,
                    facility_type="MCC",
                    name=f"{ulb.name} MCC #1 (Main Zone)",
                    capacity_mt=cap1,
                    location="Central Ward Compound",
                    status="ACTIVE"
                ))
                db.add(SwmFacility(
                    ulb_id=ulb.id,
                    facility_type="MCC",
                    name=f"{ulb.name} MCC #2 (North Zone)",
                    capacity_mt=cap2,
                    location="North Ward Compound",
                    status="ACTIVE"
                ))

            # Seed MRF Facilities (Dry Waste)
            mrf_cap = ulb.default_mrf_capacity or 7.0
            if mrf_cap > 0:
                cap1 = round(mrf_cap * 0.6, 2)
                cap2 = round(mrf_cap * 0.4, 2)
                db.add(SwmFacility(
                    ulb_id=ulb.id,
                    facility_type="MRF",
                    name=f"{ulb.name} MRF Centre #1 (Central)",
                    capacity_mt=cap1,
                    location="Railway Station Road",
                    status="ACTIVE"
                ))
                db.add(SwmFacility(
                    ulb_id=ulb.id,
                    facility_type="MRF",
                    name=f"{ulb.name} MRF Centre #2 (West)",
                    capacity_mt=cap2,
                    location="Industrial Estate",
                    status="ACTIVE"
                ))
        db.commit()
        print("Default MCC and MRF facilities seeded successfully.")

    # 4. Seed initial Daily Waste Logs (Past 7 days + Today)
    # Give ~135 ULBs a submission for today, leaving ~34 pending
    today = date.today()
    log_count = db.query(DailyWasteLog).count()
    if log_count < 100:
        print("Generating initial sample daily waste logs for demo...")
        random.seed(42)
        
        for day_offset in range(6, -1, -1):
            log_dt = today - timedelta(days=day_offset)
            
            # On past days, 95% submitted. On today, ~80% submitted
            submission_rate = 0.82 if day_offset == 0 else 0.95

            for ulb in all_ulbs:
                if random.random() > submission_rate:
                    continue # simulate pending

                existing_log = db.query(DailyWasteLog).filter(
                    DailyWasteLog.ulb_id == ulb.id,
                    DailyWasteLog.log_date == log_dt
                ).first()

                if not existing_log:
                    # Realistic variations
                    cov_rate = random.uniform(0.85, 0.99)
                    d2d_hhs = int(ulb.households * cov_rate)
                    pct = round((d2d_hhs / ulb.households) * 100, 2)

                    # Capacities & Actuals
                    mcc_act = round(ulb.default_mcc_capacity * random.uniform(0.75, 0.98), 2)
                    mrf_act = round(ulb.default_mrf_capacity * random.uniform(0.70, 0.95), 2)
                    bio_act = round(ulb.default_biometh_capacity * random.uniform(0.65, 0.92), 2)
                    oth_act = round(ulb.default_other_capacity * random.uniform(0.60, 0.90), 2)

                    # Total incoming processed
                    total_proc = mcc_act + mrf_act + bio_act + oth_act
                    # Dump yard is remaining fraction (e.g. 15-25% of total waste generated)
                    dump_yard = round(total_proc * random.uniform(0.12, 0.28), 2)

                    db.add(DailyWasteLog(
                        ulb_id=ulb.id,
                        log_date=log_dt,
                        total_households=ulb.households,
                        door_to_door_hhs=d2d_hhs,
                        collection_pct=pct,
                        mcc_capacity=ulb.default_mcc_capacity,
                        mcc_actual=mcc_act,
                        mrf_capacity=ulb.default_mrf_capacity,
                        mrf_actual=mrf_act,
                        biometh_capacity=ulb.default_biometh_capacity,
                        biometh_actual=bio_act,
                        other_capacity=ulb.default_other_capacity,
                        other_actual=oth_act,
                        dump_yard_mt=dump_yard
                    ))
        db.commit()
        print("Sample daily logs generated.")

    # 5. Seed UWM Baselines (170 ULBs) and Sample Daily UWM Logs
    from .models import UwmBaseline, DailyUwmLog
    import json, os

    uwm_count = db.query(UwmBaseline).count()
    json_path = os.path.join(os.path.dirname(__file__), "..", "uwm_170_data.json")
    if uwm_count < 170 and os.path.exists(json_path):
        print("Seeding UWM 170 Baselines from official dataset...")
        with open(json_path, "r", encoding="utf-8") as f:
            pdf_data = json.load(f)

        name_aliases = {
            "chengelpettu": "chengalpattu",
            "sriperumbudur": "sriperambudur",
            "thirupathur": "tirupathur",
            "pernampet": "pernambut",
            "sholinghur": "sholingur",
            "sankagiri": "sankari",
            "gudalur( c)": "gudalur (c)",
            "gudalur(c)": "gudalur (c)",
            "vellakovil": "vellakoil",
            "avinashi": "avanashi",
            "punjaipuliyampatti": "punjaipuliampatti",
            "gudalur(n)": "gudalur (n)",
            "pattukottai": "pattukkotai",
            "manaparai": "manapparai",
            "perumbalur": "perambalur",
            "virudhunagar": "virudhunager",
            "tiruchirappalli": "trichy",
            "thoothukudi": "thoothkudi"
        }

        ulb_map = {u.name.strip().lower(): u for u in db.query(ULB).all()}
        for item in pdf_data:
            s_no = item["s_no"]
            pdf_name = item["name"].strip()
            norm_name = pdf_name.lower()
            lookup_name = name_aliases.get(norm_name, norm_name)
            ulb = ulb_map.get(lookup_name)
            if not ulb:
                for k, v in ulb_map.items():
                    if lookup_name in k or k in lookup_name:
                        ulb = v
                        break
            if not ulb:
                continue

            baseline = db.query(UwmBaseline).filter(UwmBaseline.ulb_id == ulb.id).first()
            if not baseline:
                baseline = UwmBaseline(ulb_id=ulb.id, pdf_s_no=s_no)
                db.add(baseline)

            baseline.pdf_s_no = s_no
            baseline.total_sewage_generation_mld = item["sewage_gen_mld"]
            baseline.targeted_households = item["targeted_hh"]
            baseline.connected_households = item["connected_hh"]
            baseline.installed_stp_capacity_mld = item["installed_stp_mld"]
            if item["installed_stp_mld"] > 0:
                baseline.stp_location_name = f"{ulb.name} Central STP"
                baseline.no_of_pumping_stations = max(2, int(item["installed_stp_mld"] * 0.5) + 2)
                baseline.no_of_lifting_stations = max(1, int(item["installed_stp_mld"] * 0.3) + 1)
            else:
                baseline.stp_location_name = None
                baseline.no_of_pumping_stations = 1 if item["connected_hh"] > 0 else 0
                baseline.no_of_lifting_stations = 1 if item["connected_hh"] > 0 else 0

        db.commit()
        print("UWM 170 Baselines successfully seeded.")

    # Seed sample daily UWM logs for demo
    daily_uwm_count = db.query(DailyUwmLog).count()
    if daily_uwm_count < 100:
        print("Generating sample daily UWM operational logs...")
        all_baselines = db.query(UwmBaseline).all()
        for b in all_baselines:
            if random.random() > 0.85:
                continue # simulate pending

            existing_uwm_log = db.query(DailyUwmLog).filter(
                DailyUwmLog.ulb_id == b.ulb_id,
                DailyUwmLog.log_date == today
            ).first()

            if not existing_uwm_log:
                inflow = round(b.total_sewage_generation_mld * random.uniform(0.70, 0.95), 2)
                inst_stp = b.installed_stp_capacity_mld
                if inst_stp > 0:
                    util_mld = round(inst_stp * random.uniform(0.60, 0.98), 2)
                    util_pct = round((util_mld / inst_stp) * 100, 1)
                    stp_func = "Yes"
                    perf = "Compliant" if random.random() > 0.1 else "Within Limits"
                    reuse = round(util_mld * random.uniform(0.15, 0.40), 2)
                    sludge = round(util_mld * random.uniform(0.4, 0.8), 2)
                else:
                    util_mld = 0.0
                    util_pct = 0.0
                    stp_func = "No"
                    perf = "Not Applicable"
                    reuse = 0.0
                    sludge = 0.0

                func_ps = b.no_of_pumping_stations
                func_ls = b.no_of_lifting_stations

                db.add(DailyUwmLog(
                    ulb_id=b.ulb_id,
                    log_date=today,
                    sewage_inflow_mld=inflow,
                    stp_functional=stp_func,
                    stp_location_name=b.stp_location_name,
                    utilization_capacity_mld=util_mld,
                    utilization_pct=util_pct,
                    performance_standards=perf,
                    discharge_point="River" if inst_stp > 0 else "Drain",
                    treated_reuse_mld=reuse,
                    reuse_purpose="Gardening / Parks" if reuse > 0 else "None",
                    sludge_generation_mt=sludge,
                    sludge_management="Co-composting" if sludge > 0 else "None",
                    functional_pumping_stations=func_ps,
                    functional_lifting_stations=func_ls,
                    data_quality_flag="VALID"
                ))
        db.commit()
        print("Sample daily UWM logs seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
