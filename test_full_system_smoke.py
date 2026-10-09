import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://waste-tracking-dashboard.onrender.com"

def run_smoke_tests():
    print("==================================================")
    print(f" FULL SYSTEM COMPREHENSIVE SMOKE TEST: {BASE_URL}")
    print("==================================================")

    results = []

    def log_result(name, passed, detail=""):
        status_str = "[PASS]" if passed else "[FAIL]"
        print(f"{status_str} {name}: {detail}")
        results.append((name, passed, detail))

    # 1. Test Documentation / OpenAPI
    try:
        req = urllib.request.Request(f"{BASE_URL}/docs")
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            log_result("FastAPI Docs (/docs)", resp.status == 200, f"Status {resp.status}")
    except Exception as e:
        log_result("FastAPI Docs (/docs)", False, str(e))

    # 2. Test Reset-Seed Utility
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/auth/reset-seed")
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("DB Reset & Seeding (/api/auth/reset-seed)", resp.status == 200, f"Users: {data.get('total_users')}, ULBs: {data.get('total_ulbs')}")
    except Exception as e:
        log_result("DB Reset & Seeding (/api/auth/reset-seed)", False, str(e))

    # 3. Test Director Login
    dir_token = None
    try:
        payload = json.dumps({"username": "director", "password": "director@123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            dir_token = data.get("access_token")
            log_result("Director Login", resp.status == 200 and bool(dir_token), f"Role: {data.get('role')}, User: {data.get('username')}")
    except Exception as e:
        log_result("Director Login", False, str(e))

    # 4. Test HQ Login
    try:
        payload = json.dumps({"username": "hq_officer", "password": "hq@123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get("access_token")
            log_result("HQ Officer Login", resp.status == 200 and bool(token), f"Role: {data.get('role')}")
    except Exception as e:
        log_result("HQ Officer Login", False, str(e))

    # 5. Test ULB Coimbatore Login
    ulb_token = None
    try:
        payload = json.dumps({"username": "ulb_coimbatore", "password": "ulb@123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            ulb_token = data.get("access_token")
            log_result("ULB Operator Login (ulb_coimbatore)", resp.status == 200 and bool(ulb_token), f"Role: {data.get('role')}, ULB: {data.get('ulb_name')}")
    except Exception as e:
        log_result("ULB Operator Login (ulb_coimbatore)", False, str(e))

    # 6. Test GET /api/ulbs (Master Data)
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/ulbs", headers={"Authorization": f"Bearer {ulb_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("ULB Master Data API (/api/ulbs)", resp.status == 200, f"Retrieved {len(data)} ULBs")
    except Exception as e:
        log_result("ULB Master Data API (/api/ulbs)", False, str(e))

    # 7. Test SWM Facilities API
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/swm/facilities?ulb_id=1", headers={"Authorization": f"Bearer {ulb_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("SWM Itemized Facilities API (/api/swm/facilities)", resp.status == 200, f"Retrieved {len(data)} facilities")
    except Exception as e:
        log_result("SWM Itemized Facilities API (/api/swm/facilities)", False, str(e))

    # 8. Test Statewide SWM Dashboard KPI API
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/dashboard/summary", headers={"Authorization": f"Bearer {dir_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("Statewide SWM Dashboard Summary API", resp.status == 200, f"Compliance: {data.get('compliance_pct')}%, Processed: {data.get('total_processed_mt')} MT")
    except Exception as e:
        log_result("Statewide SWM Dashboard Summary API", False, str(e))

    # 9. Test UWM Baselines API
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/uwm/baselines", headers={"Authorization": f"Bearer {dir_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("UWM Baselines API (/api/uwm/baselines)", resp.status == 200, f"Retrieved {len(data)} UWM Baselines")
    except Exception as e:
        log_result("UWM Baselines API (/api/uwm/baselines)", False, str(e))

    # 10. Test UWM Dashboard KPI API
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/uwm/dashboard/summary", headers={"Authorization": f"Bearer {dir_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            log_result("UWM Dashboard Summary API", resp.status == 200, f"STP Capacity: {data.get('total_installed_stp_capacity_mld')} MLD, Sewage Gen: {data.get('total_sewage_generation_mld')} MLD")
    except Exception as e:
        log_result("UWM Dashboard Summary API", False, str(e))

    # 11. Test SWM Excel Report Export
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/export/daily", headers={"Authorization": f"Bearer {dir_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            content_type = resp.headers.get("Content-Type")
            length = len(resp.read())
            log_result("Daily SWM Excel Export API", resp.status == 200 and "spreadsheetml" in content_type, f"Size: {length} bytes")
    except Exception as e:
        log_result("Daily SWM Excel Export API", False, str(e))

    # 12. Test UWM Excel Report Export
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/uwm/export/daily", headers={"Authorization": f"Bearer {dir_token}"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            content_type = resp.headers.get("Content-Type")
            length = len(resp.read())
            log_result("Daily UWM Excel Export API", resp.status == 200 and "spreadsheetml" in content_type, f"Size: {length} bytes")
    except Exception as e:
        log_result("Daily UWM Excel Export API", False, str(e))

    print("\n==================================================")
    passed_count = sum(1 for r in results if r[1])
    total_count = len(results)
    print(f" FINAL SCORE: {passed_count}/{total_count} APIs WORKING PERFECTLY")
    print("==================================================")

if __name__ == "__main__":
    run_smoke_tests()
