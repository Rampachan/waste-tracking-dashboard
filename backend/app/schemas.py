from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: Optional[str] = None
    ulb_id: Optional[int] = None
    ulb_name: Optional[str] = None

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50, description="Username or ULB code")
    password: str = Field(min_length=4, max_length=128, description="User password")

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    full_name: Optional[str]
    ulb_id: Optional[int]

    class Config:
        from_attributes = True

class ULBSchema(BaseModel):
    id: int
    s_no: int
    region: str
    category: str
    name: str
    households: int
    default_mcc_capacity: float
    default_mrf_capacity: float
    default_biometh_capacity: float
    default_other_capacity: float

    class Config:
        from_attributes = True

class ULBUpdate(BaseModel):
    households: Optional[int] = Field(default=None, gt=0, le=10000000)
    default_mcc_capacity: Optional[float] = Field(default=None, ge=0.0, le=20000.0)
    default_mrf_capacity: Optional[float] = Field(default=None, ge=0.0, le=20000.0)
    default_biometh_capacity: Optional[float] = Field(default=None, ge=0.0, le=20000.0)
    default_other_capacity: Optional[float] = Field(default=None, ge=0.0, le=20000.0)

class SwmFacilitySchema(BaseModel):
    id: int
    ulb_id: int
    facility_type: str
    name: str
    capacity_mt: float
    location: Optional[str] = None
    status: str = "ACTIVE"

    class Config:
        from_attributes = True

class SwmFacilityCreate(BaseModel):
    ulb_id: int
    facility_type: str = Field(description="MCC or MRF")
    name: str = Field(min_length=2, max_length=150)
    capacity_mt: float = Field(ge=0.0, le=10000.0)
    location: Optional[str] = None
    status: str = "ACTIVE"

class SwmFacilityUpdate(BaseModel):
    name: Optional[str] = None
    capacity_mt: Optional[float] = Field(default=None, ge=0.0, le=10000.0)
    location: Optional[str] = None
    status: Optional[str] = None

class FacilityLogInput(BaseModel):
    facility_id: int
    actual_processed_mt: float = Field(default=0.0, ge=0.0, le=10000.0)
    operational_status: str = "OPERATIONAL"
    notes: Optional[str] = None

class FacilityLogResponse(BaseModel):
    id: int
    facility_id: int
    facility_name: str
    facility_type: str
    capacity_mt: float
    actual_processed_mt: float
    operational_status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DailyLogCreate(BaseModel):
    ulb_id: int
    log_date: date
    total_households: int = Field(gt=0, le=10000000, description="Total target households")
    door_to_door_hhs: int = Field(default=0, ge=0, le=10000000, description="Households covered today")
    segregated_hh_collected: int = Field(default=0, ge=0, le=10000000, description="Col 6: No. of HHs segregated waste collected")
    
    # WASTE GENERATION (Cols 7, 8, 9)
    total_generation_today_mt: float = Field(default=0.0, ge=0.0, le=50000.0, description="Col 7: Total waste generation Today (MT)")
    wet_waste_generation_mt: float = Field(default=0.0, ge=0.0, le=50000.0, description="Col 8: Wet waste generation (MT)")
    dry_waste_generation_mt: float = Field(default=0.0, ge=0.0, le=50000.0, description="Col 9: Dry waste generation (MT)")

    # WET WASTE (Cols 10, 11, 12)
    wet_waste_processed_mt: float = Field(default=0.0, ge=0.0, le=50000.0, description="Col 10: Wet waste processed MCC / BIO-METHA (MT) & others")
    compost_output_mt: float = Field(default=0.0, ge=0.0, le=20000.0, description="Col 11: Compost generated today (MT)")
    manure_sold_free_mt: float = Field(default=0.0, ge=0.0, le=20000.0, description="Col 12: Manure sold / given at free of cost (MT)")

    # Processing facilities in MT (itemized / baseline support)
    mcc_capacity: float = Field(default=0.0, ge=0.0, le=20000.0)
    mcc_actual: float = Field(default=0.0, ge=0.0, le=20000.0)
    biometh_capacity: float = Field(default=0.0, ge=0.0, le=20000.0)
    biometh_actual: float = Field(default=0.0, ge=0.0, le=20000.0)
    other_capacity: float = Field(default=0.0, ge=0.0, le=20000.0)
    other_actual: float = Field(default=0.0, ge=0.0, le=20000.0)

    # DRY WASTE (Cols 13, 14, 15)
    mrf_capacity: float = Field(default=0.0, ge=0.0, le=20000.0)
    mrf_actual: float = Field(default=0.0, ge=0.0, le=20000.0)
    recyclable_sold_mt: float = Field(default=0.0, ge=0.0, le=20000.0, description="Col 13: Recyclable waste sold by sanitary workers (MT)")
    recyclable_sent_to_recyclers_mt: float = Field(default=0.0, ge=0.0, le=20000.0, description="Col 14: Recyclable waste sent to recyclers (MT)")
    dry_waste_cement_mt: float = Field(default=0.0, ge=0.0, le=20000.0, description="Col 15: Dry waste disposed to Cement industries (MT)")

    # SANITARY WASTE (Cols 16, 17)
    sanitary_waste_incineration_capacity_mt: float = Field(default=0.0, ge=0.0, le=5000.0, description="Col 16: Sanitary waste - incineration capacity (MT/day)")
    sanitary_waste_incinerated_today_mt: float = Field(default=0.0, ge=0.0, le=5000.0, description="Col 17: Sanitary waste incinerated today (MT)")

    # SPECIAL WASTE (Col 18)
    special_waste_processed_mt: float = Field(default=0.0, ge=0.0, le=5000.0, description="Col 18: Special waste processed / disposed today (MT)")

    # Specific Itemized Facility Logs (Optional - computed automatically if present)
    facility_logs: Optional[List[FacilityLogInput]] = []
    
    # Disposal (Optional manual override; auto-calculated as 7-20 if omitted)
    dump_yard_mt: Optional[float] = Field(default=None, ge=0.0, le=50000.0)

