import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

function Charts({ expenses, compact = false }) {
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || "Uncategorized";
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount)) return acc;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  const labels = Object.keys(categoryTotals);
  const amounts = labels.map((label) => categoryTotals[label]);
  const hasData = labels.length > 0;

  const colors = [
    "#6366f1",
    "#22c55e",
    "#f97316",
    "#ef4444",
    "#14b8a6",
    "#a855f7",
    "#0ea5e9",
    "#fb7185",
    "#facc15",
  ];

  const barData = {
    labels,
    datasets: [
      {
        label: "Category Spend",
        data: amounts,
        backgroundColor: colors,
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        data: amounts,
        backgroundColor: colors,
      },
    ],
  };

  return (
    <div className={`charts-panel ${compact ? "compact" : ""}`}>
      {hasData ? (
        <>
          <div className="chart-block">
            <h3>Category Spending</h3>
            <div className="chart-card">
              <Pie data={pieData} />
            </div>
          </div>

          {!compact && <div className="chart-block">
            <h3>Expense Trend</h3>
            <div className="chart-card">
              <Bar data={barData} />
            </div>
          </div>}

          {!compact && <div className="category-legend">
            {labels.map((label, index) => (
              <div className="legend-item" key={label}>
                <span
                  className="legend-color"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span>{label}: Rs.{categoryTotals[label].toLocaleString()}</span>
              </div>
            ))}
          </div>}
        </>
      ) : (
        <div className="chart-card empty-state">No data available</div>
      )}
    </div>
  );
}

export default Charts;
