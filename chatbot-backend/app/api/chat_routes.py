from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.security.auth import get_current_user
from app.controllers.chat_controller import chat_controller

router = APIRouter()

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600, description="The user question or inquiry.")
    monthly_budget: Optional[float] = Field(None, description="Optional current monthly budget value.")
    predicted_next_month_expense: Optional[float] = Field(None, description="Optional predicted expense value.")

class ChatResponse(BaseModel):
    success: bool
    response: str
    intent: Optional[str] = None
    route: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Primary financial assistant chat endpoint.
    Accepts user question, processes via NLP -> Router -> MongoDB/RAG -> LLM.
    Strictly verifies JWT and isolates user financial data.
    """
    user_id = current_user["id"]

    extra_params = {}
    if payload.monthly_budget is not None:
        extra_params["monthly_budget"] = payload.monthly_budget
    if payload.predicted_next_month_expense is not None:
        extra_params["predicted_next_month_expense"] = payload.predicted_next_month_expense

    result = chat_controller.process_chat_message(
        user_id=user_id,
        message=payload.message,
        extra_params=extra_params
    )

    return ChatResponse(
        success=result.get("success", False),
        response=result.get("response", "No response generated."),
        intent=result.get("intent"),
        route=result.get("route")
    )
