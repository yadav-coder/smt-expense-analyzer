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

function Charts({ expenses }) {

  // Prepare data
  const labels = expenses.map((e) => e.title);
  const amounts = expenses.map((e) => Number(e.amount));

  const barData = {
    labels,
    datasets: [
      {
        label: "Expenses",
        data: amounts,
        backgroundColor: "#4f46e5",
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        data: amounts,
        backgroundColor: [
          "#6366f1",
          "#22c55e",
          "#f97316",
          "#ef4444",
          "#14b8a6",
          "#a855f7",
        ],
      },
    ],
  };

  return (
    <div>

      <h3>Bar Chart</h3>
      <div style={{ width: "400px", margin: "auto" }}>
        <Bar data={barData} />
      </div>

      <h3>Pie Chart</h3>
      <div style={{ width: "350px", margin: "auto" }}>
        <Pie data={pieData} />
      </div>

    </div>
  );
}

export default Charts;
