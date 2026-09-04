import datetime
from typing import Dict, Any, Optional

from app.financial.context_provider import FinancialContextProvider
from app.financial import financial_queries

class SmartExpenseContextProvider(FinancialContextProvider):
    """
    Concrete context builder for Smart Expense Analyzer.
    Implements FinancialContextProvider to retrieve real user data
    from MongoDB based on the detected intent and entities.
    """

    def get_financial_context(
        self,
        user_id: str,
        intent: str,
        entities: Optional[Dict[str, Any]] = None,
        extra_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        entities = entities or {}
        extra_params = extra_params or {}

        now = datetime.datetime.now()
        current_month_name = now.strftime("%B %Y")

        context: Dict[str, Any] = {
            "current_month": current_month_name,
            "currency": "Rs.",
            "intent": intent,
        }

        monthly_budget = extra_params.get("monthly_budget")
        if monthly_budget:
            try:
                monthly_budget = float(monthly_budget)
            except (ValueError, TypeError):
                monthly_budget = None

        if intent == "EXPENSE_TOTAL":
            time_period = entities.get("time_period", "this_month")
            context["expense_total"] = financial_queries.get_total_expense(user_id, time_period)

        elif intent == "CATEGORY_EXPENSE":
            category = entities.get("category", "Other")
            time_period = entities.get("time_period", "this_month")
            context["category_expense"] = financial_queries.get_category_expense(user_id, category, time_period)

        elif intent == "DATE_EXPENSE":
            month_name = entities.get("month")
            month_num = entities.get("month_num")
            year = entities.get("year")
            amt_filter = entities.get("amount_filter")
            amt_op = entities.get("amount_operator", ">")
            context["date_expenses"] = financial_queries.get_expenses_by_date(
                user_id, month_name=month_name, month_num=month_num, year=year,
                amount_filter=amt_filter, amount_operator=amt_op
            )

        elif intent == "HIGHEST_EXPENSE":
            time_period = entities.get("time_period")
            context["highest_expense"] = financial_queries.get_highest_expense(user_id, time_period)

        elif intent == "BUDGET_STATUS":
            context["budget_status"] = financial_queries.get_budget_status(user_id, monthly_budget)

        elif intent == "SPENDING_COMPARISON":
            context["spending_comparison"] = financial_queries.compare_months(user_id)

        elif intent == "EXPENSE_FORECAST":
            context["expense_forecast"] = financial_queries.get_expense_forecast(user_id)

        elif intent == "RECENT_EXPENSES":
            context["recent_expenses"] = financial_queries.get_recent_expenses(user_id, limit=5)

        elif intent == "SPENDING_ANALYSIS":
            # For spending analysis, supply targeted summary: category breakdown, total, budget, highest category
            total_data = financial_queries.get_total_expense(user_id, "this_month")
            highest_data = financial_queries.get_highest_expense(user_id, "this_month")
            budget_data = financial_queries.get_budget_status(user_id, monthly_budget)
            recent_data = financial_queries.get_recent_expenses(user_id, limit=5)

            context["analysis_summary"] = {
                "total_expense_this_month": total_data["total_amount"],
                "highest_category": highest_data.get("highest_category"),
                "category_spending": highest_data.get("category_spending"),
                "biggest_single_expense": highest_data.get("biggest_expense"),
                "budget_status": budget_data,
                "recent_expenses": recent_data["expenses"]
            }

        else:
            # Default minimal context for general conversation
            context["quick_summary"] = financial_queries.get_total_expense(user_id, "this_month")

        return context

# Default provider instance
financial_context_provider = SmartExpenseContextProvider()
