import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.config.settings import settings

def get_mongo_db():
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
    return client[settings.MONGODB_DB_NAME]

def get_user_object_id(user_id: str):
    try:
        return ObjectId(user_id)
    except Exception:
        return user_id

def get_date_range(time_period: Optional[str], month_num: Optional[int] = None, year: Optional[int] = None):
    now = datetime.datetime.now(datetime.timezone.utc)
    current_year = year or now.year

    if month_num:
        start = datetime.datetime(current_year, month_num, 1, tzinfo=datetime.timezone.utc)
        if month_num == 12:
            end = datetime.datetime(current_year + 1, 1, 1, tzinfo=datetime.timezone.utc)
        else:
            end = datetime.datetime(current_year, month_num + 1, 1, tzinfo=datetime.timezone.utc)
        return start, end

    if time_period == "this_month":
        start = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.timezone.utc)
        if now.month == 12:
            end = datetime.datetime(now.year + 1, 1, 1, tzinfo=datetime.timezone.utc)
        else:
            end = datetime.datetime(now.year, now.month + 1, 1, tzinfo=datetime.timezone.utc)
        return start, end

    elif time_period == "last_month":
        if now.month == 1:
            start = datetime.datetime(now.year - 1, 12, 1, tzinfo=datetime.timezone.utc)
            end = datetime.datetime(now.year, 1, 1, tzinfo=datetime.timezone.utc)
        else:
            start = datetime.datetime(now.year, now.month - 1, 1, tzinfo=datetime.timezone.utc)
            end = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.timezone.utc)
        return start, end

    elif time_period == "this_year":
        start = datetime.datetime(now.year, 1, 1, tzinfo=datetime.timezone.utc)
        end = datetime.datetime(now.year + 1, 1, 1, tzinfo=datetime.timezone.utc)
        return start, end

    elif time_period == "today":
        start = datetime.datetime(now.year, now.month, now.day, tzinfo=datetime.timezone.utc)
        end = start + datetime.timedelta(days=1)
        return start, end

    elif time_period == "yesterday":
        today_start = datetime.datetime(now.year, now.month, now.day, tzinfo=datetime.timezone.utc)
        start = today_start - datetime.timedelta(days=1)
        end = today_start
        return start, end

    return None, None

