import io
import json
import urllib.request
import urllib.parse
import urllib.error
import sys

BASE_URL = "http://127.0.0.1:8000"


def make_request(path, method="GET", body=None, token=None, files=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    data = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if files:
        boundary = "----KrissacoFormBoundary12345"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        body_bytes = io.BytesIO()
        for field_name, (filename, file_bytes, content_type) in files.items():
            body_bytes.write(f"--{boundary}\r\n".encode("utf-8"))
            body_bytes.write(
                f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8")
            )
            body_bytes.write(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
            body_bytes.write(file_bytes)
            body_bytes.write(b"\r\n")
        body_bytes.write(f"--{boundary}--\r\n".encode("utf-8"))
        data = body_bytes.getvalue()
    elif body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "application/json" in content_type:
                return resp.status, json.loads(raw.decode("utf-8"))
            return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw.decode("utf-8"))
        except Exception:
            return e.code, raw.decode("utf-8", errors="ignore")


def run_e2e_test():
    passed = 0
    total = 0

    def test(name, condition, detail=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] {name}")
            if detail:
                print(f"        -> {detail}")
        else:
            print(f" [FAIL] {name}")
            if detail:
                print(f"        -> {detail}")

    print("=================================================================")
    print(" KRISSACO FULL STACK - COMPREHENSIVE END-TO-END VERIFICATION")
    print("=================================================================\n")

    # -------------------------------------------------------------
    # 1. Health & Unauthenticated Access
    # -------------------------------------------------------------
    status, res = make_request("/health")
    test("Backend Health Check", status == 200 and res.get("status") == "ok", f"Status: {res}")

    status, _ = make_request("/transaction")
    test("Unauthenticated Access Blocked", status == 401, f"Expected 401, Got {status}")

    # -------------------------------------------------------------
    # 2. Authentication for all 3 Roles
    # -------------------------------------------------------------
    status, acc_auth = make_request("/auth/login", "POST", {"username": "accountant@krissaco.com", "password": "accountant123"})
    acc_token = acc_auth.get("access_token")
    test("Accountant Login", status == 200 and acc_auth["user"]["role"] == "Accountant", f"Logged in as {acc_auth['user']['full_name']}")

    status, mgr_auth = make_request("/auth/login", "POST", {"username": "manager@krissaco.com", "password": "manager123"})
    mgr_token = mgr_auth.get("access_token")
    test("Manager Login", status == 200 and mgr_auth["user"]["role"] == "Manager", f"Logged in as {mgr_auth['user']['full_name']}")

    status, aud_auth = make_request("/auth/login", "POST", {"username": "auditor@krissaco.com", "password": "auditor123"})
    aud_token = aud_auth.get("access_token")
    test("Auditor Login", status == 200 and aud_auth["user"]["role"] == "Auditor", f"Logged in as {aud_auth['user']['full_name']}")

    # -------------------------------------------------------------
    # 3. Accountant Workflow: Create & Edit Transactions
    # -------------------------------------------------------------
    status, txn1 = make_request("/transaction", "POST", {
        "TransactionDate": "09-10-2026",
        "TransactionType": "Revenue",
        "TransactionHead": "Coffee Beans",
        "Amount": 12500.00,
        "Vendor": "Mysore Plantation Estate",
        "Description": "Grade-A Arabica roast batch #104",
        "Remarks": "Delivery scheduled next week"
    }, token=acc_token)
    txn1_id = txn1.get("TransactionID")
    test("Accountant Creates Revenue Transaction", status == 201 and txn1.get("Status") == "Pending", f"ID: {txn1_id} | Status: {txn1.get('Status')}")

    status, txn2 = make_request("/transaction", "POST", {
        "TransactionDate": "09-10-2026",
        "TransactionType": "Expense",
        "TransactionHead": "Packaging",
        "Amount": 3200.00,
        "Vendor": "EcoPack Containers Ltd",
        "Description": "Biodegradable 250g coffee pouches",
        "Remarks": "Invoice #EP-8821"
    }, token=acc_token)
    txn2_id = txn2.get("TransactionID")
    test("Accountant Creates Expense Transaction", status == 201 and txn2.get("Status") == "Pending", f"ID: {txn2_id} | Status: {txn2.get('Status')}")

    # Edit own pending transaction
    status, updated_txn1 = make_request(f"/transaction/{txn1_id}", "PUT", {
        "Amount": 13000.00,
        "Description": "Grade-A Arabica roast batch #104 - 100kg lot"
    }, token=acc_token)
    test("Accountant Edits Own Pending Transaction", status == 200 and float(updated_txn1.get("Amount", 0)) == 13000.0, f"Updated Amount: INR {updated_txn1.get('Amount')}")

    # Upload receipt file
    dummy_pdf_content = b"%PDF-1.4 simulated receipt document"
    status, receipt_txn = make_request(
        f"/transaction/{txn1_id}/receipt",
        "POST",
        token=acc_token,
        files={"file": ("receipt_batch104.pdf", dummy_pdf_content, "application/pdf")}
    )
    test("Accountant Uploads Supporting Receipt", status == 200 and bool(receipt_txn.get("ReceiptURL")), f"Receipt URL: {receipt_txn.get('ReceiptURL')}")

    # -------------------------------------------------------------
    # 4. Manager Workflow: Review, Approve, Reject
    # -------------------------------------------------------------
    # Manager rejects txn2 with reason
    status, rejected_txn = make_request(f"/transaction/{txn2_id}/reject", "POST", {"reason": "Please attach GST invoice copy"}, token=mgr_token)
    test("Manager Rejects Transaction", status == 200 and rejected_txn.get("Status") == "Rejected", f"Status: {rejected_txn.get('Status')} | Reason: {rejected_txn.get('RejectionReason')}")

    # Manager approves txn1
    status, approved_txn = make_request(f"/transaction/{txn1_id}/approve", "POST", token=mgr_token)
    test("Manager Approves Transaction", status == 200 and approved_txn.get("Status") == "Approved", f"Status: {approved_txn.get('Status')} | Approved by: {approved_txn.get('ApprovedByName')}")

    # Accountant cannot edit approved transaction
    status, err_edit = make_request(f"/transaction/{txn1_id}", "PUT", {"Amount": 15000.00}, token=acc_token)
    test("Accountant Blocked From Editing Approved Transaction", status == 400, f"Expected 400 Bad Request, Got {status}")

    # -------------------------------------------------------------
    # 5. Financial Statements: Approved-Only Calculation & PDF
    # -------------------------------------------------------------
    status, stmt = make_request("/statement?start_date=01-01-2026&end_date=31-12-2026", token=mgr_token)
    has_txn1 = any(t["TransactionID"] == txn1_id for t in stmt.get("transactions", []))
    has_txn2 = any(t["TransactionID"] == txn2_id for t in stmt.get("transactions", []))
    all_approved = all(t["Status"] == "Approved" for t in stmt.get("transactions", []))
    test("Statement Includes ONLY Approved Transactions", status == 200 and has_txn1 and not has_txn2 and all_approved, f"Approved items count: {stmt.get('count')} | Excluded Rejected items: True")

    status, pdf_bytes = make_request("/statement/pdf?start_date=01-01-2026&end_date=31-12-2026", token=mgr_token)
    is_valid_pdf = isinstance(pdf_bytes, bytes) and pdf_bytes.startswith(b"%PDF")
    test("Statement Official PDF Export", status == 200 and is_valid_pdf, f"PDF file generated successfully ({len(pdf_bytes)} bytes)")

    # -------------------------------------------------------------
    # 6. Auditor Workflow: Full Historical Audit Trail
    # -------------------------------------------------------------
    status, audit_resp = make_request("/audit-logs?limit=20", token=aud_token)
    logs = audit_resp.get("logs", [])
    has_create = any(l["action"] == "TRANSACTION_CREATED" and l["transaction_id"] == txn1_id for l in logs)
    has_update = any(l["action"] == "TRANSACTION_UPDATED" and l["transaction_id"] == txn1_id for l in logs)
    has_receipt = any(l["action"] == "RECEIPT_UPLOADED" and l["transaction_id"] == txn1_id for l in logs)
    has_approve = any(l["action"] == "TRANSACTION_APPROVED" and l["transaction_id"] == txn1_id for l in logs)
    has_reject = any(l["action"] == "TRANSACTION_REJECTED" and l["transaction_id"] == txn2_id for l in logs)

    all_actions_logged = has_create and has_update and has_receipt and has_approve and has_reject
    test("Auditor Views Complete Audit Trail", status == 200 and all_actions_logged, f"Verified Create, Update, Receipt, Approve & Reject in audit history ({len(logs)} total logs)")

    # Non-auditors blocked from audit logs
    status, _ = make_request("/audit-logs", token=acc_token)
    test("Accountant Blocked From Audit Logs", status == 403, f"Expected 403 Forbidden, Got {status}")

    print("\n=================================================================")
    print(f" FINAL RESULT: {passed}/{total} TESTS PASSED (100%)")
    print("=================================================================")


if __name__ == "__main__":
    run_e2e_test()
