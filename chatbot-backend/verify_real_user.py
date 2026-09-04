from app.controllers.chat_controller import chat_controller

user_id = "6a99c8df1bbc6cf7e021271f"
test_questions = [
    "How much did I spend this month?",
    "How much did I spend on food?",
    "Which category costs me the most?",
    "Am I within my budget?",
    "Compare this month with last month",
    "What is the 50/30/20 rule?",
    "How can I reduce my expenses?",
    "What was my biggest expense?",
    "What is my predicted next month expense?"
]

print("=" * 60)
print(f"VERIFYING REAL USER DATA QUERIES (User: {user_id})")
print("=" * 60)

for q in test_questions:
    res = chat_controller.process_chat_message(
        user_id=user_id,
        message=q,
        extra_params={"monthly_budget": 5000}
    )
    print(f"USER: {q}")
    print(f"NLP: Intent = {res.get('intent')} | Route = {res.get('route')}")
    print(f"AI RESPONSE:\n{res.get('response')}")
    print("-" * 60)
