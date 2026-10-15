import os
import time
import json
import uuid
import logging
import asyncio
from datetime import datetime
from typing import List, Optional
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from database import engine, get_db, Base
    from models import (
        OrderModel,
        OrderItemModel,
        CreateOrderRequest,
        OrderResponse,
        UpdateOrderStatusRequest
    )
except ImportError:
    from .database import engine, get_db, Base
    from .models import (
        OrderModel,
        OrderItemModel,
        CreateOrderRequest,
        OrderResponse,
        UpdateOrderStatusRequest
    )

# Structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"order-service","message":"%(message)s"}'
)
logger = logging.getLogger("order-service")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sagility Order Service",
    description="Order processing and lifecycle management microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
CATALOG_SERVICE_URL = os.environ.get("CATALOG_SERVICE_URL", "http://localhost:8001")

@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(json.dumps({
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": duration_ms
    }))
    return response

# Cloud-native resilient inter-service fetch with bounded retries & timeout
async def fetch_product_with_retry(product_id: int, max_retries: int = 3, timeout: float = 3.0) -> dict:
    url = f"{CATALOG_SERVICE_URL}/products/{product_id}"
    last_exception = None

    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info(f"Connecting to Catalog Service ({url}), attempt {attempt}/{max_retries}")
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Product {product_id} does not exist in catalog")
                else:
                    logger.warning(f"Catalog service returned status {resp.status_code}: {resp.text}")
                    last_exception = HTTPException(
                        status_code=502,
                        detail=f"Catalog service returned status {resp.status_code}"
                    )
        except httpx.RequestError as exc:
            logger.warning(f"Network error communicating with Catalog Service (attempt {attempt}/{max_retries}): {str(exc)}")
            last_exception = exc
            if attempt < max_retries:
                backoff = 0.2 * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)

    logger.error(f"Bounded retries exhausted for Catalog Service product {product_id}")
    raise HTTPException(
        status_code=503,
        detail=f"Catalog Service currently unavailable after {max_retries} bounded retries. Upstream error: {str(last_exception)}"
    )

@app.on_event("startup")
def seed_sample_orders():
    db = next(get_db())
    try:
        count = db.query(OrderModel).count()
        if count == 0:
            sample_order = OrderModel(
                id="ORD-78192-DEMO",
                customer_name="Alex Mercer",
                customer_email="alex.mercer@sagility.design",
                shipping_address="742 Evergreen Terrace, San Francisco, CA 94107",
                subtotal=418.00,
                tax=34.48,
                shipping=0.0,
                total_amount=452.48,
                status="CONFIRMED",
                payment_id="PAY-99214-INIT",
                created_at=datetime.utcnow()
            )
            item1 = OrderItemModel(
                order_id=sample_order.id,
                product_id=1,
                product_name="Aura Mechanical Keyboard",
                sku="SAG-KBD-01",
                unit_price=289.00,
                quantity=1,
                total_price=289.00
            )
            item2 = OrderItemModel(
                order_id=sample_order.id,
                product_id=3,
                product_name="Horizon MagSafe Charging Dock",
                sku="SAG-ACC-03",
                unit_price=129.00,
                quantity=1,
                total_price=129.00
            )
            sample_order.items.extend([item1, item2])
            db.add(sample_order)
            db.commit()
            logger.info("Seeded initial confirmed demo order.")
    except Exception as e:
        logger.error(f"Error seeding demo order: {e}")
    finally:
        db.close()

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check upstream Catalog connectivity
    catalog_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            c_resp = await client.get(f"{CATALOG_SERVICE_URL}/health")
            if c_resp.status_code == 200:
                catalog_status = "reachable"
            else:
                catalog_status = f"degraded (HTTP {c_resp.status_code})"
    except Exception as e:
        catalog_status = f"unreachable ({type(e).__name__})"

    return {
        "status": "ok",
        "service": "order-service",
        "port": 8002,
        "database": db_status,
        "database_type": "SQLite (orders.db)",
        "catalog_dependency": {
            "url": CATALOG_SERVICE_URL,
            "status": catalog_status
        },
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(payload: CreateOrderRequest, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order_items = []
    subtotal = 0.0

    # Verify each item from the Catalog microservice to get trusted price & stock
    for req_item in payload.items:
        product_data = await fetch_product_with_retry(req_item.product_id)
        
        unit_price = float(product_data["price"])
        item_total = round(unit_price * req_item.quantity, 2)
        subtotal += item_total

        order_item = OrderItemModel(
            order_id=order_id,
            product_id=product_data["id"],
            product_name=product_data["name"],
            sku=product_data["sku"],
            unit_price=unit_price,
            quantity=req_item.quantity,
            total_price=item_total
        )
        order_items.append(order_item)

    subtotal = round(subtotal, 2)
    tax = round(subtotal * 0.0825, 2) # Standard 8.25% tax
    shipping = 0.0 # Free shipping above $100
    if subtotal < 100.0:
        shipping = 15.0
    total_amount = round(subtotal + tax + shipping, 2)

    order = OrderModel(
        id=order_id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        shipping_address=payload.shipping_address,
        subtotal=subtotal,
        tax=tax,
        shipping=shipping,
        total_amount=total_amount,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    order.items = order_items

    db.add(order)
    db.commit()
    db.refresh(order)

    logger.info(f"Order created successfully: {order.id} with total ${order.total_amount}")
    return order

@app.get("/orders", response_model=List[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(OrderModel).order_by(OrderModel.created_at.desc()).limit(50).all()
    return orders

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order

@app.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, payload: UpdateOrderStatusRequest, db: Session = Depends(get_db)):
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order.status = payload.status
    if payload.payment_id:
        order.payment_id = payload.payment_id
    order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    logger.info(f"Order {order_id} status updated to {payload.status}")
    return order
