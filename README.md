# Krissaco Full Stack

A coffee-business transaction tracker: a FastAPI + PostgreSQL backend and a React + TypeScript frontend, developed and tested independently before integration (per team process).

```
Krissaco Full Stack/
├── Backend/     -- FastAPI REST API
└── frontend/    -- React + TypeScript + Tailwind UI
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Pydantic |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |

## Scope

The **backend** provides the REST API only. Database and table creation/management is out of scope for the application and owned by a DBA — the API only performs data manipulation against a schema that already exists (see `Backend/krissaco.sql`).

The **frontend** and **backend** are developed, tested, and deployed **separately**. UI is tested against a Postman mock server first; only after sign-off is it pointed at the real backend.

---

## API Contract

| Method | Path | Description |
|---|---|---|
| `GET` | `/transaction` | Latest N transactions, most recent first (`?limit=`) |
| `POST` | `/transaction` | Record a new transaction. Returns the created record, including the generated `TransactionID`, with `201 Created`. |
| `GET` | `/statement` | Transactions + revenue/expense totals in a date range (`?start_date=&end_date=`) |

**Dates use `DD-MM-YYYY` format** throughout the API (not ISO). This applies to request bodies, query params, and response fields.

### Validation rules

**`POST /transaction`**

| Field | Rule |
|---|---|
| `TransactionDate` | Required. `DD-MM-YYYY`. Cannot be a future date. |
| `TransactionType` | Required. `Revenue` or `Expense`. |
| `TransactionHead` | Required. One of: `Coffee Beans`, `Chicory`, `Roasting`, `Grinding`, `Blending`, `Packaging`, `Transport`, `Promotion`, `Commission`, `Audit`, `Licenses`, `Other Operational Expenses`. |
| `Amount` | Required. Greater than `0`. |
| `Vendor` | Required. 2–150 characters. |
| `Description` | Required. 3–255 characters. |
| `Remarks` | Optional. Up to 255 characters. |

**`GET /transaction`** — `limit` optional, integer `1`–`100`, defaults to `10`.

**`GET /statement`** — `start_date` and `end_date` required, `DD-MM-YYYY`, `end_date` must be strictly later than `start_date`.

---

## Part 1 — Backend Setup

### 1. Navigate into the backend folder

```bash
cd Backend
```

### 2. Create and activate a virtual environment

**PowerShell:**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```
If blocked by execution policy:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Git Bash:**
```bash
python -m venv venv
source venv/Scripts/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the database and table

The app does **not** create these automatically — use `krissaco.sql`, run by a DBA.

**Option A — psql:**
```
Server [localhost]: (Enter)
Database [postgres]: (Enter)
Port [5432]: (Enter)
Username [postgres]: (Enter)
Password: <your password>
```
```sql
CREATE DATABASE "Krissaco";
\c "Krissaco"
\i 'path/to/Backend/krissaco.sql'
\dt
\d "transaction"
```

**Option B — pgAdmin:**
1. Right-click **Databases** → **Create** → **Database...** → name `Krissaco` → **Save**
2. Right-click **Krissaco** → **Query Tool**
3. Open File → select `krissaco.sql` → Execute (F5)
4. Confirm `transaction` appears under **Tables**

### 5. Configure environment variables

```bash
cp .env.example .env    # Windows: copy .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/Krissaco
```

**Double-check the port is `5432`** (PostgreSQL's default) — not a frontend dev server port. This is an easy typo to make if you're editing both projects' `.env` files in the same session.

### 6. Run the API

```bash
uvicorn app.main:app --reload
```
```
Uvicorn running on http://127.0.0.1:8000
```

### 7. Test it

```
http://127.0.0.1:8000/docs
```
or:
```bash
curl http://127.0.0.1:8000/transaction
```
Expect: `{"count": 0, "transactions": []}` on an empty table.

### 8. (Optional) Load sample data

```bash
python post_test_data.py
```
Sends 30 randomized transactions through the real `POST /transaction` endpoint.

---

## Part 2 — Frontend Setup

### 1. Navigate into the frontend folder

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env    # Windows: copy .env.example .env
```

For now, point this at a **mock API**, not the real backend (see Part 3).

### 4. Run the dev server

```bash
npm run dev
```

