import time
import json
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, text

try:
    from database import engine, get_db, Base
    from models import ProductModel, ProductResponse, ProductListResponse
except ImportError:
    from .database import engine, get_db, Base
    from .models import ProductModel, ProductResponse, ProductListResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"catalog-service","message":"%(message)s"}'
)
logger = logging.getLogger("catalog-service")

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sagility Catalog Service",
    description="Product catalog and inventory management microservice",
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

# Fault injection state for cloud-native failure demo
FAULT_STATE = {
    "active": False,
    "mode": None, # 'latency', '500_error'
    "latency_seconds": 0.0
}

@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    start = time.time()
    
    # Check simulated fault
    if FAULT_STATE["active"]:
        if FAULT_STATE["mode"] == "latency" and not request.url.path.startswith(("/health", "/fault")):
            time.sleep(FAULT_STATE["latency_seconds"])
        elif FAULT_STATE["mode"] == "500_error" and not request.url.path.startswith(("/health", "/fault")):
            duration_ms = round((time.time() - start) * 1000, 2)
            logger.error(json.dumps({
                "method": request.method,
                "path": request.url.path,
                "status": 500,
                "duration_ms": duration_ms,
                "simulated_fault": True
            }))
            return Response(
                content=json.dumps({"detail": "Simulated upstream failure: Catalog database degradation"}),
                status_code=500,
                media_type="application/json"
            )

    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(json.dumps({
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": duration_ms
    }))
    return response

# Seed products
SAMPLE_PRODUCTS = [
    {
        "sku": "SAG-KBD-01",
        "name": "Aura Mechanical Keyboard",
        "tagline": "Precision milled anodized aluminum with gasket-mounted tactility",
        "description": "Crafted from a solid block of 6063 aerospace aluminum, the Aura Keyboard features custom lubricated linear switches, seamless hot-swap support, and multi-layer sound dampening silicone.",
        "category": "Hardware",
        "price": 289.00,
        "stock": 18,
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
        "badge": "Signature",
        "rating": 4.96,
        "reviews_count": 214
    },
    {
        "sku": "SAG-AUD-02",
        "name": "Sonance Studio Monitors",
        "tagline": "Planar magnetic transducers with true spatial frequency curve",
        "description": "Engineered for uncompromising acoustic clarity, the Sonance Studio Monitors deliver neutral transient response across an ultra-wide 15Hz to 45kHz frequency range with zero phase distortion.",
        "category": "Audio",
        "price": 449.00,
        "stock": 12,
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80",
        "badge": "Bestseller",
        "rating": 4.92,
        "reviews_count": 189
    },
    {
        "sku": "SAG-ACC-03",
        "name": "Horizon MagSafe Charging Dock",
        "tagline": "Weighted matte ceramic base with 25W Qi2 fast inductive charging",
        "description": "Minimalist desk sculpture designed to power up your ecosystem simultaneously. Features micro-suction stabilization feet, woven braided cable, and precision heat dissipation chambers.",
        "category": "Desk Accessories",
        "price": 129.00,
        "stock": 35,
        "image_url": "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=80",
        "badge": "Popular",
        "rating": 4.88,
        "reviews_count": 94
    },
    {
        "sku": "SAG-LGT-04",
        "name": "Lumen Sculpt Task Light",
        "tagline": "CRI 98+ full-spectrum daylight reproduction with gesture dimming",
        "description": "Eliminate eye strain with custom engineered micro-prism optics. Features infinite rotational balancing, color temperature tuning between 2700K and 6500K, and automatic ambient light sensing.",
        "category": "Lighting",
        "price": 195.00,
        "stock": 22,
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
        "badge": "Design Award",
        "rating": 4.95,
        "reviews_count": 162
    },
    {
        "sku": "SAG-ACC-05",
        "name": "Vektor Precision Control Dial",
        "tagline": "Tactile haptic rotary encoder for timeline scrubbing & micro-adjustments",
        "description": "Integrates seamlessly with creative suites and developer tooling. Built-in OLED center display reflects active tool parameters with magnetic detents that adapt dynamically to software context.",
        "category": "Hardware",
        "price": 175.00,
        "stock": 15,
        "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        "badge": "New",
        "rating": 4.89,
        "reviews_count": 78
    },
    {
        "sku": "SAG-AUD-06",
        "name": "Aero Carbon Wireless Earbuds",
        "tagline": "Hybrid ANC with graphene drivers and carbon weave charging capsule",
        "description": "Sub-gram balance in each ear with 42dB active cancellation and dual beamforming voice arrays. Over 38 hours of total battery life with fast-charge case.",
        "category": "Audio",
        "price": 219.00,
        "stock": 29,
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80",
        "badge": "Staff Pick",
        "rating": 4.91,
        "reviews_count": 310
    },
    {
        "sku": "SAG-ACC-07",
        "name": "Modena Tuscan Leather Desk Pad",
        "tagline": "Vegetable-tanned full grain leather with waterproof microsuede backing",
        "description": "Hand-stitched in Florence from full grain vegetable-tanned leather that develops a rich, distinct patina over decades. Optimized glide coefficient for both optical and laser sensors.",
        "category": "Desk Accessories",
        "price": 115.00,
        "stock": 40,
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80",
        "badge": "Handcrafted",
        "rating": 4.97,
        "reviews_count": 145
    },
    {
        "sku": "SAG-LGT-08",
        "name": "Prism Linear Ambient Glow",
        "tagline": "Wall-projected indirect architectural lighting with fluid color scenes",
        "description": "Transforms your workspace ambiance with edge-lit diffusion panels and smart home connectivity. Smooth gradient blending with circadian rhythm scheduling.",
        "category": "Lighting",
        "price": 160.00,
        "stock": 19,
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80",
        "badge": "Atmospheric",
        "rating": 4.87,
        "reviews_count": 86
    }
]

