import uvicorn
from app.seed import seed_database

if __name__ == "__main__":
    print("Starting CyberOpt-RQ Backend Server...")
    seed_database()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
