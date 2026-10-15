"""
Sagility Demo - Local Multi-Service Orchestrator
Runs:
  - Catalog Service: http://localhost:8001
  - Order Service:   http://localhost:8002
  - Payment Service: http://localhost:8003
  - Frontend:        http://localhost:5173
"""
import sys
import os
import subprocess
import time
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

processes = []

def start_service(name, cmd, cwd, env=None):
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    print(f"[Sagility] Starting {name}...")
    p = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=merged_env,
        shell=True
    )
    processes.append((name, p))
    return p

def cleanup(sig=None, frame=None):
    print("\n[Sagility] Gracefully stopping all services...")
    for name, p in processes:
        try:
            print(f"  Terminating {name} (PID {p.pid})...")
            p.terminate()
            p.kill()
        except Exception:
            pass
    print("[Sagility] All services stopped.")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("=" * 65)
    print("  SAGILITY DEMO — Intelligent Commerce. Seamlessly Connected.")
    print("=" * 65)

    python_exe = sys.executable

    # 1. Catalog Service (8001)
    catalog_dir = ROOT_DIR / "services" / "catalog"
    start_service(
        "Catalog Service (:8001)",
        f'"{python_exe}" -m uvicorn main:app --host 127.0.0.1 --port 8001',
        catalog_dir
    )

    # 2. Order Service (8002)
    order_dir = ROOT_DIR / "services" / "order"
    start_service(
        "Order Service (:8002)",
        f'"{python_exe}" -m uvicorn main:app --host 127.0.0.1 --port 8002',
        order_dir,
        env={"CATALOG_SERVICE_URL": "http://127.0.0.1:8001"}
    )

    # 3. Payment Service (8003)
    payment_dir = ROOT_DIR / "services" / "payment"
    start_service(
        "Payment Service (:8003)",
        f'"{python_exe}" -m uvicorn main:app --host 127.0.0.1 --port 8003',
        payment_dir,
        env={"ORDER_SERVICE_URL": "http://127.0.0.1:8002"}
    )

    # Allow services 2 seconds to initialize
    time.sleep(2)

    # 4. Frontend Vite Dev Server (:5173)
    frontend_dir = ROOT_DIR / "frontend"
    start_service(
        "Frontend UI (:5173)",
        "npm run dev -- --host 127.0.0.1 --port 5173",
        frontend_dir
    )

    print("\n" + "=" * 65)
    print("  All services active! Access the demo at:")
    print("  → Storefront & Architecture UI: http://127.0.0.1:5173")
    print("  → Catalog Swagger Docs:         http://127.0.0.1:8001/docs")
    print("  → Order Swagger Docs:           http://127.0.0.1:8002/docs")
    print("  → Payment Swagger Docs:         http://127.0.0.1:8003/docs")
    print("=" * 65)
    print("Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
