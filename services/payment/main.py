import os
import time
import json
import uuid
import logging
import asyncio
from datetime import datetime
from typing import Optional
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

try:
    from database import engine, get_db, Base
    from models import (
        PaymentModel,
        ProcessPaymentRequest,
        PaymentResponse
    )
except ImportError:
    from .database import engine, get_db, Base
    from .models import (
        PaymentModel,
        ProcessPaymentRequest,
        PaymentResponse
    )

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"payment-service","message":"%(message)s"}'
)
logger = logging.getLogger("payment-service")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sagility Payment Service",
    description="Payment simulation and idempotency management microservice",
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
ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://localhost:8002")

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

# Cloud-native status update to Order Service with bounded retries
async def sync_order_status(order_id: str, status: str, payment_id: str, max_retries: int = 3, timeout: float = 3.0):
    url = f"{ORDER_SERVICE_URL}/orders/{order_id}/status"
    payload = {"status": status, "payment_id": payment_id}

    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info(f"Syncing order status to {status} for {order_id} (attempt {attempt}/{max_retries})")
                resp = await client.patch(url, json=payload)
                if resp.status_code in (200, 204):
                    logger.info(f"Successfully synced order {order_id} status to {status}")
                    return True
                else:
                    logger.warning(f"Order Service returned HTTP {resp.status_code}: {resp.text}")
        except httpx.RequestError as exc:
            logger.warning(f"Network error syncing order status (attempt {attempt}/{max_retries}): {exc}")
            if attempt < max_retries:
                await asyncio.sleep(0.2 * (2 ** (attempt - 1)))

    logger.error(f"Failed to sync order {order_id} status after {max_retries} attempts")
    return False

@app.on_event("startup")
def seed_sample_payment():
    db = next(get_db())
    try:
        count = db.query(PaymentModel).count()
        if count == 0:
            sample_pay = PaymentModel(
                id="PAY-99214-INIT",
                order_id="ORD-78192-DEMO",
                amount=452.48,
                currency="USD",
                status="SUCCESS",
                idempotency_key="idemp_init_sample_key_001",
                payment_method="Mock Visa •••• 4242",
                failure_reason=None,
                created_at=datetime.utcnow()
            )
            db.add(sample_pay)
            db.commit()
            logger.info("Seeded initial demo payment.")
    except Exception as e:
        logger.error(f"Error seeding demo payment: {e}")
    finally:
        db.close()

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    order_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            o_resp = await client.get(f"{ORDER_SERVICE_URL}/health")
            if o_resp.status_code == 200:
                order_status = "reachable"
            else:
                order_status = f"degraded (HTTP {o_resp.status_code})"
    except Exception as e:
        order_status = f"unreachable ({type(e).__name__})"

    return {
        "status": "ok",
        "service": "payment-service",
        "port": 8003,
        "database": db_status,
        "database_type": "SQLite (payments.db)",
        "order_dependency": {
            "url": ORDER_SERVICE_URL,
            "status": order_status
        },
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/payments", response_model=PaymentResponse, status_code=201)
async def process_payment(
    payload: ProcessPaymentRequest,
    response: Response,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    key = idempotency_key_header or payload.idempotency_key
    if not key:
        raise HTTPException(status_code=400, detail="Idempotency key required via header or payload")

    # 1. Check idempotency in database
    existing_payment = db.query(PaymentModel).filter(PaymentModel.idempotency_key == key).first()
    if existing_payment:
        logger.info(f"Idempotent hit for key {key}. Returning existing payment {existing_payment.id}")
        response.headers["X-Cache-Lookup"] = "HIT"
        response.headers["X-Idempotency-Replay"] = "true"
        return PaymentResponse(
            id=existing_payment.id,
            order_id=existing_payment.order_id,
            amount=existing_payment.amount,
            currency=existing_payment.currency,
            status=existing_payment.status,
            idempotency_key=existing_payment.idempotency_key,
            payment_method=existing_payment.payment_method,
            failure_reason=existing_payment.failure_reason,
            created_at=existing_payment.created_at,
            is_idempotent_replay=True
        )

    # 2. Simulate payment processing
    payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
    status = "SUCCESS"
    failure_reason = None

    if payload.simulate_failure or "fail" in (payload.payment_method or "").lower():
        status = "FAILED"
        failure_reason = "Simulated card authorization decline [Do Not Honor: Code 05]"

    payment = PaymentModel(
        id=payment_id,
        order_id=payload.order_id,
        amount=payload.amount,
        currency="USD",
        status=status,
        idempotency_key=key,
        payment_method=payload.payment_method or "Mock Visa •••• 4242",
        failure_reason=failure_reason,
        created_at=datetime.utcnow()
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # 3. Synchronize status with Order Service
    order_status = "CONFIRMED" if status == "SUCCESS" else "PAYMENT_FAILED"
    await sync_order_status(payload.order_id, order_status, payment_id)

    response.headers["X-Cache-Lookup"] = "MISS"
    return PaymentResponse(
        id=payment.id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        idempotency_key=payment.idempotency_key,
        payment_method=payment.payment_method,
        failure_reason=payment.failure_reason,
        created_at=payment.created_at,
        is_idempotent_replay=False
    )

@app.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(PaymentModel).filter(PaymentModel.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail=f"Payment {payment_id} not found")
    return payment

@app.get("/payments/by-order/{order_id}", response_model=PaymentResponse)
def get_payment_by_order(order_id: str, db: Session = Depends(get_db)):
    payment = db.query(PaymentModel).filter(PaymentModel.order_id == order_id).order_by(PaymentModel.created_at.desc()).first()
    if not payment:
        raise HTTPException(status_code=404, detail=f"No payment recorded for order {order_id}")
    return payment
