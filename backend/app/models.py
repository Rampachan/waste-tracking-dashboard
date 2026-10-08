from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class ULB(Base):
    __tablename__ = "ulbs"

    id = Column(Integer, primary_key=True, index=True)
    s_no = Column(Integer, nullable=False)
    region = Column(String(50), nullable=False, index=True) # e.g. "Corporation", "Chengalpattu Region"
    category = Column(String(50), nullable=False)           # "Corporation" or "Municipality"
    name = Column(String(100), nullable=False, unique=True, index=True)
    households = Column(Integer, default=20000)
    
    # Default facility capacities in Metric Tonnes (MT)
    default_mcc_capacity = Column(Float, default=10.0)
    default_mrf_capacity = Column(Float, default=7.0)
    default_biometh_capacity = Column(Float, default=3.0)
    default_other_capacity = Column(Float, default=1.5)

    users = relationship("User", back_populates="ulb")
    daily_logs = relationship("DailyWasteLog", back_populates="ulb")
    facilities = relationship("SwmFacility", back_populates="ulb", cascade="all, delete-orphan")
    uwm_baseline = relationship("UwmBaseline", back_populates="ulb", uselist=False)
    daily_uwm_logs = relationship("DailyUwmLog", back_populates="ulb")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # 'DIRECTOR', 'HQ_USER', 'ULB_USER', 'ADMIN'
    full_name = Column(String(150), nullable=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=True)

    ulb = relationship("ULB", back_populates="users")
    logs_submitted = relationship("DailyWasteLog", back_populates="submitted_by")
    uwm_logs_submitted = relationship("DailyUwmLog", back_populates="submitted_by")

class DailyWasteLog(Base):
    __tablename__ = "daily_waste_logs"

    id = Column(Integer, primary_key=True, index=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)

    # Door to Door Collection & Segregation
    total_households = Column(Integer, nullable=False)
    door_to_door_hhs = Column(Integer, nullable=False)
    segregated_hh_collected = Column(Integer, default=0)
    collection_pct = Column(Float, nullable=False) # (door_to_door_hhs / total_households) * 100

    # Daily Generation
    total_generation_today_mt = Column(Float, default=0.0)

    # Daily incoming waste to Processing facilities (Quantity in MT)
    # 1. MCCs / Windrow (Wet Waste)
    mcc_capacity = Column(Float, default=0.0)
    mcc_actual = Column(Float, default=0.0)

    # 2. MRFs (Dry Waste)
    mrf_capacity = Column(Float, default=0.0)
    mrf_actual = Column(Float, default=0.0)

    # 3. BioMethanation plant (Wet Waste)
    biometh_capacity = Column(Float, default=0.0)
    biometh_actual = Column(Float, default=0.0)

    # 4. Other facility
    other_capacity = Column(Float, default=0.0)
    other_actual = Column(Float, default=0.0)

    # Wet Waste Products
    compost_output_mt = Column(Float, default=0.0) # Output quantity as compost per day (MT)

    # Dry Waste Recovery & Industrial Disposal
    recyclable_sold_mt = Column(Float, default=0.0) # Recyclable waste sold by sanitary workers (MT)
    dry_waste_cement_mt = Column(Float, default=0.0) # Dry waste disposed (Cement industries / recycling units) (MT)

    # Unprocessed Waste sending to Dump Yard in MT
    dump_yard_mt = Column(Float, default=0.0)

    # Automated Data Quality Flag (e.g. 'VALID', 'WARNING', 'CRITICAL')
    data_quality_flag = Column(String(30), default="VALID")

    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ulb = relationship("ULB", back_populates="daily_logs")
    submitted_by = relationship("User", back_populates="logs_submitted")
    facility_logs = relationship("DailyFacilityLog", back_populates="daily_waste_log", cascade="all, delete-orphan")

    # One official record per ULB per calendar day
    __table_args__ = (
        UniqueConstraint("ulb_id", "log_date", name="uix_ulb_date"),
    )

class SwmFacility(Base):
    __tablename__ = "swm_facilities"

    id = Column(Integer, primary_key=True, index=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=False, index=True)
    facility_type = Column(String(20), nullable=False) # 'MCC' or 'MRF'
    name = Column(String(150), nullable=False)
    capacity_mt = Column(Float, default=0.0)
    location = Column(String(200), nullable=True)
    status = Column(String(20), default="ACTIVE") # 'ACTIVE' or 'INACTIVE'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ulb = relationship("ULB", back_populates="facilities")
    daily_facility_logs = relationship("DailyFacilityLog", back_populates="facility", cascade="all, delete-orphan")

