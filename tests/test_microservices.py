import time
import requests
import uuid

CATALOG_URL = "http://127.0.0.1:8001"
ORDER_URL = "http://127.0.0.1:8002"
PAYMENT_URL = "http://127.0.0.1:8003"

def test_catalog_service():
    print("\n--- 1. Testing Catalog Service (Port 8001) ---")
    
    # Health
    r = requests.get(f"{CATALOG_URL}/health", timeout=3)
    assert r.status_code == 200, f"Catalog health failed: {r.status_code}"
    health = r.json()
    assert health["status"] == "ok"
    assert health["database"] == "connected"
    print(f"  [PASS] Catalog Health: {health['service']} (uptime: {health['uptime_seconds']}s, db: {health['database_type']})")

    # Products listing
    r = requests.get(f"{CATALOG_URL}/products", timeout=3)
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) >= 6, f"Expected at least 6 products, got {len(data['items'])}"
    first_item = data["items"][0]
    print(f"  [PASS] Seeded Products: {len(data['items'])} items found. Sample: {first_item['name']} (${first_item['price']})")

    # Categories
    r = requests.get(f"{CATALOG_URL}/categories", timeout=3)
    assert r.status_code == 200
    categories = r.json()
    assert len(categories) > 0
    print(f"  [PASS] Categories: {categories}")

    # Single Product
    r = requests.get(f"{CATALOG_URL}/products/{first_item['id']}", timeout=3)
    assert r.status_code == 200
    assert r.json()["sku"] == first_item["sku"]
    print(f"  [PASS] Single Product GET /products/{first_item['id']} verified.")

def test_catalog_fault_injection():
    print("\n--- 2. Testing Safe Fault Demonstration & Recovery ---")
    # Inject fault
    r = requests.post(f"{CATALOG_URL}/fault/inject?mode=500_error", timeout=3)
    assert r.status_code == 200
    print("  [PASS] Fault Injected: 500_error mode")

    # Verify health shows degraded
    r = requests.get(f"{CATALOG_URL}/health", timeout=3)
    assert r.json()["status"] == "degraded"
    print("  [PASS] Catalog Health correctly reports 'degraded'")

    # Restore fault
    r = requests.post(f"{CATALOG_URL}/fault/restore", timeout=3)
    assert r.status_code == 200
    
    r = requests.get(f"{CATALOG_URL}/health", timeout=3)
    assert r.json()["status"] == "ok"
    print("  [PASS] Fault Restored: Catalog Health returned to 'ok'")

def test_order_service():
    print("\n--- 3. Testing Order Service (Port 8002) ---")
    # Health
    r = requests.get(f"{ORDER_URL}/health", timeout=3)
    assert r.status_code == 200
    health = r.json()
    assert health["status"] == "ok"
    assert health["database"] == "connected"
    print(f"  [PASS] Order Health: {health['service']} (Catalog dependency: {health['catalog_dependency']['status']})")

    # Create order with trusted price calculation
    payload = {
        "customer_name": "Marcus Vance",
        "customer_email": "marcus.vance@example.com",
        "shipping_address": "1200 Market Street, San Francisco, CA 94102",
        "items": [
            {"product_id": 1, "quantity": 1},
            {"product_id": 2, "quantity": 2}
        ]
    }
    r = requests.post(f"{ORDER_URL}/orders", json=payload, timeout=5)
    assert r.status_code == 201, f"Create order failed: {r.text}"
    order = r.json()
    assert order["status"] == "PENDING"
    assert len(order["items"]) == 2
    assert order["total_amount"] > 0
    print(f"  [PASS] Order Created: {order['id']}, Status: {order['status']}, Calculated Total: ${order['total_amount']}")

    # Get order
    r = requests.get(f"{ORDER_URL}/orders/{order['id']}", timeout=3)
    assert r.status_code == 200
    assert r.json()["id"] == order["id"]
    print(f"  [PASS] Retrieved Order {order['id']}")
    return order

