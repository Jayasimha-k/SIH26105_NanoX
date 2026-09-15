from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import Recommendation
from app.schemas.schemas import RecommendationOut

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/", response_model=List[RecommendationOut])
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).all()

@router.get("/{rec_id}", response_model=RecommendationOut)
def get_recommendation(rec_id: str, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec
