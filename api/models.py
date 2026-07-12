from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True) # nullable for oauth users
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    sessions = relationship("SessionModel", back_populates="user", cascade="all, delete-orphan")

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_name = Column(String(255), nullable=False)
    total_reviews = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("UserModel", back_populates="sessions")
    reviews = relationship("ClassifiedReviewModel", back_populates="session", cascade="all, delete-orphan")

class ClassifiedReviewModel(Base):
    __tablename__ = "classified_reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    original_review = Column(Text, nullable=False)
    sentiment = Column(String(20), nullable=False)
    theme = Column(String(255), nullable=False)
    suggested_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    urgency_level = Column(String(20), default='low', nullable=False)
    needs_escalation = Column(Boolean, default=False, nullable=False)

    session = relationship("SessionModel", back_populates="reviews")
