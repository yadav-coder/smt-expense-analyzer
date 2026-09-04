import logging
from typing import Dict, Any, List
import spacy

from app.nlp.intent_classifier import IntentClassifier
from app.nlp.entity_extractor import EntityExtractor

logger = logging.getLogger(__name__)

class NLPPipeline:
    """
    Explicit NLP Processing Stage for the Financial Chatbot.
    Stages:
    User Question -> spaCy Tokenization -> Intent Detection -> Entity Extraction -> Query Router
    """

    PATH_A_INTENTS = {
        "EXPENSE_TOTAL",
        "CATEGORY_EXPENSE",
        "DATE_EXPENSE",
        "HIGHEST_EXPENSE",
        "BUDGET_STATUS",
        "SPENDING_COMPARISON",
        "EXPENSE_FORECAST",
        "RECENT_EXPENSES",
    }

    PATH_B_INTENTS = {
        "FINANCIAL_KNOWLEDGE",
    }

    PATH_C_INTENTS = {
        "SPENDING_ANALYSIS",
    }

    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.entity_extractor = EntityExtractor()
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            # Fallback to a blank English model if language pack isn't downloaded yet
            self.nlp = spacy.blank("en")

    def process(self, text: str) -> Dict[str, Any]:
        """
        Processes a raw user question and produces structured JSON containing:
        intent, confidence, entities, tokens, lemmas, and designated query route.
        """
        cleaned_text = str(text or "").strip()
        doc = self.nlp(cleaned_text)

        tokens = [token.text for token in doc if not token.is_space]
        lemmas = [token.lemma_.lower() for token in doc if not token.is_punct and not token.is_space]

        # 1. Intent Detection
        intent, confidence = self.intent_classifier.classify(cleaned_text)

        # 2. Entity Extraction
        entities = self.entity_extractor.extract(cleaned_text)

        # 3. Query Router determination
        # Hybrid trigger: If intent is CATEGORY_EXPENSE or EXPENSE_TOTAL but user asks evaluative question ("too much", "reasonable", "good", "bad", "cut")
        evaluative_terms = {"too much", "reasonable", "excessive", "okay", "high", "low", "reduce", "cut", "advice"}
        is_evaluative = any(term in cleaned_text.lower() for term in evaluative_terms)

        if intent in self.PATH_B_INTENTS:
            route = "PATH_B"  # Financial Knowledge -> RAG
        elif intent in self.PATH_C_INTENTS or (intent in self.PATH_A_INTENTS and is_evaluative):
            route = "PATH_C"  # Combined Personal Data + RAG Knowledge + LLM
        else:
            route = "PATH_A"  # Personal Financial Data -> MongoDB + LLM

        result = {
            "raw_query": cleaned_text,
            "intent": intent,
            "confidence": round(confidence, 3),
            "entities": entities,
            "route": route,
            "tokens": tokens[:20],
        }

        logger.info(f"NLP Processed: query='{cleaned_text}' -> intent='{intent}' route='{route}' entities={entities}")
        return result
