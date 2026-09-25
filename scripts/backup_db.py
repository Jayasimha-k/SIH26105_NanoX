import sqlite3
import json
import os
import shutil

def backup_db():
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "backup"))
    os.makedirs(backup_dir, exist_ok=True)
    
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_paths = [
        os.path.join(root_dir, "cyberopt_rq.db"),
        os.path.join(root_dir, "backend", "cyberopt_rq.db")
    ]
    
    for db_path in db_paths:
        if os.path.exists(db_path):
            filename = os.path.basename(db_path)
            prefix = "root_" if "backend" not in db_path else "backend_"
            dest = os.path.join(backup_dir, f"{prefix}{filename}")
            shutil.copy(db_path, dest)
            print(f"Copied {db_path} -> {dest}")
            
            # Export data as JSON
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]
            data = {}
            for t in tables:
                cursor.execute(f"SELECT * FROM [{t}]")
                cols = [desc[0] for desc in cursor.description]
                rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
                data[t] = rows
            conn.close()
            
            json_dest = os.path.join(backup_dir, f"{prefix}snapshot.json")
            with open(json_dest, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
            print(f"Exported {len(tables)} tables to {json_dest}")

if __name__ == "__main__":
    backup_db()
