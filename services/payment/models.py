from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
try:
    from database import Base
except ImportError:
    from .database import Base

class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(String(50), primary_key=True, index=True)
    order_id = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(String(20), nullable=False, index=True) # SUCCESS, FAILED
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    payment_method = Column(String(100), default="Mock Visa •••• 4242", nullable=False)
    failure_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessPaymentRequest(BaseModel):
    order_id: str
    amount: float = Field(gt=0)
    idempotency_key: str = Field(min_length=6)
    simulate_failure: bool = False
    payment_method: Optional[str] = "Mock Visa •••• 4242"

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    currency: str
    status: str
    idempotency_key: str
    payment_method: str
    failure_reason: Optional[str] = None
    created_at: datetime
    is_idempotent_replay: bool = False

    class Config:
        from_attributes = True
