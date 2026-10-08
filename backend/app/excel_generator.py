import io
from datetime import date
from typing import List, Dict, Any, Union
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Palette
COLOR_HEADER_BG = "1F4E79"       # Deep Navy
COLOR_HEADER_TXT = "FFFFFF"
COLOR_SUBHEADER_BG = "2F5597"
COLOR_CAT_BANNER = "D9E1F2"      # Soft Periwinkle for region banners
COLOR_SUBTOTAL_BG = "FFF2CC"     # Soft Gold for subtotals
COLOR_REGION_TOT_BG = "FCE4D6"   # Peach for Region Total
COLOR_GRAND_TOT_BG = "E2EFDA"    # Soft Green for Grand Total

# Status / Flag colors
FLAG_COLORS = {
    "OK": {"fill": "E2EFDA", "font": "276A3C"},
    "VALID": {"fill": "E2EFDA", "font": "276A3C"},
    "Segregated HH>Total HH": {"fill": "FCE4D6", "font": "C00000"},
    "WARNING": {"fill": "FFF2CC", "font": "8C6B00"},
    "CRITICAL": {"fill": "FCE4D6", "font": "C00000"},
    "PENDING": {"fill": "F2F2F2", "font": "595959"}
}

BORDER_THIN = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

BORDER_TOTAL = Border(
    top=Side(style='thin', color='000000'),
    bottom=Side(style='double', color='000000'),
    left=Side(style='thin', color='000000'),
    right=Side(style='thin', color='000000')
)