@app.on_event("startup")
def seed_catalog():
    db = next(get_db())
    try:
        count = db.query(ProductModel).count()
        if count == 0:
            logger.info("Database empty. Seeding initial catalog items...")
            for item in SAMPLE_PRODUCTS:
                product = ProductModel(**item)
                db.add(product)
            db.commit()
            logger.info(f"Seeded {len(SAMPLE_PRODUCTS)} products successfully.")
    except Exception as e:
        logger.error(f"Error during seeding: {str(e)}")
    finally:
        db.close()

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "degraded" if FAULT_STATE["active"] else "ok",
        "service": "catalog-service",
        "port": 8001,
        "database": db_status,
        "database_type": "SQLite (catalog.db)",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "fault_injection": FAULT_STATE,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/products", response_model=ProductListResponse)
def get_products(
    search: Optional[str] = Query(None, description="Search by name, description, or sku"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ProductModel)

    if category and category.lower() != "all":
        query = query.filter(ProductModel.category.ilike(category))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ProductModel.name.ilike(search_term),
                ProductModel.description.ilike(search_term),
                ProductModel.sku.ilike(search_term)
            )
        )

    if min_price is not None:
        query = query.filter(ProductModel.price >= min_price)
    if max_price is not None:
        query = query.filter(ProductModel.price <= max_price)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")
    return product

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(ProductModel.category).distinct().all()
    return [c[0] for c in categories]

# Architecture Safe Fault Demonstration Endpoints
@router.post("/fault/inject")
def inject_fault(mode: str = Query("500_error", enum=["500_error", "latency"]), latency_sec: float = 3.0):
    FAULT_STATE["active"] = True
    FAULT_STATE["mode"] = mode
    FAULT_STATE["latency_seconds"] = latency_sec
    logger.warning(f"Simulated fault injected: {mode} (latency: {latency_sec}s)")
    return {"message": "Simulated fault injected into Catalog Service", "fault": FAULT_STATE}

@router.post("/fault/restore")
def restore_fault():
    FAULT_STATE["active"] = False
    FAULT_STATE["mode"] = None
    FAULT_STATE["latency_seconds"] = 0.0
    logger.info("Simulated fault restored. Catalog Service operational.")
    return {"message": "Catalog Service restored to normal operation", "fault": FAULT_STATE}

# Mount both without prefix (for internal calls / Nginx) and with /api/catalog (for Vercel rewrites)
app.include_router(router)
app.include_router(router, prefix="/api/catalog")
