import logging
from typing import Dict, Any, Optional
from app.config.settings import settings
from app.llm.providers.base import LLMProvider

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    """
    OpenAI LLM Provider implementation.
    Uses official openai client when OPENAI_API_KEY is configured.
    Provides intelligent local response generation when running offline or without API key.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.client = None

        if self.api_key and self.api_key.startswith("sk-"):
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")

    def generate_response(
        self,
        system_prompt: str,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        temperature: float = 0.2
    ) -> str:
        # Check if live OpenAI API is available
        if self.client:
            try:
                prompt_content = f"User Question: {user_message}"
                if context and context.get("formatted_context"):
                    prompt_content = f"{context['formatted_context']}\n\nUser Question: {user_message}"

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt_content}
                ]

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=600
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}")
                # Fallback to local financial reasoning engine

        return self._generate_local_financial_response(user_message, context)

    def _generate_local_financial_response(self, user_message: str, context: Optional[Dict[str, Any]]) -> str:
        """
        High-fidelity local financial synthesizer that explains actual MongoDB numbers
        and RAG retrieved knowledge without hallucinating or inventing data.
        """
        context = context or {}
        fin = context.get("financial_context") or {}
        rag = context.get("rag_context") or {}
        intent = fin.get("intent", "")

        # 1. Total Expense
        if intent == "EXPENSE_TOTAL" and "expense_total" in fin:
            data = fin["expense_total"]
            period = data.get("time_period", "this month").replace("_", " ")
            total = data.get("total_amount", 0)
            count = data.get("count", 0)
            return f"You have spent **Rs. {total:,.2f}** across {count} transaction(s) for {period}."

        # 2. Category Expense
        if intent == "CATEGORY_EXPENSE" and "category_expense" in fin:
            data = fin["category_expense"]
            cat = data.get("category", "Selected category")
            cat_total = data.get("category_total", 0)
            period = data.get("time_period", "this month").replace("_", " ")
            pct = data.get("percentage_of_spending", 0)
            items = data.get("sample_items", [])
            items_str = f" Recent purchases include: {', '.join(items)}." if items else ""
            return (
                f"You spent **Rs. {cat_total:,.2f}** on **{cat}** in {period}. "
                f"This represents **{pct}%** of your total spending for this period.{items_str}"
            )

        # 3. Budget Status
        if intent == "BUDGET_STATUS" and "budget_status" in fin:
            data = fin["budget_status"]
            budget = data.get("monthly_budget")
            spent = data.get("spent_this_month", 0)
            if not budget:
                return (
                    f"You have spent **Rs. {spent:,.2f}** this month. "
                    "You haven't set a monthly budget yet. You can set one on the Budget page to track your spending limits!"
                )
            remaining = data.get("remaining_budget", 0)
            pct = data.get("percent_used", 0)
            status_word = "within" if data.get("is_within_budget") else "exceeded"
            return (
                f"Your monthly budget is **Rs. {budget:,.2f}**. You have spent **Rs. {spent:,.2f}** ({pct}%), "
                f"leaving **Rs. {max(0, remaining):,.2f}** remaining. You are currently **{status_word}** your budget."
            )

        # 4. Spending Comparison
        if intent == "SPENDING_COMPARISON" and "spending_comparison" in fin:
            data = fin["spending_comparison"]
            curr = data.get("current_month_total", 0)
            prev = data.get("previous_month_total", 0)
            diff = data.get("difference", 0)
            trend = data.get("trend", "unchanged")
            pct = data.get("percentage_change")
            pct_str = f" ({abs(pct)}%)" if pct is not None else ""
            return (
                f"This month you spent **Rs. {curr:,.2f}**, compared to **Rs. {prev:,.2f}** last month. "
                f"Your spending has **{trend}** by **Rs. {abs(diff):,.2f}**{pct_str}."
            )

        # 5. Highest Expense
        if intent == "HIGHEST_EXPENSE" and "highest_expense" in fin:
            data = fin["highest_expense"]
            highest_cat = data.get("highest_category")
            biggest_exp = data.get("biggest_expense")

            parts = []
            if highest_cat and highest_cat.get("category"):
                parts.append(f"**{highest_cat['category']}** is your highest spending category at **Rs. {highest_cat['amount']:,.2f}**.")
            if biggest_exp and biggest_exp.get("title"):
                parts.append(f"Your single largest expense was **{biggest_exp['title']}** (**Rs. {biggest_exp['amount']:,.2f}**) on {biggest_exp.get('date')}.")

            return " ".join(parts) if parts else "No expense records found to determine highest spending."

        # 6. Date Filtered Expenses
        if intent == "DATE_EXPENSE" and "date_expenses" in fin:
            data = fin["date_expenses"]
            count = data.get("count", 0)
            total = data.get("total_amount", 0)
            filter_str = f" above Rs. {data['amount_filter']:,.0f}" if data.get("amount_filter") else ""
            month_str = f" in {data['month']}" if data.get("month") else ""
            return f"Found {count} expense(s){filter_str}{month_str} totaling **Rs. {total:,.2f}**."

        # 7. Recent Expenses
        if intent == "RECENT_EXPENSES" and "recent_expenses" in fin:
            data = fin["recent_expenses"]
            expenses = data.get("expenses", [])
            if not expenses:
                return "You have no recorded expenses yet."
            lines = [f"- **{e['title']}**: Rs. {e['amount']:,.2f} ({e['category']}) on {e['date']}" for e in expenses]
            return "Here are your recent expenses:\n" + "\n".join(lines)

        # 8. Forecast
        if intent == "EXPENSE_FORECAST" and "expense_forecast" in fin:
            data = fin["expense_forecast"]
            predicted = data.get("predicted_next_month", 0)
            return (
                f"Based on your recent spending trends and linear regression modeling, "
                f"your predicted expense for next month is approximately **Rs. {predicted:,.2f}**."
            )

        # 9. Spending Analysis / Hybrid
        if intent == "SPENDING_ANALYSIS" and "analysis_summary" in fin:
            summary = fin["analysis_summary"]
            spent = summary.get("total_expense_this_month", 0)
            highest = summary.get("highest_category")
            cat_text = f"Your highest expenditure category is **{highest['category']}** (**Rs. {highest['amount']:,.2f}**). " if highest else ""

            budget_text = ""
            b_data = summary.get("budget_status", {})
            if b_data.get("monthly_budget"):
                budget_text = f"You have used {b_data.get('percent_used', 0)}% of your monthly budget. "

            advice = (
                f"You have spent **Rs. {spent:,.2f}** this month. {cat_text}{budget_text}\n\n"
                "**Practical steps to reduce expenses:**\n"
                "1. **Audit top category**: Target the 80/20 rule — small reductions in your largest category yield the highest savings.\n"
                "2. **Implement the 48-Hour Rule**: Wait 48 hours before non-essential purchases to curb impulse buys.\n"
                "3. **Follow the 50/30/20 framework**: Aim for 50% needs, 30% wants, and 20% savings."
            )
            return advice

        # 10. Financial Knowledge (RAG)
        if rag and rag.get("context_text"):
            sources = ", ".join([s.get("title", "") for s in rag.get("sources", []) if s.get("title")])
            source_note = f"\n\n*(Based on educational financial knowledge: {sources})*" if sources else ""
            # Return excerpt from retrieved documents formatted cleanly
            first_chunk = rag["context_text"].split("---")[0].strip()
            return f"{first_chunk}{source_note}"

        return "I can help you analyze your spending, check category totals, monitor budget limits, compare months, and answer financial questions. What would you like to check?"
