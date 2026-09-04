from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class FinancialContextProvider(ABC):
    """
    Abstract Base Class for financial context providers.
    Allows chatbot-backend to be completely decoupled from any specific database or application schema,
    enabling it to be reused in another project with a different data source.
    """

    @abstractmethod
    def get_financial_context(
        self,
        user_id: str,
        intent: str,
        entities: Optional[Dict[str, Any]] = None,
        extra_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Builds and returns a structured financial context dictionary for the authenticated user.
        """
        pass