def test_payment_service(order):
    print("\n--- 4. Testing Payment Service (Port 8003) & Idempotency ---")
    # Health
    r = requests.get(f"{PAYMENT_URL}/health", timeout=3)
    assert r.status_code == 200
    health = r.json()
    assert health["status"] == "ok"
    print(f"  [PASS] Payment Health: {health['service']} (Order dependency: {health['order_dependency']['status']})")

    # Test Payment SUCCESS
    idemp_key = f"test_idemp_{uuid.uuid4().hex[:12]}"
    payment_payload = {
        "order_id": order["id"],
        "amount": order["total_amount"],
        "idempotency_key": idemp_key,
        "simulate_failure": False,
        "payment_method": "Mock Visa •••• 4242"
    }
    r = requests.post(f"{PAYMENT_URL}/payments", json=payment_payload, timeout=5)
    assert r.status_code == 201
    payment = r.json()
    assert payment["status"] == "SUCCESS"
    assert payment["is_idempotent_replay"] is False
    print(f"  [PASS] Payment Success: {payment['id']}, Order: {payment['order_id']}, Amount: ${payment['amount']}")

    # Verify Order Service was synchronized to CONFIRMED
    time.sleep(0.3)
    r = requests.get(f"{ORDER_URL}/orders/{order['id']}", timeout=3)
    updated_order = r.json()
    assert updated_order["status"] == "CONFIRMED", f"Expected CONFIRMED, got {updated_order['status']}"
    assert updated_order["payment_id"] == payment["id"]
    print(f"  [PASS] Order Service synchronized: Order {order['id']} status -> CONFIRMED")

    # Test IDEMPOTENCY REPLAY: submit the exact same idempotency_key
    print("\n--- 5. Testing Payment Idempotency Protection ---")
    r2 = requests.post(f"{PAYMENT_URL}/payments", json=payment_payload, timeout=5)
    assert r2.status_code == 201
    replayed = r2.json()
    assert replayed["id"] == payment["id"], "Idempotency failed: Returned different payment ID!"
    assert replayed["is_idempotent_replay"] is True
    assert r2.headers.get("X-Cache-Lookup") == "HIT"
    print(f"  [PASS] Idempotency Hit: Returned stored payment {replayed['id']} (is_idempotent_replay=True, X-Cache-Lookup=HIT)")

def test_payment_failure_simulation():
    print("\n--- 6. Testing Payment Failure State & Status Synchronization ---")
    # Create another order
    payload = {
        "customer_name": "Declined Tester",
        "customer_email": "decline@test.com",
        "shipping_address": "404 Error Way, Austin, TX",
        "items": [{"product_id": 3, "quantity": 1}]
    }
    r = requests.post(f"{ORDER_URL}/orders", json=payload, timeout=5)
    assert r.status_code == 201
    order = r.json()
    assert order["status"] == "PENDING"

    # Process with simulate_failure=True
    fail_idemp_key = f"fail_idemp_{uuid.uuid4().hex[:12]}"
    payment_payload = {
        "order_id": order["id"],
        "amount": order["total_amount"],
        "idempotency_key": fail_idemp_key,
        "simulate_failure": True,
        "payment_method": "Mock Visa •••• 0000"
    }
    r = requests.post(f"{PAYMENT_URL}/payments", json=payment_payload, timeout=5)
    assert r.status_code == 201
    payment = r.json()
    assert payment["status"] == "FAILED"
    assert payment["failure_reason"] is not None
    print(f"  [PASS] Payment Service simulated decline: {payment['id']}, Reason: {payment['failure_reason']}")

    # Verify Order transitioned to PAYMENT_FAILED
    time.sleep(0.3)
    r = requests.get(f"{ORDER_URL}/orders/{order['id']}", timeout=3)
    assert r.json()["status"] == "PAYMENT_FAILED"
    print(f"  [PASS] Order Service synchronized: Order {order['id']} status -> PAYMENT_FAILED")

if __name__ == "__main__":
    print("=" * 60)
    print("  SAGILITY DEMO — AUTOMATED END-TO-END TEST SUITE")
    print("=" * 60)
    test_catalog_service()
    test_catalog_fault_injection()
    order = test_order_service()
    test_payment_service(order)
    test_payment_failure_simulation()
    print("\n" + "=" * 60)
    print("  ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)