class DailyLogResponse(BaseModel):
    id: int
    ulb_id: int
    ulb_name: Optional[str] = None
    ulb_region: Optional[str] = None
    ulb_s_no: Optional[int] = None
    log_date: date
    total_households: int
    door_to_door_hhs: int
    segregated_hh_collected: int = 0
    collection_pct: float
    segregation_pct: float = 0.0

    # WASTE GENERATION (Cols 7, 8, 9)
    total_generation_today_mt: float = 0.0
    wet_waste_generation_mt: float = 0.0
    dry_waste_generation_mt: float = 0.0

    # WET WASTE (Cols 10, 11, 12)
    mcc_capacity: float = 0.0
    mcc_actual: float = 0.0
    biometh_capacity: float = 0.0
    biometh_actual: float = 0.0
    wet_waste_processed_mt: float = 0.0
    compost_output_mt: float = 0.0
    manure_sold_free_mt: float = 0.0

    # DRY WASTE (Cols 13, 14, 15)
    mrf_capacity: float = 0.0
    mrf_actual: float = 0.0
    other_capacity: float = 0.0
    other_actual: float = 0.0
    dry_facilities_capacity_mt: float = 0.0
    recyclable_sold_mt: float = 0.0
    recyclable_sent_to_recyclers_mt: float = 0.0
    dry_waste_cement_mt: float = 0.0

    # SANITARY WASTE (Cols 16, 17)
    sanitary_waste_incineration_capacity_mt: float = 0.0
    sanitary_waste_incinerated_today_mt: float = 0.0

    # SPECIAL WASTE (Col 18)
    special_waste_processed_mt: float = 0.0

    # Specific Facility Breakdown
    facility_logs: List[FacilityLogResponse] = []

    # CALCULATED - DO NOT ENTER (Cols 19, 20, 21, 22, 23)
    total_dry_waste_processed_mt: float = 0.0 # Col 19: =13+14+15
    total_processed_waste_mt: float = 0.0     # Col 20: =10+17+18+19
    dump_yard_mt: float = 0.0                 # Col 21: =7-20
    processed_waste_pct: float = 0.0          # Col 22: =20/7
    data_quality_flag: str = "OK"             # Col 23: Data-quality flag
    data_quality_note: Optional[str] = None

    # Backward compatibility fields
    total_processed_mt: float = 0.0
    total_capacity_mt: float = 0.0
    total_waste_handled_mt: float = 0.0
    diversion_rate_pct: float = 0.0

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceSummary(BaseModel):
    target_date: date
    total_ulbs: int
    submitted_count: int
    pending_count: int
    compliance_pct: float
    submitted_ulb_ids: List[int]
    pending_ulb_ids: List[int]

class DashboardKPIs(BaseModel):
    target_date: date
    total_ulbs: int
    submitted_ulbs: int
    pending_ulbs: int
    compliance_pct: float
    total_households: int
    d2d_covered_hhs: int
    avg_d2d_collection_pct: float
    total_segregated_hhs: int = 0
    avg_segregation_pct: float = 0.0
    
    # Waste Generation Totals
    total_generation_today_mt: float = 0.0
    wet_waste_generation_total: float = 0.0
    dry_waste_generation_total: float = 0.0

    # Wet Waste Totals
    mcc_capacity_total: float = 0.0
    mcc_actual_total: float = 0.0
    biometh_capacity_total: float = 0.0
    biometh_actual_total: float = 0.0
    other_capacity_total: float = 0.0
    other_actual_total: float = 0.0
    wet_waste_processed_total: float = 0.0
    compost_output_mt_total: float = 0.0
    manure_sold_free_total: float = 0.0

    # Dry Waste Totals
    mrf_capacity_total: float = 0.0
    mrf_actual_total: float = 0.0
    recyclable_sold_mt_total: float = 0.0
    recyclable_sent_to_recyclers_total: float = 0.0
    dry_waste_cement_mt_total: float = 0.0
    total_dry_waste_processed_total: float = 0.0

    # Sanitary & Special Waste Totals
    sanitary_waste_incinerated_total: float = 0.0
    special_waste_processed_total: float = 0.0

    # Calculated & Aggregate Totals
    total_processing_capacity_mt: float = 0.0
    total_processed_mt: float = 0.0
    total_processed_waste_total: float = 0.0
    dump_yard_mt_total: float = 0.0
    total_waste_handled_mt: float = 0.0
    landfill_diversion_rate_pct: float = 0.0
    capacity_utilization_pct: float = 0.0
    avg_processed_waste_pct: float = 0.0

