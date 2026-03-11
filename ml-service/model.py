import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

def predict_next_month(expenses):
    if len(expenses) < 2:
        return 0

    df = pd.DataFrame(expenses)

    X = np.arange(len(df)).reshape(-1, 1)
    y = df["amount"]

    model = LinearRegression()
    model.fit(X, y)

    next_month = [[len(df)]]
    prediction = model.predict(next_month)

    return round(float(prediction[0]), 2)
