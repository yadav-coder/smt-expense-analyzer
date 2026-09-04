# Smart Finance AI - Chatbot Backend Service

An independent, modular, and reusable AI-powered financial assistant service built with **FastAPI**, **spaCy NLP**, **LangChain + ChromaDB RAG**, and **OpenAI**.

This service connects securely to your existing financial database (MongoDB) using authenticated JWT credentials and answers questions about user expenses, categories, budget limits, spending comparisons, and general financial literacy without hallucinating data.

---

## Architecture Diagram

```
                         USER / BROWSER
                               │
                               ▼
                        React Chat UI
                 (/ai-assistant & Chatbot Components)
                               │
                               ▼ [POST /api/chat + Bearer JWT]
                     chatbot-backend (FastAPI)
                               │
                               ▼
                      NLP PIPELINE (spaCy)
                     ┌─────────┴─────────┐
                     │                   │
                  Intent              Entities
             Classification          Extraction
             (10 Categories)   (Category, Date, Amount)
                     │                   │
                     └─────────┬─────────┘
                               ▼
                         QUERY ROUTER
                   /           |           \
                  /            |            \
                 ▼             ▼             ▼
              PATH A        PATH B        PATH C
          (Personal Data) (Knowledge)    (Hybrid)
                 │             │             │
                 ▼             ▼             ▼
              MongoDB       ChromaDB     MongoDB +
           (User Scoped)    (Vector)     ChromaDB
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                     Structured Context
                               │
                               ▼
                       LLM PROVIDER
                    (OpenAI / Fallback)
                               │
                               ▼
                     Smart Finance AI
                     Natural Response
```

---

## Key Features

### 1. Explicit NLP Pipeline
Every user query passes through an NLP processing pipeline:
- **Tokenization & Linguistic Processing**: `spaCy` (`en_core_web_sm`) tokenization and lemmatization.
- **Intent Detection**: Trained on real financial query datasets using scikit-learn TF-IDF + Logistic Regression with rule-based boost overrides.
  - `EXPENSE_TOTAL`: Overall or period-based expenditure.
  - `CATEGORY_EXPENSE`: Spending in a specific category (Food, Transport, Bills, etc.).
  - `DATE_EXPENSE`: Spending filtered by date, month, or amount threshold (e.g. above Rs. 1000).
  - `HIGHEST_EXPENSE`: Highest spending category or largest single purchase.
  - `BUDGET_STATUS`: Budget limit consumption and remaining balance.
  - `SPENDING_COMPARISON`: Month-over-month trend analysis.
  - `EXPENSE_FORECAST`: Linear regression prediction for next month's spending.
  - `RECENT_EXPENSES`: Most recent user transactions.
  - `SPENDING_ANALYSIS`: Targeted optimization advice based on actual user data.
  - `FINANCIAL_KNOWLEDGE`: Explaining financial concepts (50/30/20 rule, emergency funds, cash flow).
- **Entity Extraction**: Automatically extracts Category, Time Period, Month, Year, and Amount thresholds.

### 2. Retrieval-Augmented Generation (RAG)
- **Knowledge Documents**: Educational articles stored in `knowledge_base/` covering budgeting, saving, 50/30/20 rule, emergency funds, expense management, and financial terms.
- **Vector Database**: Persistent **ChromaDB** vector store saved locally in `./chroma_db`.
- **Text Chunking**: LangChain `RecursiveCharacterTextSplitter`.
- **Clean Metadata**: Sources and topics returned to callers without exposing internal vector IDs.

### 3. LLM Provider Abstraction
- Dedicated `LLMProvider` abstract base class.
- Official `OpenAIProvider` calling `gpt-4o-mini` / `gpt-3.5-turbo`.
- Includes an intelligent local financial reasoning engine for offline development or when the OpenAI API key is not yet configured.

### 4. Controlled MongoDB Financial Queries
- Queries are strictly isolated by verified JWT `user_id`.
- The LLM never runs raw database queries; instead, controlled Python methods aggregate real numbers and format structured summaries.

### 5. Authentication & Security
- Compatible with the existing Express backend's JWT signing (`JWT_SECRET`).
- Rejects unauthenticated requests with HTTP 401.
- Message length limited to 600 characters to prevent prompt injection and denial of service.

---

## Environment Variables

Configure in `chatbot-backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port for the FastAPI server |
| `ENVIRONMENT` | `development` | Runtime environment |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `expenseDB` | MongoDB database name |
| `JWT_SECRET` | *(from backend/.env)* | Shared JWT secret for auth verification |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `OPENAI_API_KEY` | *(optional / blank)* | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model identifier |
| `CHROMA_DB_PATH` | `./chroma_db` | Path to persistent ChromaDB storage |

---

## Running Locally

### 1. Set Up Virtual Environment & Dependencies
```bash
cd chatbot-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Index the Knowledge Base into ChromaDB
```bash
python ingest.py
```

### 3. Start the FastAPI Service
```bash
uvicorn app.main:app --port 8000 --reload
```

---

## API Endpoints

### Health Check
- **GET** `/health`
- **Response**: `{"status": "ok", "service": "Smart Finance AI Chatbot"}`

### Chat Endpoint
- **POST** `/api/chat`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "message": "How much did I spend on food this month?",
    "monthly_budget": 20000,
    "predicted_next_month_expense": 8500
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "You spent Rs. 3,000.00 on Food in this month. This represents 35.5% of your total spending for this period.",
    "intent": "CATEGORY_EXPENSE",
    "route": "PATH_A"
  }
  ```

---

## Running Automated Tests
```bash
python -m pytest tests -v
```
All 18 unit and integration tests verify:
1. Health check & 401 unauthorized handling.
2. 10 financial intent classifications and entity extractions.
3. ChromaDB RAG similarity search and metadata extraction.
4. MongoDB user-scoped context building.

---

## Reusability & Decoupling

`chatbot-backend` is designed to be fully portable. To use it with another application or database:
1. Implement the `FinancialContextProvider` interface in `app/financial/context_provider.py`.
2. Connect your custom database queries.
3. The core AI engine (NLP pipeline, RAG retriever, LLM orchestration, prompts) operates completely unchanged!
