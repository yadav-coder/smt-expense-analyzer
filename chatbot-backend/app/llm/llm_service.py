import logging
from typing import Dict, Any, Optional

from app.llm.providers.base import LLMProvider
from app.llm.providers.openai_provider import OpenAIProvider
from app.llm.prompts import SYSTEM_PROMPT, format_context_prompt

logger = logging.getLogger(__name__)

class LLMService:
    """
    Core LLM Orchestration Service.
    Coordinates prompt construction, context formatting, and vendor execution.
    """

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or OpenAIProvider()

    def generate_response(
        self,
        user_message: str,
        financial_context: Optional[Dict[str, Any]] = None,
        rag_context: Optional[Dict[str, Any]] = None
    ) -> str:
        formatted_context_str = format_context_prompt(financial_context, rag_context)

        combined_context = {
            "financial_context": financial_context,
            "rag_context": rag_context,
            "formatted_context": formatted_context_str
        }

        logger.info(f"Generating response for message: '{user_message}'")

        response = self.provider.generate_response(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            context=combined_context
        )

        return response

llm_service = LLMService()