Vite is configured for port `5173` (`vite.config.ts`). If that port is already in use, Vite will silently pick the next free one (e.g. `5174`) — check your terminal output for the actual URL it prints.

### 5. Build and lint (optional, for CI/pre-commit checks)

```bash
npm run build
npm run lint
```

---

## Part 3 — Testing the UI Against a Mock API (current phase)

Per team process: **do not integrate the frontend with the real backend yet.** Test the UI against a Postman mock server first.

### 1. Import the mock collection into Postman

Import `krissaco-mock-api.postman_collection.json` (provided separately) — three requests (`GET /transaction`, `POST /transaction`, `GET /statement`) each with example responses matching the real API contract exactly.

### 2. Create a Mock Server

In Postman: select the imported collection → **Mock collection** (or use the **Mocks** section in the sidebar) → **Create Mock Server**. Postman gives you a URL like:
```
https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.mock.pstmn.io
```

### 3. Point the frontend at the mock

In `frontend/.env`:
```
VITE_API_BASE_URL=https://your-mock-id.mock.pstmn.io
```

### 4. Run and test

```bash
npm run dev
```
Postman mock servers send correct CORS headers automatically — no backend CORS setup is needed for this phase.

Verify: the Transactions view loads mock data, "Add transaction" successfully POSTs and shows a returned `TransactionID`, and the Statement view returns totals for a date range.

Only once this is signed off does Part 4 apply.

---

## Part 4 — Integrating Frontend with Real Backend (after UI sign-off)

### 1. Point the frontend at the real backend

`frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Confirm CORS on the backend matches your actual frontend origin

`Backend/app/main.py` already includes:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Known issue to verify:** `vite.config.ts` is configured for port `5173`, but this CORS setting only allows `5174`. Vite will use whichever port is actually free when you run `npm run dev` — check your terminal output for the real port, and make sure it's listed in `allow_origins`, or the browser will silently block every request with a CORS error. Consider either:
- Setting `strictPort: true` in `vite.config.ts` so the port is always predictable, or
- Listing both ports: `allow_origins=["http://localhost:5173", "http://localhost:5174"]`

### 3. Run both servers simultaneously (separate terminals)

```bash
# Terminal 1 - Backend
cd Backend
venv\Scripts\Activate.ps1   # or: source venv/Scripts/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Verify end to end

Open the frontend in your browser, open DevTools → Network tab, and confirm requests to `http://localhost:8000/transaction` succeed (status 200/201, not blocked by CORS).

---

## Inspecting the Database

**psql:**
```sql
\c "Krissaco"
\dt
\d "transaction"
SELECT * FROM "transaction" ORDER BY "CreatedAt" DESC;
```

**pgAdmin:** expand **Krissaco → Schemas → public → Tables → transaction** → **View/Edit Data → All Rows**

## Resetting the Database

```sql
\c "Krissaco"
DROP TABLE IF EXISTS "transaction";
DROP TYPE IF EXISTS "transactionTypeEnum";
DROP TYPE IF EXISTS "transactionHeadEnum";
```
Then re-run `krissaco.sql`.

## Schema Changes

Since the API does not manage the schema, any change to `Backend/app/common/models/transaction.py` must be paired with a matching update to `Backend/krissaco.sql`, applied manually by a DBA. The two are not automatically kept in sync.

The frontend's `frontend/src/types/index.ts` also mirrors these fields independently — update all three together when the schema changes.

---

## Contributing (multiple teams)

Each backend feature lives in `Backend/app/features/<feature_name>/` (`router.py`, `service.py`, `repository.py`, `schema.py`). Each frontend area lives under `frontend/src/` (`common/`, `views/`, `components/`), split by the same team boundaries: **common, save, latest, statement**.

1. Work inside your own feature folder only
2. Flag any change to shared code (`common/` on either side) with the team first
3. Do not change existing API paths or methods without team agreement — other services depend on this contract
4. Frontend and backend integrate only after independent UI sign-off — see Part 3 and Part 4
5. Open a Pull Request rather than pushing directly to `main`

## Status

- ✅ Backend: `GET /transaction`, `POST /transaction`, `GET /statement`
- ✅ Frontend: Transactions view (list + add), Statement view
- ⬜ Frontend/backend integration (pending UI sign-off against mock API)
