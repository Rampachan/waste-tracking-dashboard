from datetime import date

BASE_URL = "http://127.0.0.1:8000"

def test_system():
    print("--- Starting End-to-End Test ---")
    
    # 1. Login as Director
    from app.database import SessionLocal
    from app.security import verify_password
    from app.models import User, ULB, DailyWasteLog
    from app.main import login, LoginRequest, get_dashboard_summary, export_daily_excel, export_monthly_excel
    
    db = SessionLocal()
    try:
        # Check ULB counts
        ulb_count = db.query(ULB).count()
        print(f"[PASS] Total ULBs in database: {ulb_count} (Expected: 169)")
        assert ulb_count == 169, f"Expected 169 ULBs, found {ulb_count}"

        # Test Director login
        dir_user = db.query(User).filter(User.username == "director").first()
        assert dir_user is not None
        assert verify_password("director@123", dir_user.password_hash)
        print("[PASS] Director authentication verified.")

        # Test HQ login
        hq_user = db.query(User).filter(User.username == "hq").first()
        assert hq_user is not None
        assert verify_password("hq@123", hq_user.password_hash)
        print("[PASS] HQ authentication verified.")

        # Test ULB logins (Coimbatore & Chengalpattu)
        coimb_user = db.query(User).filter(User.username == "ulb_coimbatore").first()
        assert coimb_user is not None
        assert coimb_user.ulb.name == "Coimbatore"
        print(f"[PASS] Coimbatore ULB user verified (Bound to ULB: {coimb_user.ulb.name}).")

        cheng_user = db.query(User).filter(User.username == "ulb_chengalpattu").first()
        assert cheng_user is not None
        assert cheng_user.ulb.name == "Chengalpattu"
        print(f"[PASS] Chengalpattu ULB user verified (Bound to ULB: {cheng_user.ulb.name}).")

        # Test Dashboard KPIs calculation
        summary = get_dashboard_summary(date.today(), "ALL", db)
        print(f"[PASS] State Summary calculated:")
        print(f"       - Submitted ULBs: {summary.submitted_ulbs} / {summary.total_ulbs} ({summary.compliance_pct}%)")
        print(f"       - State Total Processed: {summary.total_processed_mt} MT")
        print(f"       - State Dump Yard: {summary.dump_yard_mt_total} MT")
        print(f"       - Landfill Diversion Rate: {summary.landfill_diversion_rate_pct}%")

        # Test Daily Excel export
        daily_resp = export_daily_excel(date.today(), db)
        print(f"[PASS] Daily Excel exported successfully (Size: {len(daily_resp.body)} bytes).")
        assert len(daily_resp.body) > 10000

        # Test Monthly Excel export
        monthly_resp = export_monthly_excel(2026, 9, db)
        print(f"[PASS] Monthly Excel exported successfully (Size: {len(monthly_resp.body)} bytes).")
        assert len(monthly_resp.body) > 5000

        print("\n ALL SYSTEM TESTS PASSED SUCCESSFULLY!")
    finally:
        db.close()

if __name__ == "__main__":
    test_system()
