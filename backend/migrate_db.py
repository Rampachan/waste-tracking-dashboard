import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "waste_management.db")

def migrate():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("PRAGMA table_info(daily_waste_logs)")
    existing_cols = {row[1] for row in c.fetchall()}
    print(f"Existing columns ({len(existing_cols)}): {existing_cols}")

    new_columns = [
        ("segregated_hh_collected", "INTEGER DEFAULT 0"),
        ("total_generation_today_mt", "FLOAT DEFAULT 0.0"),
        ("compost_output_mt", "FLOAT DEFAULT 0.0"),
        ("recyclable_sold_mt", "FLOAT DEFAULT 0.0"),
        ("dry_waste_cement_mt", "FLOAT DEFAULT 0.0"),
        ("data_quality_flag", "VARCHAR(30) DEFAULT 'VALID'")
    ]

    added = []
    for col_name, col_def in new_columns:
        if col_name not in existing_cols:
            print(f"Adding column: {col_name} {col_def}")
            c.execute(f"ALTER TABLE daily_waste_logs ADD COLUMN {col_name} {col_def}")
            added.append(col_name)

    conn.commit()
    conn.close()
    print(f"Migration complete. Added {len(added)} columns: {added}")

if __name__ == "__main__":
    migrate()