# ----------------- UWM SCHEMAS -----------------

class UwmBaselineSchema(BaseModel):
    id: int
    ulb_id: int
    pdf_s_no: int
    ulb_name: Optional[str] = None
    ulb_region: Optional[str] = None
    ulb_category: Optional[str] = None
    total_sewage_generation_mld: float
    targeted_households: int
    connected_households: int
    stp_location_name: Optional[str] = None
    installed_stp_capacity_mld: float
    no_of_pumping_stations: int
    no_of_lifting_stations: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UwmBaselineUpdate(BaseModel):
    total_sewage_generation_mld: Optional[float] = Field(default=None, ge=0.0, le=5000.0)
    targeted_households: Optional[int] = Field(default=None, ge=0, le=10000000)
    connected_households: Optional[int] = Field(default=None, ge=0, le=10000000)
    installed_stp_capacity_mld: Optional[float] = Field(default=None, ge=0.0, le=5000.0)
    stp_location_name: Optional[str] = Field(default=None, max_length=150)
    no_of_pumping_stations: Optional[int] = Field(default=None, ge=0, le=500)
    no_of_lifting_stations: Optional[int] = Field(default=None, ge=0, le=500)

class DailyUwmLogCreate(BaseModel):
    ulb_id: int
    log_date: date
    sewage_inflow_mld: float = Field(default=0.0, ge=0.0, le=5000.0, description="Sewage inflow received today (MLD)")
    stp_functional: str = Field(default="Yes", description="STP/FSTP Functional (Yes / No)")
    stp_location_name: Optional[str] = Field(default=None, max_length=150)
    utilization_capacity_mld: float = Field(default=0.0, ge=0.0, le=5000.0, description="Utilization capacity of Existing STP's (MLD)")
    performance_standards: str = Field(default="Compliant", description="Compliant / Within Limits / Non-Compliant / N/A")
    discharge_point: str = Field(default="River", description="River, Lake, Land, Industrial, Drain, Other")
    treated_reuse_mld: float = Field(default=0.0, ge=0.0, le=5000.0, description="Utilisation (MLD)")
    reuse_purpose: str = Field(default="Gardening / Parks", description="Gardening, Agriculture, Industrial, Flushing, Other")
    sludge_generation_mt: float = Field(default=0.0, ge=0.0, le=10000.0, description="Sludge generation (MT)")
    sludge_management: str = Field(default="Co-composting", description="Co-composting, Solar Drying, Landfill, Bio-methanation, Other")
    functional_pumping_stations: int = Field(default=0, ge=0, le=500)
    functional_lifting_stations: int = Field(default=0, ge=0, le=500)

class DailyUwmLogResponse(BaseModel):
    id: int
    ulb_id: int
    ulb_name: Optional[str] = None
    ulb_region: Optional[str] = None
    pdf_s_no: Optional[int] = None
    log_date: date

    # Static Baseline Fields (View-only for ULB operators)
    total_sewage_generation_mld: float = 0.0
    targeted_households: int = 0
    connected_households: int = 0
    installed_stp_capacity_mld: float = 0.0
    baseline_pumping_stations: int = 0
    baseline_lifting_stations: int = 0

    # Operational daily values
    sewage_inflow_mld: float = 0.0
    stp_functional: str = "Yes"
    stp_location_name: Optional[str] = None
    utilization_capacity_mld: float = 0.0
    utilization_pct: float = 0.0
    performance_standards: str = "Compliant"
    discharge_point: str = "River"
    treated_reuse_mld: float = 0.0
    reuse_purpose: str = "Gardening / Parks"
    sludge_generation_mt: float = 0.0
    sludge_management: str = "Co-composting"
    functional_pumping_stations: int = 0
    functional_lifting_stations: int = 0

    data_quality_flag: str = "VALID"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UwmDashboardKPIs(BaseModel):
    target_date: date
    total_ulbs: int
    submitted_ulbs: int
    pending_ulbs: int
    compliance_pct: float

    # Statewide Aggregations
    total_sewage_generation_mld: float
    total_sewage_inflow_mld: float
    total_targeted_households: int
    total_connected_households: int
    household_sewer_coverage_pct: float
    total_installed_stp_capacity_mld: float
    total_utilization_capacity_mld: float
    avg_stp_utilization_pct: float
    total_treated_reuse_mld: float
    total_sludge_generation_mt: float
    functional_stps_count: int
    total_stps_count: int
    total_pumping_stations: int
    functional_pumping_stations: int
    total_lifting_stations: int
    functional_lifting_stations: int

class UwmComplianceSummary(BaseModel):
    target_date: date
    total_ulbs: int
    submitted_count: int
    pending_count: int
    compliance_pct: float
    submitted_ulb_ids: List[int]
    pending_ulb_ids: List[int]

