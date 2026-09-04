import pytest
from app.financial.financial_context import financial_context_provider

def test_financial_context_structure():
    user_id = "507f1f77bcf86cd799439011"
    context = financial_context_provider.get_financial_context(
        user_id=user_id,
        intent="EXPENSE_TOTAL",
        entities={"time_period": "this_month"}
    )

    assert "current_month" in context
    assert "currency" in context
    assert context["currency"] == "Rs."
    assert "expense_total" in context

def test_financial_context_budget_status():
    user_id = "507f1f77bcf86cd799439011"
    context = financial_context_provider.get_financial_context(
        user_id=user_id,
        intent="BUDGET_STATUS",
        extra_params={"monthly_budget": 20000}
    )

    assert "budget_status" in context
    assert context["budget_status"]["monthly_budget"] == 20000.0
