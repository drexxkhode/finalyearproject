import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // adjust if needed

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([
    { name: "Accepted", type: "column", data: [], yAxisIndex: 0 },
    { name: "Rejected", type: "column", data: [], yAxisIndex: 0 },
    { name: "Payments", type: "line", data: [], yAxisIndex: 1 },
  ]);

  useEffect(() => {
    socket.on("booking-analytics-monthly", (data) => {
      setCategories(data.map((d) => d.month));
      setSeries([
        { name: "Accepted", type: "column", data: data.map(d => d.accepted), yAxisIndex: 0 },
        { name: "Rejected", type: "column", data: data.map(d => d.rejected), yAxisIndex: 0 },
        { name: "Payments", type: "line", data: data.map(d => d.payments), yAxisIndex: 1 },
      ]);
    });

    return () => socket.off("booking-analytics-monthly");
  }, []);

  // SAFE MAX RANGES
  const acceptedMax = series[0].data.length ? Math.max(...series[0].data) : 10;
  const rejectedMax = series[1].data.length ? Math.max(...series[1].data) : 10;
  const bookingMax = Math.max(acceptedMax, rejectedMax) + 5;
  const paymentMax = series[2].data.length ? Math.max(...series[2].data) : 1000;

  const options = {
    chart: {
      type: "line",
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: false },
    },

    plotOptions: {
      bar: { columnWidth: "55%", borderRadius: 4 },
    },

    stroke: { width: [0, 0, 3] },

    dataLabels: { enabled: false },

    xaxis: { categories },

    yaxis: [
      {
        // LEFT: Bookings (Accepted + Rejected)
        min: 0,
        max: bookingMax,
        title: { text: "Bookings" },
        labels: { formatter: (val) => val },
      },
      {
        // RIGHT: Payments
        opposite: true,
        min: 0,
        max: paymentMax * 1.2,
        title: { text: "Payments" },
        labels: { formatter: (val) => `₡${(val / 1000).toFixed(1)}k` },
      },
    ],

    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0 || seriesIndex === 1) return val;       // bookings
          if (seriesIndex === 2) return `₡${(val / 1000).toFixed(1)}k`; // payments
          return val;
        },
      },
    },

    colors: ["#00E396", "#FF4560", "#008FFB"],

    legend: { position: "bottom" },
  };

  if (!categories.length) return <div className="text-center py-5">Loading analytics…</div>;

  return <Chart options={options} series={series} type="line" height={350} />;
};

export default Analytics;