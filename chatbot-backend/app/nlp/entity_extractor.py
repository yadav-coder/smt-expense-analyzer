import re
from typing import Dict, Any, Optional

class EntityExtractor:
    """
    Extracts structured entities such as CATEGORY, DATE, MONTH, YEAR, AMOUNT, and TIME_PERIOD
    from natural language financial queries.
    """

    CATEGORIES = {
        "food": "Food",
        "dining": "Food",
        "dinner": "Food",
        "lunch": "Food",
        "breakfast": "Food",
        "restaurant": "Food",
        "coffee": "Food",
        "groceries": "Groceries",
        "grocery": "Groceries",
        "supermarket": "Groceries",
        "transport": "Transport",
        "transportation": "Transport",
        "travel": "Transport",
        "fuel": "Transport",
        "petrol": "Transport",
        "cab": "Transport",
        "taxi": "Transport",
        "uber": "Transport",
        "ola": "Transport",
        "bus": "Transport",
        "train": "Transport",
        "rent": "Rent",
        "bills": "Bills",
        "bill": "Bills",
        "electricity": "Bills",
        "water": "Bills",
        "internet": "Bills",
        "wifi": "Bills",
        "health": "Health",
        "healthcare": "Health",
        "medical": "Health",
        "doctor": "Health",
        "medicine": "Health",
        "hospital": "Health",
        "education": "Education",
        "college": "Education",
        "school": "Education",
        "books": "Education",
        "tuition": "Education",
        "fee": "Education",
        "fees": "Education",
        "shopping": "Shopping",
        "clothes": "Clothing",
        "clothing": "Clothing",
        "electronics": "Electronics",
        "mobile": "Mobile",
        "phone": "Mobile",
        "recharge": "Mobile",
        "entertainment": "Entertainment",
        "movies": "Entertainment",
        "netflix": "Entertainment",
        "other": "Other"
    }

    MONTHS = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10,
        "nov": 11, "dec": 12
    }

    def extract(self, text: str) -> Dict[str, Any]:
        cleaned = text.strip()
        lower = cleaned.lower()
        entities: Dict[str, Any] = {}

        # 1. Category extraction
        for keyword, standard_cat in self.CATEGORIES.items():
            if re.search(rf"\b{re.escape(keyword)}\b", lower):
                entities["category"] = standard_cat
                break

        # 2. Time period extraction
        if re.search(r"\b(last month|previous month)\b", lower):
            entities["time_period"] = "last_month"
        elif re.search(r"\b(this month|current month)\b", lower):
            entities["time_period"] = "this_month"
        elif re.search(r"\b(this year|current year)\b", lower):
            entities["time_period"] = "this_year"
        elif re.search(r"\b(last year|previous year)\b", lower):
            entities["time_period"] = "last_year"
        elif re.search(r"\b(today)\b", lower):
            entities["time_period"] = "today"
        elif re.search(r"\b(yesterday)\b", lower):
            entities["time_period"] = "yesterday"
        elif re.search(r"\b(all time|overall|total)\b", lower):
            entities["time_period"] = "all_time"

        # 3. Month extraction
        for month_name, month_num in self.MONTHS.items():
            if re.search(rf"\b{re.escape(month_name)}\b", lower):
                entities["month"] = month_name.capitalize()
                entities["month_num"] = month_num
                break

        # 4. Year extraction (e.g., 2020-2035)
        year_match = re.search(r"\b(20[2-3][0-9])\b", lower)
        if year_match:
            entities["year"] = int(year_match.group(1))

        # 5. Amount filter extraction (e.g., "above 1000", "over 500", "greater than 2000", "more than 300", "> 500")
        amount_match = re.search(
            r"(?:above|over|more than|greater than|>|exceeding)\s*(?:rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)",
            lower
        )
        if amount_match:
            val_str = amount_match.group(1).replace(",", "")
            try:
                entities["amount_filter"] = float(val_str)
                entities["amount_operator"] = ">"
            except ValueError:
                pass
        else:
            amount_less = re.search(
                r"(?:below|under|less than|<)\s*(?:rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)",
                lower
            )
            if amount_less:
                val_str = amount_less.group(1).replace(",", "")
                try:
                    entities["amount_filter"] = float(val_str)
                    entities["amount_operator"] = "<"
                except ValueError:
                    pass

        # 6. Specific amount mentioned without operator (e.g. "I spent 3000 on food")
        if "amount_filter" not in entities:
            direct_amt = re.search(r"(?:spent|paid|cost)\s*(?:rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)", lower)
            if direct_amt:
                try:
                    entities["mentioned_amount"] = float(direct_amt.group(1).replace(",", ""))
                except ValueError:
                    pass

        return entities
