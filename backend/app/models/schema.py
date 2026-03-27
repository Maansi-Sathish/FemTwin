from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime

# ── SQLAlchemy ORM Models ──────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)
    email         = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    age           = Column(Integer, nullable=True)
    weight        = Column(Float, nullable=True)
    height        = Column(Float, nullable=True)
    blood_type    = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    analyses      = relationship("HealthAnalysis", back_populates="user")

class HealthAnalysis(Base):
    __tablename__ = "health_analyses"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    symptoms   = Column(JSON)
    results    = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship("User", back_populates="analyses")

# ── Pydantic Schemas ───────────────────────────────────────────
class HealthInput(BaseModel):
    fatigue: bool = False
    hair_loss: bool = False
    weight_gain: bool = False
    irregular_periods: bool = False
    acne: bool = False
    dizziness: bool = False
    pale_skin: bool = False

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

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int]
    weight: Optional[float]
    height: Optional[float]
    blood_type: Optional[str]
    class Config:
        from_attributes = True