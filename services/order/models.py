from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
try:
    from database import Base
except ImportError:
    from .database import Base

class OrderItemModel(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, nullable=False)
    product_name = Column(String(200), nullable=False)
    sku = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship("OrderModel", back_populates="items")

class OrderModel(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, index=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(200), nullable=False)
    shipping_address = Column(String(300), nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    shipping = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="PENDING", index=True) # PENDING, CONFIRMED, PAYMENT_FAILED
    payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItemModel", back_populates="order", cascade="all, delete-orphan")

# Pydantic Schemas
class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")

class CreateOrderRequest(BaseModel):
    customer_name: str = Field(min_length=2)
    customer_email: str = Field(min_length=5)
    shipping_address: str = Field(min_length=5)
    items: List[OrderItemRequest]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    shipping_address: str
    subtotal: float
    tax: float
    shipping: float
    total_amount: float
    status: str
    payment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(pattern="^(PENDING|CONFIRMED|PAYMENT_FAILED)$")
    payment_id: Optional[str] = None
