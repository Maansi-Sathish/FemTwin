from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String)
    email             = Column(String, unique=True, index=True)
    hashed_password   = Column(String)
    age               = Column(Integer, nullable=True)
    weight            = Column(Float, nullable=True)
    height            = Column(Float, nullable=True)
    blood_type        = Column(String, nullable=True)
    # Health metrics
    bp_systolic       = Column(Integer, nullable=True)
    bp_diastolic      = Column(Integer, nullable=True)
    blood_sugar       = Column(Float, nullable=True)
    cholesterol_total = Column(Float, nullable=True)
    cholesterol_hdl   = Column(Float, nullable=True)
    cholesterol_ldl   = Column(Float, nullable=True)
    hemoglobin        = Column(Float, nullable=True)
    profile_complete  = Column(Boolean, default=False)
    created_at        = Column(DateTime, default=datetime.utcnow)
    analyses          = relationship("HealthAnalysis", back_populates="user")
    reports           = relationship("MedicalReport", back_populates="user")

class HealthAnalysis(Base):
    __tablename__ = "health_analyses"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    symptoms   = Column(JSON)
    results    = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship("User", back_populates="analyses")

class MedicalReport(Base):
    __tablename__ = "medical_reports"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    filename     = Column(String)
    extracted    = Column(JSON)
    created_at   = Column(DateTime, default=datetime.utcnow)
    user         = relationship("User", back_populates="reports")

# Pydantic schemas
class HealthInput(BaseModel):
    fatigue: bool = False
    hair_loss: bool = False
    weight_gain: bool = False
    irregular_periods: bool = False
    acne: bool = False
    dizziness: bool = False
    pale_skin: bool = False
    pp_depression: bool = False
    pp_anxiety: bool = False
    pp_sleep: bool = False
    pp_hair: bool = False
    is_postpartum: bool = False

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_type: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_type: Optional[str] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    blood_sugar: Optional[float] = None
    cholesterol_total: Optional[float] = None
    cholesterol_hdl: Optional[float] = None
    cholesterol_ldl: Optional[float] = None
    hemoglobin: Optional[float] = None
    profile_complete: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_type: Optional[str] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    blood_sugar: Optional[float] = None
    cholesterol_total: Optional[float] = None
    cholesterol_hdl: Optional[float] = None
    cholesterol_ldl: Optional[float] = None
    hemoglobin: Optional[float] = None
    profile_complete: Optional[bool] = None
    class Config:
        from_attributes = True