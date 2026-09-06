# Smart Expense Analyzer

Live project: https://smt-expense-analyzer-frontend.onrender.com

Smart Expense Analyzer is a full-stack expense tracking application with dashboard analytics, category management, budget tracking, predictions, and an AI assistant for asking questions about personal spending.

## Current Services

The project currently has three services:

1. `frontend`
   - React app.
   - Shows dashboard, expenses, charts, categories, budget, and AI assistant.
   - Deployed on Render as `smt-expense-analyzer-frontend`.

2. `backend`
   - Main Node.js/Express API.
   - Handles authentication, expenses, categories, prediction requests, and the active AI assistant endpoint.
   - Deployed on Render as `smt-expense-analyzer`.

3. `chatbot-backend`
   - Python/FastAPI chatbot service with NLP, RAG, ChromaDB, and OpenAI integration.
   - Deployed on Render as `smart-expense-chatbot`.
   - Currently optional and not used by the frontend AI page after the latest fix.

## What We Fixed

The deployed dashboard showed real transactions, but the AI assistant replied with `0 transactions`.

The issue was caused by the AI page using a separate chatbot backend while the dashboard used the main backend. If those services have different Render environment variables or database settings, they can read different data.

We changed the AI assistant flow to use the main backend so dashboard and AI answers come from the same MongoDB data.

Current AI flow:

```text
Frontend AI Assistant
-> backend /api/ai/chat
-> authenticated user's MongoDB expenses
-> backend/services/aiService.js
-> AI answer
```

This makes the AI assistant use the same transaction source as Dashboard, Expenses, and Charts.

## AI Assistant Behavior

The active AI assistant is handled in:

```text
backend/controllers/aiController.js
backend/services/aiService.js
frontend/src/pages/AIAssistant.jsx
frontend/src/services/api.js
```

The backend builds a financial context for the logged-in user:

- Total expenses.
- Current month expenses.
- Previous month comparison.
- Category spending.
- Highest spending category.
- Biggest transaction.
- Budget status.
- Prediction value.
- Recent expenses.

Then `aiService.js` works like this:

```text
If AI_API_KEY is configured:
  Try OpenAI with the user's real financial context.

If AI_API_KEY is missing or OpenAI fails:
  Use the local fallback response generator.
```

The fallback can answer common questions such as:

- `How much did I spend this month?`
- `What category we have used?`
- `How much did I spend on food?`
- `Where am I spending the most?`
- `Am I within my budget?`
- `Compare this month with last month.`
- `How can I reduce my expenses?`

## Render Environment Variables

Use MongoDB Atlas everywhere. The frontend does not connect to MongoDB directly, but both backend services must point to the same Atlas cluster and the same database name.

Recommended database:

```text
Atlas cluster: same cluster for all backend services
Database name: expenseDB
Expenses collection: expenses
Users collection: users
```

### Frontend

Service: `smt-expense-analyzer-frontend`

Required:

```env
REACT_APP_API_URL=https://smt-expense-analyzer.onrender.com/api
```

Not required for the current AI flow:

```env
REACT_APP_CHATBOT_API_URL
```

The frontend no longer needs `REACT_APP_CHATBOT_API_URL` unless we switch back to the Python chatbot service in the future.

### Main Backend

Service: `smt-expense-analyzer`

Required:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

Optional:

```env
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
```

Do not put real API keys in `.env.example` files. Use local `.env` files or Render environment variables.

### Chatbot Backend

Service: `smart-expense-chatbot`

Currently optional for the live AI page.

If used in the future, it should have:

```env
FRONTEND_URL=https://smt-expense-analyzer-frontend.onrender.com
MONGODB_URI=your_mongodb_atlas_base_uri
MONGODB_DB_NAME=expenseDB
JWT_SECRET=same_secret_as_main_backend
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

If the main backend uses:

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/expenseDB?retryWrites=true&w=majority
```

Then chatbot backend should use the same cluster with:

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=expenseDB
```

## Local Development

### Main Backend

```bash
cd backend
npm.cmd start
```

Default URL:

```text
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm.cmd start
```

Default URL:

```text
http://localhost:3000
```

### Chatbot Backend

Use the existing virtual environment:

```bash
cd chatbot-backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

Default URL:

```text
http://localhost:8000
```

## Verification Done

The latest source changes were checked with:

```bash
node --check backend/services/aiService.js
cd frontend
npm.cmd run build
```

The chatbot backend tests were also previously verified using its virtual environment:

```bash
cd chatbot-backend
.\venv\Scripts\python.exe -m pytest tests -q
```

Result:

```text
18 passed
```

## Future Improvements

Possible future work:

1. Reconnect the Python chatbot backend.
   - Use it for advanced NLP intent classification.
   - Use ChromaDB/RAG for financial knowledge answers.
   - Ensure it uses the exact same MongoDB URI, database name, and JWT secret as the main backend.

2. Add a backend debug endpoint for authenticated AI context.
   - Useful for checking what data the AI sees before it generates a response.

3. Improve AI intent handling in the Node backend.
   - Add more exact handlers for questions about dates, categories, items, and comparisons.

4. Store budget per user in MongoDB.
   - Currently the budget value is mostly frontend state.
   - Saving it in the database would make budget answers more reliable after refresh/login.

5. Add tests for the Node AI assistant.
   - Test category questions.
   - Test monthly totals.
   - Test no-OpenAI fallback.
   - Test authenticated user isolation.

6. Improve deployment safety.
   - Add `.env.example` files with placeholder values only.
   - Ensure real keys are never committed.
   - Add Render deployment notes for each service.

## Current Recommended Production Path

For now, use this production flow:

```text
frontend -> main backend -> MongoDB -> AI answer
```

Keep `chatbot-backend` deployed if desired, but treat it as optional until it is reconnected carefully with matching production environment variables.
