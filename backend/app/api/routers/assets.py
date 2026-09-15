from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import Asset
from app.schemas.schemas import AssetSchema

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("/", response_model=List[AssetSchema])
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()

@router.get("/{asset_id}", response_model=AssetSchema)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
