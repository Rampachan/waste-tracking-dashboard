import sys
import os
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.models import ULB, User, SwmFacility, DailyWasteLog, DailyFacilityLog

def run_tests():
    print("==================================================")
    print(" RUNNING END-TO-END SWM FACILITY INTEGRATION TESTS")
    print("==================================================")

    # Re-seed database to ensure standard test state
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    client = TestClient(app)

    # 1. Login as ULB operator for ULB #1
    print("\n1. Testing Login as ULB Operator...")
    db_sess = SessionLocal()
    ulb1_user = db_sess.query(User).filter(User.ulb_id == 1).first()
    db_sess.close()

    assert ulb1_user is not None, "ULB #1 user not found in DB"
    res = client.post("/api/auth/login", json={"username": ulb1_user.username, "password": "ulb@123"})
    assert res.status_code == 200, f"Login failed for {ulb1_user.username}: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   [OK] Login successful for '{ulb1_user.username}'. Received JWT token.")

    # 2. Get facilities for ULB #1
    print("\n2. Testing GET /api/swm/facilities for ULB #1...")
    res = client.get("/api/swm/facilities", headers=headers)
    assert res.status_code == 200, f"Get facilities failed: {res.text}"
    facs = res.json()
    print(f"   [OK] Facilities fetched successfully: {len(facs)} facilities found.")
    mcc_facs = [f for f in facs if f["facility_type"] == "MCC"]
    mrf_facs = [f for f in facs if f["facility_type"] == "MRF"]
    print(f"     - MCC facilities: {[f['name'] for f in mcc_facs]}")
    print(f"     - MRF facilities: {[f['name'] for f in mrf_facs]}")

    assert len(mcc_facs) >= 2, "Expected at least 2 MCC facilities"
    assert len(mrf_facs) >= 2, "Expected at least 2 MRF facilities"

    # 3. Create a new custom MCC facility
    print("\n3. Testing POST /api/swm/facilities (Create new MCC)...")
    res = client.post("/api/swm/facilities", json={
        "ulb_id": 1,
        "facility_type": "MCC",
        "name": "MCC #3 - East Gate",
        "capacity_mt": 3.5,
        "location": "Ward 15"
      }, headers=headers)
    assert res.status_code == 200, f"Create facility failed: {res.text}"
    new_fac = res.json()
    print(f"   [OK] Facility created with ID {new_fac['id']}: {new_fac['name']}")

    # 4. Submit Daily Log with Itemized Facility Inputs
    print("\n4. Testing POST /api/logs with Itemized Facility Processing Details...")
    today_str = date.today().isoformat()
    facility_logs_payload = [
        {"facility_id": mcc_facs[0]["id"], "actual_processed_mt": 1.8, "operational_status": "Operational", "notes": "Full load"},
        {"facility_id": mcc_facs[1]["id"], "actual_processed_mt": 2.2, "operational_status": "Operational", "notes": ""},
        {"facility_id": new_fac["id"], "actual_processed_mt": 3.0, "operational_status": "Operational", "notes": "New unit"},
        {"facility_id": mrf_facs[0]["id"], "actual_processed_mt": 1.5, "operational_status": "Operational", "notes": "Sorting active"},
        {"facility_id": mrf_facs[1]["id"], "actual_processed_mt": 2.5, "operational_status": "Operational", "notes": ""}
    ]

    log_payload = {
        "ulb_id": 1,
        "log_date": today_str,
        "total_households": 20000,
        "door_to_door_hhs": 18500,
        "segregated_hh_collected": 18000,
        "total_generation_today_mt": 25.0,
        "mcc_capacity": 7.5,
        "mcc_actual": 0.0,  # Should be auto-computed from itemized logs (1.8+2.2+3.0 = 7.0)
        "biometh_capacity": 1.0,
        "biometh_actual": 0.5,
        "mrf_capacity": 5.0,
        "mrf_actual": 0.0,  # Should be auto-computed from itemized logs (1.5+2.5 = 4.0)
        "other_capacity": 0.0,
        "other_actual": 0.0,
        "compost_output_mt": 1.2,
        "recyclable_sold_mt": 0.8,
        "dry_waste_cement_mt": 1.0,
        "dump_yard_mt": 2.0,
        "facility_logs": facility_logs_payload
    }

    res = client.post("/api/logs", json=log_payload, headers=headers)
    assert res.status_code == 200, f"Submit log failed: {res.text}"
    log_data = res.json()
    print("   [OK] Daily log submitted successfully!")
    print(f"     - Computed MCC Actual: {log_data['mcc_actual']} MT (Expected: 7.0 MT)")
    print(f"     - Computed MRF Actual: {log_data['mrf_actual']} MT (Expected: 4.0 MT)")
    print(f"     - Wet Waste Processed: {log_data['wet_waste_processed_mt']} MT")
    print(f"     - Itemized Facility Logs Returned: {len(log_data['facility_logs'])} entries")

    assert abs(log_data['mcc_actual'] - 7.0) < 0.01, f"Expected 7.0, got {log_data['mcc_actual']}"
    assert abs(log_data['mrf_actual'] - 4.0) < 0.01, f"Expected 4.0, got {log_data['mrf_actual']}"

    # 5. Check State Summary Dashboard Endpoint
    print("\n5. Testing State Summary Dashboard (GET /api/dashboard/summary)...")
    res_dir = client.post("/api/auth/login", json={"username": "director", "password": "director@123"})
    assert res_dir.status_code == 200, f"Director login failed: {res_dir.text}"
    dir_token = res_dir.json()["access_token"]
    dir_headers = {"Authorization": f"Bearer {dir_token}"}
    res = client.get("/api/dashboard/summary", headers=dir_headers)
    assert res.status_code == 200, f"Dashboard summary failed: {res.text}"
    summary = res.json()
    print(f"   [OK] Dashboard summary verified: Total processed MT: {summary['total_processed_mt']}")

    print("\n==================================================")
    print(" ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
