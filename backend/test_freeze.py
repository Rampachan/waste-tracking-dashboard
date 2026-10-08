from app.database import SessionLocal
from app.models import User, ULB, DailyWasteLog
from app.schemas import DailyLogCreate, ULBUpdate
from app.main import create_or_update_log, update_ulb_static_baseline
from datetime import date
from fastapi import HTTPException

db = SessionLocal()
try:
    print("--- Testing Static Data Freeze & Access Control ---")

    coimb_user = db.query(User).filter(User.username == "ulb_coimbatore").first()
    hq_user = db.query(User).filter(User.username == "hq").first()
    coimb_ulb = db.query(ULB).filter(ULB.name == "Coimbatore").first()

    orig_hh = coimb_ulb.households
    orig_mcc = coimb_ulb.default_mcc_capacity
    print(f"Original Coimbatore Static Data -> Households: {orig_hh}, MCC Capacity: {orig_mcc} MT")

    # 1. Verify ULB user CANNOT edit static baseline via endpoint
    try:
        update_ulb_static_baseline(coimb_ulb.id, ULBUpdate(households=999999), current_user=coimb_user, db=db)
        assert False, "ULB user was able to call update_ulb_static_baseline!"
    except HTTPException as e:
        print(f"[PASS] ULB user blocked from editing master baseline: {e.status_code} ({e.detail})")

    # 2. Verify ULB user submitting daily log with fake households/capacities gets overridden by frozen master data
    fake_payload = DailyLogCreate(
        ulb_id=coimb_ulb.id,
        log_date=date.today(),
        total_households=12345, # Attempting to tamper
        door_to_door_hhs=500000,
        mcc_capacity=999.0,     # Attempting to tamper
        mcc_actual=400.0,
        mrf_capacity=888.0,
        mrf_actual=25.0,
        biometh_capacity=777.0,
        biometh_actual=0.0,
        other_capacity=666.0,
        other_actual=100.0,
        dump_yard_mt=50.0
    )

    resp = create_or_update_log(fake_payload, current_user=coimb_user, db=db)
    print(f"[PASS] ULB user submitted daily log.")
    print(f"       Recorded Households: {resp.total_households} (Expected: {orig_hh})")
    print(f"       Recorded MCC Capacity: {resp.mcc_capacity} (Expected: {orig_mcc})")
    assert resp.total_households == orig_hh, f"Expected {orig_hh}, got {resp.total_households}"
    assert resp.mcc_capacity == orig_mcc, f"Expected {orig_mcc}, got {resp.mcc_capacity}"

    # 3. Verify HQ user CAN update master baseline
    hq_update = update_ulb_static_baseline(coimb_ulb.id, ULBUpdate(default_other_capacity=360.0), current_user=hq_user, db=db)
    print(f"[PASS] HQ user updated master baseline: other capacity is now {hq_update.default_other_capacity} MT")

    # Revert to original
    update_ulb_static_baseline(coimb_ulb.id, ULBUpdate(default_other_capacity=350.0), current_user=hq_user, db=db)
    print(f"[PASS] Reverted test change.")

    print("\n ALL FREEZE & ACCESS CONTROL TESTS PASSED SUCCESSFULLY!")
finally:
    db.close()
