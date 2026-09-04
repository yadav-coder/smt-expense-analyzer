import logging
from typing import Dict, Any, Optional

from app.nlp.nlp_pipeline import NLPPipeline
from app.financial.financial_context import financial_context_provider
from app.rag.retriever import RAGRetriever
from app.llm.llm_service import llm_service

logger = logging.getLogger(__name__)

class ChatController:
    """
    Coordinates NLP processing, Query Routing (Path A / Path B / Path C),
    Data Retrieval (MongoDB / ChromaDB RAG), and LLM response generation.
    """

    def __init__(self):
        self.nlp_pipeline = NLPPipeline()
        self.rag_retriever = RAGRetriever()

    def process_chat_message(
        self,
        user_id: str,
        message: str,
        extra_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        logger.info("Chat request received.")

        # 1. NLP Processing Stage
        nlp_result = self.nlp_pipeline.process(message)
        intent = nlp_result["intent"]
        entities = nlp_result["entities"]
        route = nlp_result["route"]

        logger.info(f"Intent detected: {intent} (route: {route})")

        financial_context = None
        rag_context = None

        # 2. Query Routing Execution
        # PATH A: Personal Financial Data Only
        if route == "PATH_A":
            try:
                financial_context = financial_context_provider.get_financial_context(
                    user_id=user_id,
                    intent=intent,
                    entities=entities,
                    extra_params=extra_params
                )
            except Exception as e:
                logger.error(f"MongoDB financial retrieval failed: {e}")
                return {
                    "success": False,
                    "response": "Unable to access your financial data right now.",
                    "intent": intent
                }

        # PATH B: Financial Knowledge Only (RAG)
        elif route == "PATH_B":
            try:
                logger.info("RAG retrieval performed.")
                rag_context = self.rag_retriever.retrieve(message, top_k=3)
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")
                # Non-fatal: LLM service can still formulate general educational guidance

        # PATH C: Combined Personal Data + Financial Knowledge
        elif route == "PATH_C":
            # Attempt MongoDB retrieval
            try:
                financial_context = financial_context_provider.get_financial_context(
                    user_id=user_id,
                    intent=intent,
                    entities=entities,
                    extra_params=extra_params
                )
            except Exception as e:
                logger.error(f"MongoDB retrieval failed during hybrid route: {e}")

            # Attempt RAG retrieval
            try:
                logger.info("RAG retrieval performed.")
                rag_context = self.rag_retriever.retrieve(message, top_k=2)
            except Exception as e:
                logger.error(f"RAG retrieval error during hybrid route: {e}")

        # 3. LLM Response Generation
        try:
            ai_response = llm_service.generate_response(
                user_message=message,
                financial_context=financial_context,
                rag_context=rag_context
            )
            logger.info("LLM request completed successfully.")
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return {
                "success": False,
                "response": "I'm unable to generate an AI response right now.",
                "intent": intent
            }

        return {
            "success": True,
            "response": ai_response,
            "intent": intent,
            "route": route
        }

chat_controller = ChatController()