def get_user_expenses(user_id: str, query_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Safely retrieves expenses belonging strictly to the authenticated user.
    """
    db = get_mongo_db()
    uid = get_user_object_id(user_id)
    base_filter: Dict[str, Any] = {"user": uid}
    if query_filter:
        base_filter.update(query_filter)

    cursor = db.expenses.find(base_filter).sort("date", -1)
    results = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["user"] = str(doc["user"])
        if isinstance(doc.get("date"), datetime.datetime):
            doc["date"] = doc["date"].strftime("%Y-%m-%d")
        results.append(doc)
    return results

def get_total_expense(user_id: str, time_period: Optional[str] = "this_month") -> Dict[str, Any]:
    start_date, end_date = get_date_range(time_period)
    query: Dict[str, Any] = {}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lt": end_date}

    expenses = get_user_expenses(user_id, query)
    total = sum(float(e.get("amount", 0)) for e in expenses)

    return {
        "time_period": time_period or "all_time",
        "total_amount": round(total, 2),
        "count": len(expenses),
        "currency": "Rs."
    }

def get_category_expense(user_id: str, category: str, time_period: Optional[str] = "this_month") -> Dict[str, Any]:
    start_date, end_date = get_date_range(time_period)
    query: Dict[str, Any] = {
        "category": {"$regex": f"^{category}$", "$options": "i"}
    }
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lt": end_date}

    expenses = get_user_expenses(user_id, query)
    total = sum(float(e.get("amount", 0)) for e in expenses)

    # Also compute total spending across all categories in this period for proportion
    all_expenses = get_user_expenses(user_id, {"date": {"$gte": start_date, "$lt": end_date}} if start_date else {})
    overall_total = sum(float(e.get("amount", 0)) for e in all_expenses)
    percentage = round((total / overall_total * 100), 1) if overall_total > 0 else 0.0

    return {
        "category": category,
        "time_period": time_period or "all_time",
        "category_total": round(total, 2),
        "overall_period_total": round(overall_total, 2),
        "percentage_of_spending": percentage,
        "expense_count": len(expenses),
        "sample_items": [e.get("title") for e in expenses[:5]],
        "currency": "Rs."
    }

def get_expenses_by_date(
    user_id: str,
    month_name: Optional[str] = None,
    month_num: Optional[int] = None,
    year: Optional[int] = None,
    amount_filter: Optional[float] = None,
    amount_operator: Optional[str] = ">"
) -> Dict[str, Any]:
    start_date, end_date = get_date_range(None, month_num=month_num, year=year)
    query: Dict[str, Any] = {}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lt": end_date}

    if amount_filter is not None:
        if amount_operator == ">":
            query["amount"] = {"$gt": amount_filter}
        elif amount_operator == "<":
            query["amount"] = {"$lt": amount_filter}
        else:
            query["amount"] = amount_filter

    expenses = get_user_expenses(user_id, query)
    total = sum(float(e.get("amount", 0)) for e in expenses)

    return {
        "month": month_name,
        "year": year,
        "amount_filter": amount_filter,
        "amount_operator": amount_operator,
        "total_amount": round(total, 2),
        "count": len(expenses),
        "expenses": expenses[:10],
        "currency": "Rs."
    }

def get_highest_expense(user_id: str, time_period: Optional[str] = None) -> Dict[str, Any]:
    start_date, end_date = get_date_range(time_period)
    query = {"date": {"$gte": start_date, "$lt": end_date}} if start_date else {}
    expenses = get_user_expenses(user_id, query)

    if not expenses:
        return {
            "biggest_expense": None,
            "highest_category": None,
            "category_spending": {}
        }

    # 1. Largest single expense
    biggest = max(expenses, key=lambda e: float(e.get("amount", 0)))

    # 2. Highest spending category
    cat_totals: Dict[str, float] = {}
    for e in expenses:
        cat = e.get("category", "Other")
        cat_totals[cat] = cat_totals.get(cat, 0.0) + float(e.get("amount", 0))

    highest_cat = max(cat_totals.items(), key=lambda item: item[1])

    return {
        "biggest_expense": {
            "title": biggest.get("title"),
            "amount": round(float(biggest.get("amount", 0)), 2),
            "category": biggest.get("category"),
            "date": biggest.get("date")
        },
        "highest_category": {
            "category": highest_cat[0],
            "amount": round(highest_cat[1], 2)
        },
        "category_spending": {k: round(v, 2) for k, v in cat_totals.items()},
        "currency": "Rs."
    }

def get_budget_status(user_id: str, monthly_budget: Optional[float] = None) -> Dict[str, Any]:
    this_month_data = get_total_expense(user_id, "this_month")
    spent = this_month_data["total_amount"]

    budget_val = float(monthly_budget) if monthly_budget and monthly_budget > 0 else None
    remaining = round(budget_val - spent, 2) if budget_val is not None else None
    used_pct = round((spent / budget_val * 100), 1) if budget_val else None
    is_within = (spent <= budget_val) if budget_val is not None else None

    return {
        "monthly_budget": budget_val,
        "spent_this_month": spent,
        "remaining_budget": remaining,
        "percent_used": used_pct,
        "is_within_budget": is_within,
        "currency": "Rs."
    }

def compare_months(user_id: str) -> Dict[str, Any]:
    this_month = get_total_expense(user_id, "this_month")
    last_month = get_total_expense(user_id, "last_month")

    diff = round(this_month["total_amount"] - last_month["total_amount"], 2)
    pct_change = None
    if last_month["total_amount"] > 0:
        pct_change = round((diff / last_month["total_amount"] * 100), 1)

    return {
        "current_month_total": this_month["total_amount"],
        "previous_month_total": last_month["total_amount"],
        "difference": diff,
        "percentage_change": pct_change,
        "trend": "increased" if diff > 0 else ("decreased" if diff < 0 else "unchanged"),
        "currency": "Rs."
    }

def get_recent_expenses(user_id: str, limit: int = 5) -> Dict[str, Any]:
    expenses = get_user_expenses(user_id)
    return {
        "count": len(expenses[:limit]),
        "expenses": [
            {
                "title": e.get("title"),
                "amount": round(float(e.get("amount", 0)), 2),
                "category": e.get("category", "Other"),
                "date": e.get("date")
            }
            for e in expenses[:limit]
        ],
        "currency": "Rs."
    }

def get_expense_forecast(user_id: str) -> Dict[str, Any]:
    expenses = get_user_expenses(user_id)
    amounts = [float(e.get("amount", 0)) for e in reversed(expenses) if float(e.get("amount", 0)) > 0]

    if not amounts:
        return {"predicted_next_month": 0.0, "basis": "no expense history", "currency": "Rs."}
    if len(amounts) == 1:
        return {"predicted_next_month": round(amounts[0], 2), "basis": "single expense baseline", "currency": "Rs."}

    # Linear trend prediction
    n = len(amounts)
    x = list(range(n))
    y = amounts
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_xx = sum(xi * xi for xi in x)
    denominator = n * sum_xx - sum_x * sum_x

    if denominator == 0:
        predicted = sum_y / n
    else:
        slope = (n * sum_xy - sum_x * sum_y) / denominator
        intercept = (sum_y - slope * sum_x) / n
        predicted = max(0.0, slope * n + intercept)

    return {
        "predicted_next_month": round(predicted, 2),
        "sample_size": n,
        "basis": "linear regression trend across chronological expenses",
        "currency": "Rs."
    }
