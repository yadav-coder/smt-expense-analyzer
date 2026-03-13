from flask import Flask, request, jsonify
from model import predict_next_month
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "ML Service Running"

@app.route("/predict", methods=["POST"])
def predict():
    expenses = request.json["expenses"]
    prediction = predict_next_month(expenses)
    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)