import io
from datetime import date
from typing import List, Dict, Any
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# UWM Theme Colors
COLOR_NAVY = "0B3C5D"
COLOR_TEAL = "1D7874"
COLOR_LIGHT_TEAL = "E7F6F6"
COLOR_GOLD = "FFF2CC"
COLOR_YELLOW = "FFFF00"
COLOR_GRAY = "F2F4F7"

BORDER_THIN = Border(
    left=Side(style='thin', color='CCCCCC'),
    right=Side(style='thin', color='CCCCCC'),
    top=Side(style='thin', color='CCCCCC'),
    bottom=Side(style='thin', color='CCCCCC')
)

BORDER_TOTAL = Border(
    top=Side(style='thin', color='000000'),
    bottom=Side(style='double', color='000000'),
    left=Side(style='thin', color='000000'),
    right=Side(style='thin', color='000000')
)

def build_daily_uwm_excel_report(target_date: date, uwm_data: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Builds the official Tamil Nadu UWM Report with exact 21-column layout matching the official PDF:
    Cols A-B: S.No, Name of the ULB
    Cols C-D: Sewage status Estimation and Measurement (Total Sewage gen MLD, Inflow received today MLD)
    Cols E-F: Sewage / Conveyance sewers (Targeted HH, Connected HH)
    Cols G-Q: Sewage treatment and utilisation (Functional, Location, Installed Cap MLD, Utilized Cap MLD, % Util, Standards, Discharge Point, Reuse MLD, Reuse Purpose, Sludge MT, Sludge Mgmt)
    Cols R-S: Pumping Stations (Total, Functional)
    Cols T-U: Lifting Stations (Total, Functional)
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"UWM Daily {target_date.strftime('%d-%b-%Y')}"
    ws.views.sheetView[0].showGridLines = True

    # Row 1: Government Header
    ws.merge_cells('A1:U1')
    top_cell = ws['A1']
    top_cell.value = "DIRECTORATE OF MUNICIPAL ADMINISTRATION - GOVERNMENT OF TAMIL NADU"
    top_cell.font = Font(name="Arial", size=14, bold=True, color="FFFFFF")
    top_cell.fill = PatternFill(start_color=COLOR_NAVY, end_color=COLOR_NAVY, fill_type="solid")
    top_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    # Row 2: Report Subtitle & Date
    ws.merge_cells('A2:U2')
    sub_cell = ws['A2']
    sub_cell.value = f"STATEWIDE DAILY USED WATER MANAGEMENT (UWM) OPERATIONAL & COMPLIANCE REPORT | DATE: {target_date.strftime('%d-%m-%Y')}"
    sub_cell.font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    sub_cell.fill = PatternFill(start_color=COLOR_TEAL, end_color=COLOR_TEAL, fill_type="solid")
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 22

    # Row 3: Tier 1 Categorical Headers
    categories = [
        ('A3:B3', "Identification", COLOR_NAVY),
        ('C3:D3', "Sewage status Estimation and Measurement", COLOR_TEAL),
        ('E3:F3', "Sewage / Conveyance sewers", "26547C"),
        ('G3:Q3', "Sewage treatment and utilisation", "1B4965"),
        ('R3:S3', "Pumping Stations", "386641"),
        ('T3:U3', "Lifting Stations", "6A994E"),
    ]
    for cell_range, label, color in categories:
        ws.merge_cells(cell_range)
        start_cell = ws[cell_range.split(':')[0]]
        start_cell.value = label
        start_cell.font = Font(name="Arial", size=10, bold=True, color="FFFFFF")
        start_cell.fill = PatternFill(start_color=color, end_color=color, fill_type="solid")
        start_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Apply fills across merged range
    for row in ws['A3:U3']:
        for cell in row:
            cell.border = BORDER_THIN
    ws.row_dimensions[3].height = 24

    # Row 4: Column Specific Field Headers
    headers = [
        ("S.No", 8),
        ("A) Name of the ULB", 25),
        ("* Total sewage generation per day (in MLD)", 18),
        ("Sewage inflow received today (MLD)", 16),
        ("Targeted Household to be connected to sewers", 18),
        ("Households connected", 16),
        ("STP/FSTP Functional (Yes / No)", 14),
        ("STP Location Name", 22),
        ("Installed Treatment capacities of Existing STPs (MLD)", 18),
        ("Utilization capacity of Existing STP's (MLD)", 16),
        ("% Utilization", 14),
        ("Performance of STPs with reference to Standards", 20),
        ("Final point of discharge of treated effluent", 20),
        ("Utilisation (MLD)", 14),
        ("Utilisation Purpose", 20),
        ("Sludge generation", 14),
        ("Sludge management", 18),
        ("No. of Pumping Station", 14),
        ("No. of Functional", 14),
        ("No. of Lifting Stations", 14),
        ("No. of Functional", 14)
    ]

    for col_idx, (header_text, width) in enumerate(headers, start=1):
        cell = ws.cell(row=4, column=col_idx, value=header_text)
        cell.font = Font(name="Arial", size=9, bold=True, color="000000")
        cell.fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER_THIN
        ws.column_dimensions[get_column_letter(col_idx)].width = width
    ws.row_dimensions[4].height = 42

    current_row = 5
    for item in uwm_data:
        inst_stp = item.get("installed_stp_capacity_mld", 0.0)
        util_stp = item.get("utilization_capacity_mld", 0.0)
        util_pct = round((util_stp / inst_stp) * 100, 1) if inst_stp > 0 else 0.0

        row_values = [
            item.get("s_no", current_row - 4),
            item.get("name", ""),
            round(item.get("total_sewage_generation_mld", 0.0), 2),
            round(item.get("sewage_inflow_mld", 0.0), 2),
            item.get("targeted_households", 0),
            item.get("connected_households", 0),
            item.get("stp_functional", "Yes" if inst_stp > 0 else "No"),
            item.get("stp_location_name") or ("-" if inst_stp == 0 else "Central STP"),
            round(inst_stp, 2),
            round(util_stp, 2),
            f"{util_pct}%" if inst_stp > 0 else "-",
            item.get("performance_standards", "Compliant" if inst_stp > 0 else "-"),
            item.get("discharge_point", "River" if inst_stp > 0 else "-"),
            round(item.get("treated_reuse_mld", 0.0), 2),
            item.get("reuse_purpose", "-" if item.get("treated_reuse_mld", 0) == 0 else "Gardening / Parks"),
            round(item.get("sludge_generation_mt", 0.0), 2),
            item.get("sludge_management", "-" if item.get("sludge_generation_mt", 0) == 0 else "Co-composting"),
            item.get("no_of_pumping_stations", 0),
            item.get("functional_pumping_stations", 0),
            item.get("no_of_lifting_stations", 0),
            item.get("functional_lifting_stations", 0),
        ]

        for col_idx, val in enumerate(row_values, start=1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.font = Font(name="Calibri", size=10)
            cell.border = BORDER_THIN
            
            # Numeric alignment
            if col_idx in [1, 5, 6, 7, 11, 18, 19, 20, 21]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx in [3, 4, 9, 10, 14, 16]:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.number_format = '#,##0.00'
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

        ws.row_dimensions[current_row].height = 20
        current_row += 1

    # Grand Total Row (Identical to PDF Footer)
    total_row = current_row
    ws.merge_cells(start_row=total_row, start_column=1, end_row=total_row, end_column=2)
    tot_label = ws.cell(row=total_row, column=1, value="STATE TOTAL")
    tot_label.font = Font(name="Arial", size=10, bold=True, color="9C0006")
    tot_label.alignment = Alignment(horizontal="center", vertical="center")

    tot_sew = sum(d.get("total_sewage_generation_mld", 0.0) for d in uwm_data)
    tot_inflow = sum(d.get("sewage_inflow_mld", 0.0) for d in uwm_data)
    tot_tgt = sum(d.get("targeted_households", 0) for d in uwm_data)
    tot_conn = sum(d.get("connected_households", 0) for d in uwm_data)
    tot_inst = sum(d.get("installed_stp_capacity_mld", 0.0) for d in uwm_data)
    tot_util = sum(d.get("utilization_capacity_mld", 0.0) for d in uwm_data)
    avg_pct = round((tot_util / tot_inst) * 100, 1) if tot_inst > 0 else 0.0
    tot_reuse = sum(d.get("treated_reuse_mld", 0.0) for d in uwm_data)
    tot_sludge = sum(d.get("sludge_generation_mt", 0.0) for d in uwm_data)
    tot_ps = sum(d.get("no_of_pumping_stations", 0) for d in uwm_data)
    tot_fps = sum(d.get("functional_pumping_stations", 0) for d in uwm_data)
    tot_ls = sum(d.get("no_of_lifting_stations", 0) for d in uwm_data)
    tot_fls = sum(d.get("functional_lifting_stations", 0) for d in uwm_data)

    totals = {
        3: round(tot_sew, 2),
        4: round(tot_inflow, 2),
        5: tot_tgt,
        6: tot_conn,
        9: round(tot_inst, 2),
        10: round(tot_util, 2),
        11: f"{avg_pct}%",
        14: round(tot_reuse, 2),
        16: round(tot_sludge, 2),
        18: tot_ps,
        19: tot_fps,
        20: tot_ls,
        21: tot_fls
    }

    for col_idx in range(1, 22):
        cell = ws.cell(row=total_row, column=col_idx)
        if col_idx in totals:
            cell.value = totals[col_idx]
            if col_idx in [3, 4, 9, 10, 14, 16]:
                cell.number_format = '#,##0.00'
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.font = Font(name="Arial", size=10, bold=True, color="9C0006")
        cell.fill = PatternFill(start_color=COLOR_YELLOW, end_color=COLOR_YELLOW, fill_type="solid")
        cell.border = BORDER_TOTAL

    ws.row_dimensions[total_row].height = 24

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
