import pytest
from app.nlp.nlp_pipeline import NLPPipeline

@pytest.fixture(scope="module")
def pipeline():
    return NLPPipeline()

def test_intent_expense_total(pipeline):
    result = pipeline.process("How much did I spend this month?")
    assert result["intent"] == "EXPENSE_TOTAL"
    assert result["route"] == "PATH_A"

def test_intent_category_expense(pipeline):
    result = pipeline.process("How much did I spend on food?")
    assert result["intent"] == "CATEGORY_EXPENSE"
    assert result["entities"].get("category") == "Food"
    assert result["route"] == "PATH_A"

def test_intent_highest_expense(pipeline):
    result = pipeline.process("Which category costs me the most?")
    assert result["intent"] == "HIGHEST_EXPENSE"
    assert result["route"] == "PATH_A"

def test_intent_budget_status(pipeline):
    result = pipeline.process("Am I within my budget?")
    assert result["intent"] == "BUDGET_STATUS"
    assert result["route"] == "PATH_A"

def test_intent_spending_comparison(pipeline):
    result = pipeline.process("Compare this month with last month.")
    assert result["intent"] == "SPENDING_COMPARISON"
    assert result["route"] == "PATH_A"

def test_intent_financial_knowledge(pipeline):
    result = pipeline.process("What is the 50/30/20 rule?")
    assert result["intent"] == "FINANCIAL_KNOWLEDGE"
    assert result["route"] == "PATH_B"

def test_intent_spending_analysis(pipeline):
    result = pipeline.process("How can I reduce my expenses?")
    assert result["intent"] == "SPENDING_ANALYSIS"
    assert result["route"] == "PATH_C"

def test_intent_biggest_expense(pipeline):
    result = pipeline.process("What was my biggest expense?")
    assert result["intent"] == "HIGHEST_EXPENSE"
    assert result["route"] == "PATH_A"

def test_intent_forecast(pipeline):
    result = pipeline.process("What is my predicted next month expense?")
    assert result["intent"] == "EXPENSE_FORECAST"
    assert result["route"] == "PATH_A"

def test_entity_extraction_date_and_amount(pipeline):
    result = pipeline.process("Show expenses above 1000 in August")
    assert result["intent"] == "DATE_EXPENSE"
    assert result["entities"].get("month") == "August"
    assert result["entities"].get("amount_filter") == 1000.0
    assert result["entities"].get("amount_operator") == ">"
