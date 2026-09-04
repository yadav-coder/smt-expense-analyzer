import re
from typing import Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

class IntentClassifier:
    """
    Lightweight, modular intent classifier for financial queries.
    Trained on financial queries with fallback to high-precision rules.
    Easily swappable with a transformer or LLM classifier.
    """

    INTENTS = [
        "EXPENSE_TOTAL",
        "CATEGORY_EXPENSE",
        "DATE_EXPENSE",
        "HIGHEST_EXPENSE",
        "BUDGET_STATUS",
        "SPENDING_COMPARISON",
        "EXPENSE_FORECAST",
        "RECENT_EXPENSES",
        "SPENDING_ANALYSIS",
        "FINANCIAL_KNOWLEDGE",
    ]

    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True, stop_words="english")
        self.classifier = LogisticRegression(C=1.0, max_iter=200, random_state=42)
        self._train_initial_model()

    def _train_initial_model(self):
        training_data = [
            # EXPENSE_TOTAL
            ("how much did i spend this month", "EXPENSE_TOTAL"),
            ("what is my total expense", "EXPENSE_TOTAL"),
            ("how much have i spent so far", "EXPENSE_TOTAL"),
            ("total spending this month", "EXPENSE_TOTAL"),
            ("how much money did i spend", "EXPENSE_TOTAL"),
            ("what are my total expenses", "EXPENSE_TOTAL"),
            ("show total expenditure", "EXPENSE_TOTAL"),
            ("my overall spending", "EXPENSE_TOTAL"),

            # CATEGORY_EXPENSE
            ("how much did i spend on food", "CATEGORY_EXPENSE"),
            ("how much was spent on groceries", "CATEGORY_EXPENSE"),
            ("what did i spend on transport", "CATEGORY_EXPENSE"),
            ("show my entertainment expenses", "CATEGORY_EXPENSE"),
            ("spending on utilities and bills", "CATEGORY_EXPENSE"),
            ("how much on dining out and restaurants", "CATEGORY_EXPENSE"),
            ("expenses for travel and fuel", "CATEGORY_EXPENSE"),
            ("how much on clothes shopping", "CATEGORY_EXPENSE"),
            ("rent expense this month", "CATEGORY_EXPENSE"),
            ("how much did i spend on healthcare", "CATEGORY_EXPENSE"),

            # DATE_EXPENSE
            ("show expenses above 1000 in august", "DATE_EXPENSE"),
            ("what did i spend in august", "DATE_EXPENSE"),
            ("expenses in september 2026", "DATE_EXPENSE"),
            ("show expenses greater than 500", "DATE_EXPENSE"),
            ("what did i spend yesterday", "DATE_EXPENSE"),
            ("expenses on 15th august", "DATE_EXPENSE"),
            ("transactions from last week", "DATE_EXPENSE"),
            ("expenses over 2000 in july", "DATE_EXPENSE"),

            # HIGHEST_EXPENSE
            ("which category costs me the most", "HIGHEST_EXPENSE"),
            ("what is my highest spending category", "HIGHEST_EXPENSE"),
            ("where am i spending the most money", "HIGHEST_EXPENSE"),
            ("what was my biggest expense", "HIGHEST_EXPENSE"),
            ("what was my largest purchase", "HIGHEST_EXPENSE"),
            ("top spending area", "HIGHEST_EXPENSE"),
            ("highest expense this month", "HIGHEST_EXPENSE"),

            # BUDGET_STATUS
            ("am i within my budget", "BUDGET_STATUS"),
            ("how much budget do i have left", "BUDGET_STATUS"),
            ("did i exceed my monthly budget", "BUDGET_STATUS"),
            ("what is my budget status", "BUDGET_STATUS"),
            ("remaining budget for this month", "BUDGET_STATUS"),
            ("budget remaining", "BUDGET_STATUS"),
            ("how much of my budget have i used", "BUDGET_STATUS"),

            # SPENDING_COMPARISON
            ("compare this month with last month", "SPENDING_COMPARISON"),
            ("how does my spending compare to previous month", "SPENDING_COMPARISON"),
            ("am i spending more than last month", "SPENDING_COMPARISON"),
            ("month over month spending comparison", "SPENDING_COMPARISON"),
            ("difference between this month and previous month", "SPENDING_COMPARISON"),

            # EXPENSE_FORECAST
            ("what is my predicted next month expense", "EXPENSE_FORECAST"),
            ("forecast my spending for next month", "EXPENSE_FORECAST"),
            ("predict my expenses", "EXPENSE_FORECAST"),
            ("expected spending next month", "EXPENSE_FORECAST"),
            ("what is my expense forecast", "EXPENSE_FORECAST"),
            ("how much will i spend next month", "EXPENSE_FORECAST"),

            # RECENT_EXPENSES
            ("show my recent expenses", "RECENT_EXPENSES"),
            ("what were my last transactions", "RECENT_EXPENSES"),
            ("show recent purchases", "RECENT_EXPENSES"),
            ("what are my latest 5 expenses", "RECENT_EXPENSES"),
            ("list my recent spending", "RECENT_EXPENSES"),

            # SPENDING_ANALYSIS
            ("how can i reduce my spending", "SPENDING_ANALYSIS"),
            ("how can i save more money", "SPENDING_ANALYSIS"),
            ("analyze my spending habits", "SPENDING_ANALYSIS"),
            ("where can i cut down expenses", "SPENDING_ANALYSIS"),
            ("am i spending too much on food", "SPENDING_ANALYSIS"),
            ("give me tips to optimize my budget", "SPENDING_ANALYSIS"),
            ("how can i reduce my expenses", "SPENDING_ANALYSIS"),

            # FINANCIAL_KNOWLEDGE
            ("what is the 50/30/20 rule", "FINANCIAL_KNOWLEDGE"),
            ("what is an emergency fund", "FINANCIAL_KNOWLEDGE"),
            ("explain budgeting basics", "FINANCIAL_KNOWLEDGE"),
            ("what are fixed vs variable expenses", "FINANCIAL_KNOWLEDGE"),
            ("what is cash flow", "FINANCIAL_KNOWLEDGE"),
            ("how should i build savings", "FINANCIAL_KNOWLEDGE"),
            ("what does sinking fund mean", "FINANCIAL_KNOWLEDGE"),
            ("what is zero-based budgeting", "FINANCIAL_KNOWLEDGE"),
            ("define net worth", "FINANCIAL_KNOWLEDGE"),
        ]

        texts = [t[0] for t in training_data]
        labels = [t[1] for t in training_data]

        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)

    def classify(self, text: str) -> Tuple[str, float]:
        """
        Classifies intent with high precision rule overrides for explicit terms,
        falling back to the trained statistical model.
        """
        cleaned = text.strip().lower()

        # Rule overrides for high-precision exact keyword patterns
        if "50/30/20" in cleaned or "50 30 20" in cleaned:
            return "FINANCIAL_KNOWLEDGE", 1.0
        if re.search(r"\b(what is|define|explain)\b.*\b(emergency fund|sinking fund|net worth|cash flow|rule|compound interest)\b", cleaned):
            return "FINANCIAL_KNOWLEDGE", 0.98
        if re.search(r"\b(predict|prediction|forecast|next month expense|expected spending)\b", cleaned):
            return "EXPENSE_FORECAST", 0.98
        if re.search(r"\b(compare|comparison)\b.*\b(last month|previous month|month over month)\b", cleaned):
            return "SPENDING_COMPARISON", 0.98
        if re.search(r"\b(reduce|cut down|save more money|spending habits|reduce my expenses|tips to save)\b", cleaned):
            return "SPENDING_ANALYSIS", 0.95
        if re.search(r"\b(within|left|remaining|exceed|status)\b.*\bbudget\b|\bbudget\b.*\b(left|remaining|status)\b", cleaned):
            return "BUDGET_STATUS", 0.98
        if re.search(r"\b(biggest|highest|largest|most)\b.*\b(expense|spending|cost|purchase|category)\b", cleaned):
            return "HIGHEST_EXPENSE", 0.98
        if re.search(r"\b(recent|latest|last \d+)\b.*\b(expenses?|transactions?|purchases?)\b", cleaned):
            return "RECENT_EXPENSES", 0.98

        # Statistical ML prediction
        X = self.vectorizer.transform([cleaned])
        intent = self.classifier.predict(X)[0]
        probs = self.classifier.predict_proba(X)[0]
        confidence = float(max(probs))

        return intent, confidence