class DailyFacilityLog(Base):
    __tablename__ = "daily_facility_logs"

    id = Column(Integer, primary_key=True, index=True)
    daily_waste_log_id = Column(Integer, ForeignKey("daily_waste_logs.id"), nullable=True, index=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=False, index=True)
    facility_id = Column(Integer, ForeignKey("swm_facilities.id"), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)
    capacity_mt = Column(Float, default=0.0)
    actual_processed_mt = Column(Float, default=0.0)
    operational_status = Column(String(30), default="OPERATIONAL") # 'OPERATIONAL', 'PARTIAL', 'NON_OPERATIONAL'
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("SwmFacility", back_populates="daily_facility_logs")
    daily_waste_log = relationship("DailyWasteLog", back_populates="facility_logs")

    __table_args__ = (
        UniqueConstraint("facility_id", "log_date", name="uix_facility_date"),
    )


class UwmBaseline(Base):
    __tablename__ = "uwm_baselines"

    id = Column(Integer, primary_key=True, index=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=False, unique=True, index=True)
    pdf_s_no = Column(Integer, nullable=False)

    # 1. Sewage status Estimation (Frozen Baseline)
    total_sewage_generation_mld = Column(Float, default=0.0) # Total sewage generation per day (in MLD)

    # 2. Sewage / Conveyance sewers (Frozen Baseline)
    targeted_households = Column(Integer, default=0)         # Targeted Household to be connected to sewers
    connected_households = Column(Integer, default=0)        # Households connected

    # 3. Sewage treatment and utilisation (Frozen Baseline)
    stp_location_name = Column(String(150), nullable=True)   # STP Location Name
    installed_stp_capacity_mld = Column(Float, default=0.0)  # Installed Treatment capacities of Existing STPs (MLD)

    # 4. Pumping & Lifting Stations (Frozen Baseline)
    no_of_pumping_stations = Column(Integer, default=0)      # No. of Pumping Station
    no_of_lifting_stations = Column(Integer, default=0)      # No. of Lifting Stations

    last_updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ulb = relationship("ULB", back_populates="uwm_baseline")
    last_updated_by = relationship("User")


class DailyUwmLog(Base):
    __tablename__ = "daily_uwm_logs"

    id = Column(Integer, primary_key=True, index=True)
    ulb_id = Column(Integer, ForeignKey("ulbs.id"), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)

    # 1. Sewage status Estimation and Measurement (Daily operational entry)
    sewage_inflow_mld = Column(Float, default=0.0)           # Sewage inflow received today (MLD)

    # 2. Sewage treatment and utilisation (Daily operational entry)
    stp_functional = Column(String(10), default="Yes")       # STP/FSTP Functional (Yes / No)
    stp_location_name = Column(String(150), nullable=True)   # Specific STP Name / Location
    utilization_capacity_mld = Column(Float, default=0.0)    # Utilization capacity of Existing STP's (MLD)
    utilization_pct = Column(Float, default=0.0)             # % Utilization = (utilization / installed) * 100
    performance_standards = Column(String(50), default="Compliant") # Compliant / Within Limits / Non-Compliant / N/A
    discharge_point = Column(String(100), default="River")   # River, Lake / Pond, Land / Agriculture, Industrial Reuse, Drain, Other
    treated_reuse_mld = Column(Float, default=0.0)           # Utilisation (MLD)
    reuse_purpose = Column(String(150), default="Gardening / Parks") # Utilisation Purpose
    sludge_generation_mt = Column(Float, default=0.0)        # Sludge generation (MT)
    sludge_management = Column(String(100), default="Co-composting") # Sludge management

    # 3. Pumping & Lifting Stations Functional counts (Daily operational entry)
    functional_pumping_stations = Column(Integer, default=0) # No. of Functional Pumping Stations
    functional_lifting_stations = Column(Integer, default=0) # No. of Functional Lifting Stations

    # Quality & Audit
    data_quality_flag = Column(String(30), default="VALID")
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ulb = relationship("ULB", back_populates="daily_uwm_logs")
    submitted_by = relationship("User", back_populates="uwm_logs_submitted")

    __table_args__ = (
        UniqueConstraint("ulb_id", "log_date", name="uix_uwm_ulb_date"),
    )
