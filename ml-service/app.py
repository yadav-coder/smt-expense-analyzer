from flask import Flask, request, jsonify
from model import predict_next_month

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    expenses = request.json["expenses"]
    prediction = predict_next_month(expenses)
    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    app.run(port=5001)
