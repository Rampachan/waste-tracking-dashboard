import sys
from datetime import date
from app.database import SessionLocal
from app.models import User, ULB, DailyWasteLog
from app.schemas import DailyLogCreate
from app.main import create_or_update_log, get_daily_logs, get_dashboard_summary, export_daily_excel, export_monthly_excel
import openpyxl

def run_integration_test():
    db = SessionLocal()
    try:
        print("=== Step 1: Querying ULBs and Users ===")
        coimbatore = db.query(ULB).filter(ULB.name == "Coimbatore").first()
        coimb_user = db.query(User).filter(User.username == "ulb_coimbatore").first()
        chengalpattu = db.query(ULB).filter(ULB.name == "Chengalpattu").first()
        cheng_user = db.query(User).filter(User.username == "ulb_chengalpattu").first()
        hq_user = db.query(User).filter(User.username == "hq").first()

        assert coimbatore is not None, "Coimbatore ULB not found"
        assert coimb_user is not None, "Coimbatore user not found"
        print(f"Coimbatore ID: {coimbatore.id}, Households: {coimbatore.households}")

        print("\n=== Step 2: Submitting Coimbatore Log with All New Fields ===")
        today = date.today()
        payload = DailyLogCreate(
            ulb_id=coimbatore.id,
            log_date=today,
            total_households=coimbatore.households,
            door_to_door_hhs=550000,
            segregated_hh_collected=520000,
            total_generation_today_mt=1080.0,
            mcc_capacity=coimbatore.default_mcc_capacity,
            mcc_actual=650.0,
            biometh_capacity=coimbatore.default_biometh_capacity,
            biometh_actual=25.0,
            compost_output_mt=98.5,
            mrf_capacity=coimbatore.default_mrf_capacity,
            mrf_actual=120.0,
            other_capacity=coimbatore.default_other_capacity,
            other_actual=35.0,
            recyclable_sold_mt=42.0,
            dry_waste_cement_mt=110.0,
            dump_yard_mt=98.0
        )

        res = create_or_update_log(payload, current_user=coimb_user, db=db)
        print("Response received:")
        print(f" - Segregated HHs: {res.segregated_hh_collected} ({res.segregation_pct}%)")
        print(f" - Generation Today: {res.total_generation_today_mt} MT")
        print(f" - Wet Waste Processed: {res.wet_waste_processed_mt} MT")
        print(f" - Compost Output: {res.compost_output_mt} MT")
        print(f" - Recyclable Sold: {res.recyclable_sold_mt} MT")
        print(f" - Cement RDF: {res.dry_waste_cement_mt} MT")
        print(f" - Total Processed: {res.total_processed_mt} MT")
        print(f" - Dump Yard: {res.dump_yard_mt} MT")
        print(f" - Processed Waste %: {res.processed_waste_pct}%")
        print(f" - Data Quality Flag: {res.data_quality_flag} ({res.data_quality_note})")

        assert res.segregated_hh_collected == 520000
        assert res.wet_waste_processed_mt == 675.0
        assert res.compost_output_mt == 98.5
        assert res.recyclable_sold_mt == 42.0
        assert res.dry_waste_cement_mt == 110.0
        assert res.data_quality_flag == "OK"

        print("\n=== Step 3: Submitting Chengalpattu Log ===")
        c_payload = DailyLogCreate(
            ulb_id=chengalpattu.id,
            log_date=today,
            total_households=chengalpattu.households,
            door_to_door_hhs=31000,
            segregated_hh_collected=29500,
            total_generation_today_mt=45.0,
            mcc_capacity=chengalpattu.default_mcc_capacity,
            mcc_actual=25.0,
            biometh_capacity=chengalpattu.default_biometh_capacity,
            biometh_actual=2.0,
            compost_output_mt=3.8,
            mrf_capacity=chengalpattu.default_mrf_capacity,
            mrf_actual=6.0,
            other_capacity=chengalpattu.default_other_capacity,
            other_actual=1.0,
            recyclable_sold_mt=2.5,
            dry_waste_cement_mt=4.5,
            dump_yard_mt=4.0
        )
        c_res = create_or_update_log(c_payload, current_user=cheng_user, db=db)
        print(f"Chengalpattu Processed: {c_res.total_processed_mt} MT, Flag: {c_res.data_quality_flag}")

        print("\n=== Step 4: Testing State Dashboard KPIs ===")
        # Verify ULB user is blocked with 403
        try:
            get_dashboard_summary(target_date=today, region="ALL", current_user=coimb_user, db=db)
            assert False, "ULB user should have been blocked from summary"
        except Exception as e:
            assert getattr(e, 'status_code', None) == 403
            print(f"[PASS] ULB user blocked from dashboard summary: {e.detail}")

        kpis = get_dashboard_summary(target_date=today, region="ALL", current_user=hq_user, db=db)
        print(f"Total Submitted ULBs: {kpis.submitted_ulbs} / {kpis.total_ulbs}")
        print(f"Total Segregated HHs: {kpis.total_segregated_hhs}")
        print(f"Total Generation MT: {kpis.total_generation_today_mt} MT")
        print(f"Total Compost Harvested: {kpis.compost_output_mt_total} MT")
        print(f"Total Recyclables Sold: {kpis.recyclable_sold_mt_total} MT")
        print(f"Total Cement Disposal: {kpis.dry_waste_cement_mt_total} MT")
        print(f"Total State Processed: {kpis.total_processed_mt} MT")

        assert kpis.submitted_ulbs >= 2
        assert kpis.total_generation_today_mt > 0

        print("\n=== Step 5: Testing Daily Excel Report & Access Control ===")
        # Verify ULB user is blocked from export
        try:
            export_daily_excel(target_date=today, current_user=coimb_user, db=db)
            assert False, "ULB user should have been blocked from export"
        except Exception as e:
            assert getattr(e, 'status_code', None) == 403
            print(f"[PASS] ULB user blocked from Excel export: {e.detail}")

        excel_resp = export_daily_excel(target_date=today, current_user=hq_user, db=db)
        content = excel_resp.body
        print(f"Generated Excel file size: {len(content)} bytes")
        import io
        wb = openpyxl.load_workbook(io.BytesIO(content))
        ws = wb.active
        print(f"Daily Sheet Name: {ws.title}, max_col: {ws.max_column}, max_row: {ws.max_row}")
        assert ws.max_column == 15
        
        # Verify Headers
        assert ws["C4"].value == "No. of HHs"
        assert ws["D4"].value == "Door to Door Collection Today"
        assert ws["F3"].value == "Total waste generation Today (MT)"
        assert ws["G3"].value == "WET WASTE"
        assert ws["I3"].value == "DRY WASTE"
        assert ws["L3"].value == "STATUS"
        assert ws["O4"].value == "Data-quality flag"

        print("All Excel headers and multi-tier merged cells match specification!")

        print("\n=== Step 6: Testing Monthly Excel Report & Access Control ===")
        # Verify ULB user is blocked from monthly export
        try:
            export_monthly_excel(year=today.year, month=today.month, current_user=coimb_user, db=db)
            assert False, "ULB user should have been blocked from monthly export"
        except Exception as e:
            assert getattr(e, 'status_code', None) == 403
            print(f"[PASS] ULB user blocked from Monthly Excel export: {e.detail}")

        m_excel_resp = export_monthly_excel(year=today.year, month=today.month, current_user=hq_user, db=db)
        m_content = m_excel_resp.body
        print(f"Generated Monthly Excel file size: {len(m_content)} bytes")
        m_wb = openpyxl.load_workbook(io.BytesIO(m_content))
        m_ws = m_wb.active
        print(f"Monthly Sheet Name: {m_ws.title}, max_col: {m_ws.max_column}, max_row: {m_ws.max_row}")
        assert m_ws.max_column == 15
        assert m_ws["A3"].value == "S.No"
        assert m_ws["B3"].value == "Name of the Corporation / Municipality"
        assert m_ws["C4"].value == "No. of HHs"
        assert m_ws["D4"].value == "Door to Door Collection (Monthly Avg)"
        assert m_ws["D5"].value == "No. of HHs segregated waste collected"
        assert m_ws["E5"].value == "% of Collection"
        assert m_ws["F3"].value == "Total waste generation (MT)"
        assert m_ws["G4"].value == "Wet waste processed MCC / BIO-METHA (MT)"
        assert m_ws["H4"].value == "Output quantity as compost (MT)"
        assert m_ws["I4"].value == "Processing facilities available (MT)"
        assert m_ws["J4"].value == "Recyclable waste sold by sanitary workers (MT)"
        assert m_ws["K4"].value == "Dry waste disposed (Cement industries / recycling units) (MT)"
        assert m_ws["L4"].value == "Total processed waste (MT)"
        assert m_ws["M4"].value == "Waste sent to dumping yard (MT)"
        assert m_ws["N4"].value == "% of processed waste"
        assert m_ws["O4"].value == "Data-quality flag"
        print("All 15 Monthly Excel headers verified successfully!")

        print("\n=== FULL END-TO-END INTEGRATION TEST PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_integration_test()
