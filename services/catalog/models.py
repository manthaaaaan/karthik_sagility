from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
try:
    from database import Base
except ImportError:
    from .database import Base

class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=10)
    image_url = Column(String(500), nullable=False)
    badge = Column(String(50), nullable=True)
    rating = Column(Float, default=4.9)
    reviews_count = Column(Integer, default=128)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    tagline: Optional[str] = None
    description: str
    category: str
    price: float
    stock: int
    image_url: str
    badge: Optional[str] = None
    rating: float
    reviews_count: int

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