def _generate_15_column_swm_report(
    title: str,
    sheet_title: str,
    d2d_col_header: str,
    gen_header: str,
    compost_header: str,
    grouped_data: Dict[str, List[Dict[str, Any]]]
) -> io.BytesIO:
    """
    Builds the official Tamil Nadu SWM Report with exact multi-tier 15-column hierarchy:
    Cols A-B: S.No, Name of Corporation / Municipality
    Cols C-E: Door to Door Collection & Source Segregation (No of HHs, Segregated HHs, % Segregation)
    Col F: Total waste generation (MT)
    Cols G-H: WET WASTE (Wet waste processed MCC/Bio-Meth MT, Output compost MT)
    Cols I-K: DRY WASTE (Processing facilities available MT, Recyclable sold MT, Dry waste disposed to cement plants MT)
    Cols L-O: STATUS (Total processed MT, Dump Yard MT, % of processed waste, Data-quality flag)
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_title
    ws.views.sheetView[0].showGridLines = True

    # 1. Main Title
    ws.merge_cells("A1:O1")
    title_cell = ws["A1"]
    title_cell.value = title
    title_cell.font = Font(name="Calibri", size=13, bold=True, color="1F4E79")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    # 2. Multi-tier Table Headers (Rows 3, 4, 5)
    # Row 3: Top-level merged groups
    ws.merge_cells("A3:A5")
    ws["A3"] = "S.No"
    
    ws.merge_cells("B3:B5")
    ws["B3"] = "Name of the Corporation / Municipality"

    ws.merge_cells("C3:E3")
    ws["C3"] = "Door to Door Collection"

    ws.merge_cells("F3:F5")
    ws["F3"] = gen_header

    ws.merge_cells("G3:H3")
    ws["G3"] = "WET WASTE"

    ws.merge_cells("I3:K3")
    ws["I3"] = "DRY WASTE"

    ws.merge_cells("L3:O3")
    ws["L3"] = "STATUS"

    # Row 4: Intermediate Level
    ws.merge_cells("C4:C5")
    ws["C4"] = "No. of HHs"

    ws.merge_cells("D4:E4")
    ws["D4"] = d2d_col_header

    ws.merge_cells("G4:G5")
    ws["G4"] = "Wet waste processed MCC / BIO-METHA (MT)"

    ws.merge_cells("H4:H5")
    ws["H4"] = compost_header

    ws.merge_cells("I4:I5")
    ws["I4"] = "Processing facilities available (MT)"

    ws.merge_cells("J4:J5")
    ws["J4"] = "Recyclable waste sold by sanitary workers (MT)"

    ws.merge_cells("K4:K5")
    ws["K4"] = "Dry waste disposed (Cement industries / recycling units) (MT)"

    ws.merge_cells("L4:L5")
    ws["L4"] = "Total processed waste (MT)"

    ws.merge_cells("M4:M5")
    ws["M4"] = "Waste sent to dumping yard (MT)"

    ws.merge_cells("N4:N5")
    ws["N4"] = "% of processed waste"

    ws.merge_cells("O4:O5")
    ws["O4"] = "Data-quality flag"

    # Row 5: Leaf Headers for D & E
    ws["D5"] = "No. of HHs segregated waste collected"
    ws["E5"] = "% of Collection"

    # Header Styling
    header_fill = PatternFill(start_color=COLOR_HEADER_BG, end_color=COLOR_HEADER_BG, fill_type="solid")
    header_font = Font(name="Calibri", size=9, bold=True, color=COLOR_HEADER_TXT)
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for r in range(3, 6):
        ws.row_dimensions[r].height = 24
        for col_idx in range(1, 16):
            c = ws.cell(row=r, column=col_idx)
            c.fill = header_fill
            c.font = header_font
            c.alignment = center_align
            c.border = Border(
                left=Side(style='thin', color='FFFFFF'),
                right=Side(style='thin', color='FFFFFF'),
                top=Side(style='thin', color='FFFFFF'),
                bottom=Side(style='thin', color='FFFFFF')
            )

    current_row = 6
    region_total_rows = []

    # Section ordering per official master layout
    section_keys = [
        "Corporation",
        "Chengalpattu Region",
        "Salem region",
        "Vellore Region",
        "Tiruppur Region",
        "Madurai Region",
        "Thanjavur region",
        "Tirunelveli Region"
    ]

    for section in section_keys:
        items = grouped_data.get(section, [])
        if not items:
            continue

        # Section Banner Row
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=15)
        banner_cell = ws.cell(row=current_row, column=1)
        banner_cell.value = f"{section.upper()}"
        banner_cell.font = Font(name="Calibri", size=10, bold=True, color="1F4E79")
        banner_cell.fill = PatternFill(start_color=COLOR_CAT_BANNER, fill_type="solid")
        banner_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.row_dimensions[current_row].height = 22
        current_row += 1

        start_data_row = current_row
        for item in items:
            ws.cell(row=current_row, column=1, value=item.get("s_no")).alignment = Alignment(horizontal="center")
            ws.cell(row=current_row, column=2, value=item.get("name")).alignment = Alignment(horizontal="left")
            
            # Households (Col C)
            c_hh = ws.cell(row=current_row, column=3, value=item.get("total_households", 0))
            c_hh.number_format = "#,##0"
            c_hh.alignment = Alignment(horizontal="right")
            
            # Door to door / Segregated HHs (Col D)
            seg_hh = item.get("segregated_hh_collected") or item.get("door_to_door_hhs", 0)
            c_d2d = ws.cell(row=current_row, column=4, value=seg_hh)
            c_d2d.number_format = "#,##0"
            c_d2d.alignment = Alignment(horizontal="right")

            # Formula for % of Collection (Col E): =(D/C)
            c_pct = ws.cell(row=current_row, column=5)
            c_pct.value = f"=IF(C{current_row}>0, (D{current_row}/C{current_row}), 0)"
            c_pct.number_format = "0.0%"
            c_pct.alignment = Alignment(horizontal="right")

            # Generation Today (Col F)
            c_gen = ws.cell(row=current_row, column=6, value=item.get("total_generation_today_mt", 0.0))
            c_gen.number_format = "0.00"
            c_gen.alignment = Alignment(horizontal="right")

            # WET WASTE: Wet waste processed MCC / BIO-METHA (Col G)
            wet_proc = item.get("wet_waste_processed_mt", 0.0) or (item.get("mcc_actual", 0.0) + item.get("biometh_actual", 0.0))
            c_wet = ws.cell(row=current_row, column=7, value=wet_proc)
            c_wet.number_format = "0.00"
            c_wet.alignment = Alignment(horizontal="right")

            # WET WASTE: Output quantity as compost per day (Col H)
            c_comp = ws.cell(row=current_row, column=8, value=item.get("compost_output_mt", 0.0))
            c_comp.number_format = "0.00"
            c_comp.alignment = Alignment(horizontal="right")

            # DRY WASTE: Processing facilities available (Col I)
            dry_cap = item.get("dry_facilities_capacity_mt", 0.0) or (item.get("mrf_capacity", 0.0) + item.get("other_capacity", 0.0))
            c_dry_cap = ws.cell(row=current_row, column=9, value=dry_cap)
            c_dry_cap.number_format = "0.00"
            c_dry_cap.alignment = Alignment(horizontal="right")

            # DRY WASTE: Recyclable waste sold by sanitary workers (Col J)
            c_recyc = ws.cell(row=current_row, column=10, value=item.get("recyclable_sold_mt", 0.0))
            c_recyc.number_format = "0.00"
            c_recyc.alignment = Alignment(horizontal="right")

            # DRY WASTE: Dry waste disposed cement/recycling (Col K)
            c_cement = ws.cell(row=current_row, column=11, value=item.get("dry_waste_cement_mt", 0.0))
            c_cement.number_format = "0.00"
            c_cement.alignment = Alignment(horizontal="right")

            # STATUS: Total processed waste (Col L) -> Formula: =(G{row}+J{row}+K{row})
            c_proc = ws.cell(row=current_row, column=12)
            c_proc.value = f"=G{current_row}+J{current_row}+K{current_row}"
            c_proc.number_format = "0.00"
            c_proc.alignment = Alignment(horizontal="right")

            # STATUS: Dump yard (Col M)
            c_dump = ws.cell(row=current_row, column=13, value=item.get("dump_yard_mt", 0.0))
            c_dump.number_format = "0.00"
            c_dump.alignment = Alignment(horizontal="right")

            # STATUS: % of processed waste (Col N) -> Formula: =IF((L+M)>0, L/(L+M), 0)
            c_proc_pct = ws.cell(row=current_row, column=14)
            c_proc_pct.value = f"=IF((L{current_row}+M{current_row})>0, L{current_row}/(L{current_row}+M{current_row}), 0)"
            c_proc_pct.number_format = "0.0%"
            c_proc_pct.alignment = Alignment(horizontal="right")

            # STATUS: Data-quality flag (Col O) -> Formula: =IF(D{row}>C{row}, "Segregated HH>Total HH", "OK")
            c_flag = ws.cell(row=current_row, column=15)
            c_flag.value = f'=IF(D{current_row}>C{current_row}, "Segregated HH>Total HH", "OK")'
            c_flag.alignment = Alignment(horizontal="center")
            
            is_error = seg_hh > item.get("total_households", 0) if item.get("total_households", 0) > 0 else False
            flag_key = "Segregated HH>Total HH" if is_error else "OK"
            f_style = FLAG_COLORS.get(flag_key, FLAG_COLORS["OK"])
            c_flag.fill = PatternFill(start_color=f_style["fill"], fill_type="solid")
            c_flag.font = Font(name="Calibri", size=9, bold=True, color=f_style["font"])

            # Base styling for row
            for col_idx in range(1, 15):
                cell = ws.cell(row=current_row, column=col_idx)
                cell.border = BORDER_THIN
                cell.font = Font(name="Calibri", size=9)
            ws.cell(row=current_row, column=15).border = BORDER_THIN

            ws.row_dimensions[current_row].height = 19
            current_row += 1

        end_data_row = current_row - 1

        # Subtotal Row for this section
        ws.cell(row=current_row, column=1, value="")
        label = "Total" if section != "Chengalpattu Region" else "TOTAL"
        ws.cell(row=current_row, column=2, value=f"{section} {label}").alignment = Alignment(horizontal="right")
        
        # SUM formulas for subtotals
        sum_cols = [
            (3, "C", "#,##0"),
            (4, "D", "#,##0"),
            (6, "F", "0.00"),
            (7, "G", "0.00"),
            (8, "H", "0.00"),
            (9, "I", "0.00"),
            (10, "J", "0.00"),
            (11, "K", "0.00"),
            (12, "L", "0.00"),
            (13, "M", "0.00"),
        ]
        for c_idx, letter, num_fmt in sum_cols:
            cell = ws.cell(row=current_row, column=c_idx)
            cell.value = f"=SUM({letter}{start_data_row}:{letter}{end_data_row})"
            cell.number_format = num_fmt
            cell.alignment = Alignment(horizontal="right")

        # % Collection subtotal (Col E)
        sub_pct = ws.cell(row=current_row, column=5)
        sub_pct.value = f"=IF(C{current_row}>0, (D{current_row}/C{current_row}), 0)"
        sub_pct.number_format = "0.0%"
        sub_pct.alignment = Alignment(horizontal="right")

        # % Processed subtotal (Col N)
        sub_proc_pct = ws.cell(row=current_row, column=14)
        sub_proc_pct.value = f"=IF((L{current_row}+M{current_row})>0, L{current_row}/(L{current_row}+M{current_row}), 0)"
        sub_proc_pct.number_format = "0.0%"
        sub_proc_pct.alignment = Alignment(horizontal="right")

        # Flag for subtotal
        ws.cell(row=current_row, column=15, value=f'=IF(D{current_row}>C{current_row}, "Segregated HH>Total HH", "OK")').alignment = Alignment(horizontal="center")

        # Styling Subtotal Row
        for col_idx in range(1, 16):
            c = ws.cell(row=current_row, column=col_idx)
            c.font = Font(name="Calibri", size=9, bold=True)
            c.fill = PatternFill(start_color=COLOR_SUBTOTAL_BG, fill_type="solid")
            c.border = Border(top=Side(style='thin', color='000000'), bottom=Side(style='thin', color='000000'))

        if section != "Corporation":
            region_total_rows.append(current_row)

        ws.row_dimensions[current_row].height = 21
        current_row += 1

    # 3. REGION TOTAL ROW (Municipalities sum across the 7 regions)
    if region_total_rows:
        ws.cell(row=current_row, column=1, value="")
        ws.cell(row=current_row, column=2, value="Region Total (Municipalities)").alignment = Alignment(horizontal="right")

        for c_idx, letter, num_fmt in [
            (3, "C", "#,##0"),
            (4, "D", "#,##0"),
            (6, "F", "0.00"),
            (7, "G", "0.00"),
            (8, "H", "0.00"),
            (9, "I", "0.00"),
            (10, "J", "0.00"),
            (11, "K", "0.00"),
            (12, "L", "0.00"),
            (13, "M", "0.00"),
        ]:
            terms = [f"{letter}{r}" for r in region_total_rows]
            cell = ws.cell(row=current_row, column=c_idx)
            cell.value = f"={'+'.join(terms)}"
            cell.number_format = num_fmt
            cell.alignment = Alignment(horizontal="right")

        ws.cell(row=current_row, column=5, value=f"=IF(C{current_row}>0, (D{current_row}/C{current_row}), 0)").number_format = "0.0%"
        ws.cell(row=current_row, column=5).alignment = Alignment(horizontal="right")

        ws.cell(row=current_row, column=14, value=f"=IF((L{current_row}+M{current_row})>0, L{current_row}/(L{current_row}+M{current_row}), 0)").number_format = "0.0%"
        ws.cell(row=current_row, column=14).alignment = Alignment(horizontal="right")

        ws.cell(row=current_row, column=15, value=f'=IF(D{current_row}>C{current_row}, "Segregated HH>Total HH", "OK")').alignment = Alignment(horizontal="center")

        for col_idx in range(1, 16):
            c = ws.cell(row=current_row, column=col_idx)
            c.font = Font(name="Calibri", size=10, bold=True)
            c.fill = PatternFill(start_color=COLOR_REGION_TOT_BG, fill_type="solid")
            c.border = Border(top=Side(style='thin', color='000000'), bottom=Side(style='thin', color='000000'))

        ws.row_dimensions[current_row].height = 22
        mun_tot_row = current_row
        current_row += 1

        # 4. GRAND TOTAL ROW (Corporations + Municipalities Region Total)
        corp_subtotal_row = None
        for r in range(6, current_row):
            val = ws.cell(row=r, column=2).value
            if val and "Corporation" in str(val) and ("Total" in str(val) or "TOTAL" in str(val)):
                corp_subtotal_row = r
                break

        if corp_subtotal_row is not None or mun_tot_row is not None:
            ws.cell(row=current_row, column=1, value="")
            ws.cell(row=current_row, column=2, value="GRAND TOTAL (169 ULBs)").alignment = Alignment(horizontal="right")

            for c_idx, letter, num_fmt in [
                (3, "C", "#,##0"),
                (4, "D", "#,##0"),
                (6, "F", "0.00"),
                (7, "G", "0.00"),
                (8, "H", "0.00"),
                (9, "I", "0.00"),
                (10, "J", "0.00"),
                (11, "K", "0.00"),
                (12, "L", "0.00"),
                (13, "M", "0.00"),
            ]:
                cell = ws.cell(row=current_row, column=c_idx)
                if corp_subtotal_row and mun_tot_row:
                    cell.value = f"={letter}{corp_subtotal_row}+{letter}{mun_tot_row}"
                elif corp_subtotal_row:
                    cell.value = f"={letter}{corp_subtotal_row}"
                else:
                    cell.value = f"={letter}{mun_tot_row}"
                cell.number_format = num_fmt
                cell.alignment = Alignment(horizontal="right")

            ws.cell(row=current_row, column=5, value=f"=IF(C{current_row}>0, (D{current_row}/C{current_row}), 0)").number_format = "0.0%"
            ws.cell(row=current_row, column=5).alignment = Alignment(horizontal="right")

            ws.cell(row=current_row, column=14, value=f"=IF((L{current_row}+M{current_row})>0, L{current_row}/(L{current_row}+M{current_row}), 0)").number_format = "0.0%"
            ws.cell(row=current_row, column=14).alignment = Alignment(horizontal="right")

            ws.cell(row=current_row, column=15, value=f'=IF(D{current_row}>C{current_row}, "Segregated HH>Total HH", "OK")').alignment = Alignment(horizontal="center")

            for col_idx in range(1, 16):
                c = ws.cell(row=current_row, column=col_idx)
                c.font = Font(name="Calibri", size=10, bold=True, color="1F4E79")
                c.fill = PatternFill(start_color=COLOR_GRAND_TOT_BG, fill_type="solid")
                c.border = BORDER_TOTAL

            ws.row_dimensions[current_row].height = 24

    # Optimal Column Widths
    col_widths = {
        "A": 7,    # S.No
        "B": 26,   # ULB Name
        "C": 14,   # No of HHs
        "D": 22,   # No. of HHs segregated waste collected
        "E": 14,   # % of Collection
        "F": 18,   # Total waste generation (MT)
        "G": 20,   # Wet waste processed MCC / BIO-METHA (MT)
        "H": 18,   # Output quantity as compost per day (MT)
        "I": 18,   # Processing facilities available (MT)
        "J": 18,   # Recyclable sold by sanitary workers (MT)
        "K": 20,   # Dry waste cement / recycling (MT)
        "L": 16,   # Total processed waste (MT)
        "M": 16,   # Waste sent to dumping yard (MT)
        "N": 14,   # % of processed waste
        "O": 22    # Data-quality flag
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf

def build_daily_excel_report(report_date: date, grouped_data: Dict[str, List[Dict[str, Any]]]) -> io.BytesIO:
    """
    Builds the official Tamil Nadu Daily SWM Report with exact 15-column multi-tier hierarchy:
    Cols A-B: S.No, Name of Corporation / Municipality
    Cols C-E: Door to Door Collection & Source Segregation (No of HHs, Segregated HHs, % Segregation)
    Col F: Total waste generation Today (MT)
    Cols G-H: WET WASTE (Wet waste processed MCC/Bio-Meth MT, Output compost MT)
    Cols I-K: DRY WASTE (Processing facilities available MT, Recyclable sold MT, Dry waste disposed cement plants MT)
    Cols L-O: STATUS (Total processed MT, Dump Yard MT, % of processed waste, Data-quality flag)
    """
    title = f"TAMIL NADU MUNICIPAL ADMINISTRATION - SOLID WASTE MANAGEMENT DAILY REPORT ({report_date.strftime('%d-%b-%Y')})"
    sheet_title = f"Daily-{report_date.strftime('%d%b%Y')}"
    return _generate_15_column_swm_report(
        title=title,
        sheet_title=sheet_title,
        d2d_col_header="Door to Door Collection Today",
        gen_header="Total waste generation Today (MT)",
        compost_header="Output quantity as compost per day (MT)",
        grouped_data=grouped_data
    )

def build_monthly_excel_report(year: int, month: int, monthly_data: Union[Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]]]) -> io.BytesIO:
    """
    Builds the official Tamil Nadu Monthly Consolidated SWM Report with the exact 15-column multi-tier hierarchy:
    Cols A-B: S.No, Name of Corporation / Municipality
    Cols C-E: Door to Door Collection (No of HHs, Monthly Avg Segregated HHs, % Segregation)
    Col F: Total waste generation (MT)
    Cols G-H: WET WASTE (Wet waste processed MCC/Bio-Meth MT, Output compost MT)
    Cols I-K: DRY WASTE (Processing facilities available MT, Recyclable sold MT, Dry waste disposed cement plants MT)
    Cols L-O: STATUS (Total processed MT, Dump Yard MT, % of processed waste, Data-quality flag)
    """
    if isinstance(monthly_data, list):
        grouped_data: Dict[str, List[Dict[str, Any]]] = {}
        for item in monthly_data:
            reg = item.get("region", "Corporation")
            if reg not in grouped_data:
                grouped_data[reg] = []
            grouped_data[reg].append(item)
    else:
        grouped_data = monthly_data

    month_date = date(year, month, 1)
    month_name = month_date.strftime('%B')
    title = f"TAMIL NADU MUNICIPAL ADMINISTRATION - SOLID WASTE MANAGEMENT MONTHLY REPORT ({month_name} {year})"
    sheet_title = f"Monthly-{month:02d}_{year}"

    return _generate_15_column_swm_report(
        title=title,
        sheet_title=sheet_title,
        d2d_col_header="Door to Door Collection (Monthly Avg)",
        gen_header="Total waste generation (MT)",
        compost_header="Output quantity as compost (MT)",
        grouped_data=grouped_data
    )
