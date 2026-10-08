import openpyxl

file_path = r"C:\Users\Admin\Downloads\SWM - Daily Format  21.05.2026 (1).xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True)
ws = wb['ULB wise Format-22.05.2026']

regions_stats = {}
current_region = "Corporation"

for r in range(5, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    name = ws.cell(r, 2).value

    sno_str = str(sno).strip() if sno is not None else ""
    name_str = str(name).strip() if name is not None else ""

    if not name_str and not sno_str:
        continue

    if ("Region" in name_str or "region" in name_str) and not sno_str.isdigit():
        current_region = name_str
        continue

    if sno_str.isdigit() or (name_str and name_str not in ["Total", "TOTAL", "Region Total"]):
        if current_region not in regions_stats:
            regions_stats[current_region] = {
                "count": 0,
                "households": 0,
                "perm_workers": 0,
                "outsource_workers": 0,
                "primary_veh": 0,
                "secondary_veh": 0,
                "mcc_cap": 0.0,
                "mrf_cap": 0.0,
                "bio_cap": 0.0,
                "other_cap": 0.0,
                "ulbs": []
            }

        def to_num(val):
            if val is None or str(val).strip() == "" or str(val).strip() == "-":
                return 0.0
            try:
                return float(val)
            except:
                return 0.0

        hh = to_num(ws.cell(r, 17).value)
        pw = to_num(ws.cell(r, 3).value)
        ow = to_num(ws.cell(r, 6).value)
        pv = to_num(ws.cell(r, 9).value)
        sv = to_num(ws.cell(r, 13).value)
        mcc = to_num(ws.cell(r, 20).value)
        mrf = to_num(ws.cell(r, 22).value)
        bio = to_num(ws.cell(r, 24).value)
        oth = to_num(ws.cell(r, 26).value)

        regions_stats[current_region]["count"] += 1
        regions_stats[current_region]["households"] += int(hh)
        regions_stats[current_region]["perm_workers"] += int(pw)
        regions_stats[current_region]["outsource_workers"] += int(ow)
        regions_stats[current_region]["primary_veh"] += int(pv)
        regions_stats[current_region]["secondary_veh"] += int(sv)
        regions_stats[current_region]["mcc_cap"] += mcc
        regions_stats[current_region]["mrf_cap"] += mrf
        regions_stats[current_region]["bio_cap"] += bio
        regions_stats[current_region]["other_cap"] += oth
        regions_stats[current_region]["ulbs"].append((sno_str, name_str, int(hh), mcc, mrf, bio, oth))

print("\n=== STATIC DATA SUMMARY BY REGION ===")
grand_total = {
    "count": 0, "households": 0, "perm_workers": 0, "outsource_workers": 0,
    "primary_veh": 0, "secondary_veh": 0, "mcc_cap": 0.0, "mrf_cap": 0.0, "bio_cap": 0.0, "other_cap": 0.0
}

for reg, s in regions_stats.items():
    print(f"\n[{reg}] ({s['count']} ULBs)")
    print(f"  - Total Households: {s['households']:,}")
    print(f"  - MCC Capacity: {s['mcc_cap']:.2f} MT")
    print(f"  - MRF Capacity: {s['mrf_cap']:.2f} MT")
    print(f"  - BioMethanation Capacity: {s['bio_cap']:.2f} MT")
    print(f"  - Other Facility Capacity: {s['other_cap']:.2f} MT")
    print(f"  - Total Processing Capacity: {s['mcc_cap'] + s['mrf_cap'] + s['bio_cap'] + s['other_cap']:.2f} MT")
    print(f"  - Permanent Workers in Position: {s['perm_workers']:,}")
    print(f"  - Outsourced Workers Sanctioned: {s['outsource_workers']:,}")
    print(f"  - Primary Collection Vehicles: {s['primary_veh']:,}")
    print(f"  - Secondary Collection Vehicles: {s['secondary_veh']:,}")

    for k in grand_total:
        grand_total[k] += s[k]

print("\n=======================================================")
print(f"STATE GRAND TOTAL ({grand_total['count']} ULBs)")
print(f"=======================================================")
print(f"• Total Registered Households: {grand_total['households']:,}")
print(f"• Total Installed Processing Capacity: {grand_total['mcc_cap'] + grand_total['mrf_cap'] + grand_total['bio_cap'] + grand_total['other_cap']:.2f} MT")
print(f"   ├─ MCC / Windrow: {grand_total['mcc_cap']:.2f} MT")
print(f"   ├─ MRF: {grand_total['mrf_cap']:.2f} MT")
print(f"   ├─ BioMethanation: {grand_total['bio_cap']:.2f} MT")
print(f"   └─ Other Facilities: {grand_total['other_cap']:.2f} MT")
print(f"• Total Sanitation Workers Sanctioned: {grand_total['perm_workers'] + grand_total['outsource_workers']:,}")
print(f"   ├─ Permanent in Position: {grand_total['perm_workers']:,}")
print(f"   └─ Outsourced as per Agreement: {grand_total['outsource_workers']:,}")
print(f"• Total Fleet Allotted: {grand_total['primary_veh'] + grand_total['secondary_veh']:,}")
print(f"   ├─ Primary Collection Vehicles: {grand_total['primary_veh']:,}")
print(f"   └─ Secondary Collection Vehicles: {grand_total['secondary_veh']:,}")
