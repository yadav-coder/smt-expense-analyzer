from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class LLMProvider(ABC):
    """
    Abstract interface for LLM Providers.
    Decouples the core AI orchestration from specific model vendors (OpenAI, Gemini, Claude, Local).
    """

    @abstractmethod
    def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> str:
        """
        Generates a natural language response given system instructions, user input, and retrieved context.
        """
        pass
