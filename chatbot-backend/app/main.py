import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.api.chat_routes import router as chat_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chatbot-service")

app = FastAPI(
    title="Smart Finance AI Chatbot Service",
    description="NLP + RAG + LLM Financial Assistant Service for Smart Expense Analyzer",
    version="1.0.0"
)

# CORS configuration restricted strictly to configured frontend origin
allowed_origins = [settings.FRONTEND_URL.rstrip("/")]
if "localhost" in settings.FRONTEND_URL:
    # Also allow 127.0.0.1 for local dev convenience if frontend is on localhost
    allowed_origins.append(settings.FRONTEND_URL.replace("localhost", "127.0.0.1").rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Completed {request.method} {request.url.path} with status {response.status_code}")
    return response

# Global sanitized exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.url.path}: {exc}", exc_info=False)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "An internal server error occurred. Please try again."}
    )

# Register routes
app.include_router(chat_router, prefix="/api")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment.
    """
    return {"status": "ok", "service": "Smart Finance AI Chatbot"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(settings.PORT), reload=True)
