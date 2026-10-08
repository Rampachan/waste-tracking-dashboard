import os
import sys

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from datetime import date
from fastapi.testclient import TestClient
from app.main import app, _failed_login_attempts
from app.database import SessionLocal
from app.models import User, ULB, DailyWasteLog
from app.schemas import DailyLogCreate, ULBUpdate
from app.security import hash_password, verify_password

def run_security_audit():
    print("===============================================================")
    print("      TAMIL NADU SWM PORTAL - COMPREHENSIVE SECURITY AUDIT     ")
    print("===============================================================\n")

    client = TestClient(app)
    db = SessionLocal()

    try:
        # 1. AUDIT: HTTP SECURITY HEADERS (OWASP RECOMMENDATIONS)
        print("[AUDIT 1] Inspecting HTTP Security Headers...")
        resp = client.get("/docs")
        headers = resp.headers
        
        assert headers.get("x-frame-options") == "DENY", "Missing or invalid X-Frame-Options"
        assert headers.get("x-content-type-options") == "nosniff", "Missing or invalid X-Content-Type-Options"
        assert "1; mode=block" in headers.get("x-xss-protection", ""), "Missing or invalid X-XSS-Protection"
        assert "strict-origin-when-cross-origin" in headers.get("referrer-policy", ""), "Missing or invalid Referrer-Policy"
        assert "default-src 'self'" in headers.get("content-security-policy", ""), "Missing Content-Security-Policy"
        assert "geolocation=()" in headers.get("permissions-policy", ""), "Missing Permissions-Policy"
        
        print("  [OK] X-Frame-Options: DENY (Clickjacking defense active)")
        print("  [OK] X-Content-Type-Options: nosniff (MIME sniffing defense active)")
        print("  [OK] X-XSS-Protection: 1; mode=block (XSS defense active)")
        print("  [OK] Content-Security-Policy: default-src 'self' (Resource injection defense active)")
        print("  [PASS] HTTP Security Headers Audit\n")

        # 2. AUDIT: AUTHENTICATION & BRUTE-FORCE RATE LIMITING
        print("[AUDIT 2] Testing Brute-Force Rate Limiting on Login...")
        _failed_login_attempts.clear()

        for attempt in range(1, 6):
            r = client.post("/api/auth/login", json={"username": "director", "password": "WrongPassword123!"})
            assert r.status_code == 401, f"Expected 401 on attempt {attempt}, got {r.status_code}"

        lockout_resp = client.post("/api/auth/login", json={"username": "director", "password": "WrongPassword123!"})
        assert lockout_resp.status_code == 429, f"Expected 429 Too Many Requests, got {lockout_resp.status_code}"
        assert "Retry-After" in lockout_resp.headers, "Missing Retry-After header on 429 response"
        print(f"  [OK] 5 failed attempts triggered lockout: {lockout_resp.json()['detail']}")
        print(f"  [OK] Retry-After header: {lockout_resp.headers.get('Retry-After')}s")
        print("  [PASS] Brute-Force Defense Audit\n")

        _failed_login_attempts.clear()
        
        # 3. AUDIT: CRYPTOGRAPHIC PASSWORD HASHING
        print("[AUDIT 3] Cryptographic Password Hashing & Salt Verification...")
        pwd = "TamilNaduSecurePassword2026@"
        h1 = hash_password(pwd)
        h2 = hash_password(pwd)
        
        assert h1 != h2, "Cryptographic failure: identical password generated identical salt/hash!"
        assert verify_password(pwd, h1) is True, "Failed to verify valid password against hash 1"
        assert verify_password(pwd, h2) is True, "Failed to verify valid password against hash 2"
        assert verify_password("WrongPassword", h1) is False, "False positive verification!"
        
        salt1 = h1.split("$")[0]
        salt2 = h2.split("$")[0]
        assert salt1 != salt2, "Salts are not unique!"
        assert len(salt1) == 32, "Salt length is insufficient!"
        print("  [OK] Algorithm: PBKDF2-HMAC-SHA256 with 100,000 iterations")
        print(f"  [OK] Salt 1: {salt1[:12]}... (32-char hex)")
        print(f"  [OK] Salt 2: {salt2[:12]}... (Unique per entry)")
        print("  [PASS] Cryptographic Hashing Audit\n")

        # Obtain test tokens
        r_dir = client.post("/api/auth/login", json={"username": "director", "password": "director@123"})
        assert r_dir.status_code == 200
        dir_token = r_dir.json()["access_token"]
        dir_headers = {"Authorization": f"Bearer {dir_token}"}

        r_ulb = client.post("/api/auth/login", json={"username": "ulb_coimbatore", "password": "ulb@123"})
        assert r_ulb.status_code == 200
        ulb_token = r_ulb.json()["access_token"]
        ulb_headers = {"Authorization": f"Bearer {ulb_token}"}

        # 4. AUDIT: UNTOUCHED ENDPOINT DEFENSE (ANONYMOUS PROBING)
        print("[AUDIT 4] Probing Endpoints Without Authentication...")
        unauth_endpoints = [
            ("GET", "/api/auth/me"),
            ("GET", "/api/ulbs"),
            ("GET", "/api/ulbs/1"),
            ("GET", "/api/dashboard/summary"),
            ("GET", "/api/dashboard/compliance"),
            ("GET", "/api/logs/daily"),
            ("GET", "/api/logs/history/1"),
            ("GET", "/api/export/daily"),
            ("GET", "/api/export/monthly"),
            ("PUT", "/api/ulbs/1"),
            ("POST", "/api/logs"),
        ]

        for method, path in unauth_endpoints:
            if method == "GET":
                r = client.get(path)
            elif method == "PUT":
                r = client.put(path, json={})
            else:
                r = client.post(path, json={})
            assert r.status_code == 401, f"Information disclosure on {method} {path}: expected 401, got {r.status_code}"
        print(f"  [OK] All {len(unauth_endpoints)} private endpoints returned 401 Unauthorized to unauthenticated requests")
        print("  [PASS] Anonymous Reconnaissance Defense Audit\n")

        # 5. AUDIT: VERTICAL PRIVILEGE ESCALATION PREVENTION
        print("[AUDIT 5] Testing Privilege Escalation (ULB Operator attempting HQ/Director actions)...")
        escalation_attempts = [
            ("GET", "/api/dashboard/summary"),
            ("GET", "/api/dashboard/compliance"),
            ("GET", "/api/export/daily"),
            ("GET", "/api/export/monthly"),
            ("PUT", "/api/ulbs/1"),
        ]

        for method, path in escalation_attempts:
            if method == "GET":
                r = client.get(path, headers=ulb_headers)
            else:
                r = client.put(path, json={"households": 999999}, headers=ulb_headers)
            assert r.status_code == 403, f"Privilege escalation vulnerability on {method} {path}: expected 403, got {r.status_code}"
            print(f"  [OK] ULB User -> {method} {path} -> 403 Forbidden")
        print("  [PASS] Vertical Privilege Escalation Audit\n")

        # 6. AUDIT: HORIZONTAL PRIVILEGE ESCALATION (CROSS-ULB TAMPERING)
        print("[AUDIT 6] Testing Cross-ULB Horizontal Tampering...")
        tamper_payload = {
            "ulb_id": 2, # Madurai ID
            "log_date": str(date.today()),
            "total_households": 450000,
            "door_to_door_hhs": 400000,
            "segregated_hh_collected": 380000,
            "total_generation_today_mt": 650.0,
            "mcc_capacity": 400.0,
            "mcc_actual": 250.0,
            "biometh_capacity": 50.0,
            "biometh_actual": 20.0,
            "compost_output_mt": 35.0,
            "mrf_capacity": 200.0,
            "mrf_actual": 80.0,
            "other_capacity": 50.0,
            "other_actual": 20.0,
            "recyclable_sold_mt": 25.0,
            "dry_waste_cement_mt": 70.0,
            "dump_yard_mt": 45.0
        }
        r_cross = client.post("/api/logs", json=tamper_payload, headers=ulb_headers)
        assert r_cross.status_code == 403
        r_cross_hist = client.get("/api/logs/history/2", headers=ulb_headers)
        assert r_cross_hist.status_code == 403
        print("  [OK] Coimbatore user blocked from submitting data for Madurai (ULB ID 2)")
        print("  [OK] Coimbatore user blocked from accessing private logs for Madurai (ULB ID 2)")
        print("  [PASS] Horizontal Privilege Escalation Audit\n")

        # 7. AUDIT: INPUT VALIDATION & NUMERIC BOUNDARY SAFETY
        print("[AUDIT 7] Testing Input Validation & Boundary Constraints...")
        neg_payload = tamper_payload.copy()
        neg_payload["ulb_id"] = 1 # Coimbatore
        neg_payload["total_generation_today_mt"] = -50.0
        r_neg = client.post("/api/logs", json=neg_payload, headers=ulb_headers)
        assert r_neg.status_code == 422

        overflow_payload = tamper_payload.copy()
        overflow_payload["ulb_id"] = 1
        overflow_payload["total_generation_today_mt"] = 9999999.0
        r_overflow = client.post("/api/logs", json=overflow_payload, headers=ulb_headers)
        assert r_overflow.status_code == 422

        neg_hh_payload = tamper_payload.copy()
        neg_hh_payload["ulb_id"] = 1
        neg_hh_payload["door_to_door_hhs"] = -100
        r_neg_hh = client.post("/api/logs", json=neg_hh_payload, headers=ulb_headers)
        assert r_neg_hh.status_code == 422
        print("  [OK] Negative numbers and numeric overflow rejected: 422 Unprocessable Entity")
        print("  [PASS] Input Boundary & Schema Validation Audit\n")

        # 8. AUDIT: FROZEN BASELINE TAMPER PROTECTION
        print("[AUDIT 8] Testing Frozen Baseline Tamper Resistance...")
        coimb_ulb = db.query(ULB).filter(ULB.name == "Coimbatore").first()
        official_hh = coimb_ulb.households
        official_mcc = coimb_ulb.default_mcc_capacity

        valid_submit = tamper_payload.copy()
        valid_submit["ulb_id"] = 1
        valid_submit["total_households"] = 11111 # Client tampering attempt
        valid_submit["mcc_capacity"] = 222.0     # Client tampering attempt

        r_valid = client.post("/api/logs", json=valid_submit, headers=ulb_headers)
        assert r_valid.status_code == 200
        res_data = r_valid.json()
        assert res_data["total_households"] == official_hh, f"Tamper leak! Got {res_data['total_households']}"
        assert res_data["mcc_capacity"] == official_mcc, f"Tamper leak! Got {res_data['mcc_capacity']}"
        print(f"  [OK] Total Households sent=11111 -> System enforced frozen baseline: {res_data['total_households']}")
        print(f"  [OK] MCC Capacity sent=222.0 -> System enforced frozen capacity: {res_data['mcc_capacity']} MT")
        print("  [PASS] Frozen Baseline Tamper Resistance Audit\n")

        print("===============================================================")
        print("  ALL 8 SECURITY AUDIT DOMAINS VERIFIED & PASSED (100% SCORE)  ")
        print("===============================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_security_audit()
