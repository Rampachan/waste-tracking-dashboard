# Tamil Nadu Municipal Waste Monitoring System (169 ULBs)
### Solid Waste Segregation, Processing & Disposal Tracking Platform

A 100% free and open-source civic dashboard built for the **Government of Tamil Nadu, Directorate of Municipal Administration (DMA)**. It enables **169 Urban Local Bodies (24 Corporations and 145 Municipalities across 7 Regions)** to submit daily waste data, while giving **HQ and the Director** real-time statewide oversight, compliance monitoring, and automated **Daily and Monthly regional Excel exports**.

---

## 🏛️ Administrative Hierarchy (169 ULBs)

The system organizes all ULBs into official groupings with subtotals and formulas:
- **Corporations (24 ULBs)**: Coimbatore, Madurai, Salem, Erode, Tirunelveli, Dindigul, Vellore, Thanjavur, Trichy, Tiruppur, Thoothukudi, Nagercoil, Kumbakonam, Hosur, Karur, Kancheepuram, Cuddalore, Tambaram, Sivakasi, Avadi, Namakkal, Thiruvannamalai, Karaikudi, Pudukottai.
- **Chengalpattu Region (20 Municipalities)**
- **Salem Region (17 Municipalities)**
- **Vellore Region (23 Municipalities)**
- **Tiruppur Region (24 Municipalities)**
- **Madurai Region (19 Municipalities)**
- **Thanjavur Region (20 Municipalities)**
- **Tirunelveli Region (22 Municipalities)**
- **Region Total (Sum of 7 Regions = 145 Municipalities)**
- **Grand Total (Corporations + Municipalities = 169 ULBs)**

---

## 🔐 Role-Based Access Control (RBAC) & Default Credentials

| Role | Username | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Director** | `director` | `director@123` | Full statewide overview, KPIs, compliance status, Daily & Monthly Excel download. |
| **HQ Command** | `hq` | `hq@123` | Statewide access, pending ULB follow-up, master grid search, Excel export. |
| **Corporation Operator** | `ulb_coimbatore` | `ulb@123` | Locked strictly to Coimbatore. Submits daily log & views Coimbatore history. |
| **Municipality Operator** | `ulb_chengalpattu` | `ulb@123` | Locked strictly to Chengalpattu. Submits daily log & views history. |
| *All Other 167 ULBs* | `ulb_<name>` | `ulb@123` | e.g. `ulb_madurai`, `ulb_salem`, `ulb_attur`, `ulb_ambur`, `ulb_pollachi`, etc. |

---

## 🚀 How to Run Locally (Zero Cost)

### Option 1: Quick 1-Click Launch (Windows)
Double click `start-dashboard.bat` in the project root. It will automatically start:
1. Backend on `http://127.0.0.1:8000`
2. Frontend on `http://localhost:5173`

### Option 2: Manual Terminal Launch

#### 1. Backend (Python FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: `http://127.0.0.1:8000/docs`

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📊 Excel Export Features

1. **Daily Report (`.xlsx`)**:
   - Single-day snapshot of **all 169 ULBs**.
   - Grouped into Corporations and 7 Regions with bold section banners.
   - Excel formulas (`=SUM(...)` and `=(D/C)*100`) for all subtotal and grand total rows.
2. **Monthly Consolidated Report (`.xlsx`)**:
   - Month-wise cumulative table across all 169 ULBs with average D2D coverage %, total waste processed MT, dump yard MT, and diversion rate.

---

## ☁️ Future Cloud Migration (100% Free & Self-Hosted)

When you are ready to migrate to your own cloud server (VPS, NIC, TNSDC, AWS, etc.):

### Step 1: Using Docker Compose (One-Command Deployment)
Run on your cloud server:
```bash
docker compose up -d --build
```
This starts both the backend API and frontend Nginx server with automatic port mapping.

### Step 2: Switching from SQLite to PostgreSQL (Optional)
The system uses SQLAlchemy ORM. To switch from SQLite to PostgreSQL on your cloud, simply set the environment variable:
```env
DATABASE_URL=postgresql://dbuser:dbpassword@dbhost:5432/waste_db
```
Zero code changes required!
