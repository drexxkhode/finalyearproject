import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import ClipLoader from "react-spinners/ClipLoader";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_URL ?? "http://localhost:5000";

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([
    { name: "Accepted",  type: "column", data: [] },
    { name: "Cancelled", type: "column", data: [] },
    { name: "Payments",  type: "line",   data: [] },
    { name: "Refunds",   type: "line",   data: [] },
  ]);

  useEffect(() => {
    const socket = io(API, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("booking-analytics-monthly", (data) => {
      setCategories(data.map((d) => d.month));
      setSeries([
        { name: "Accepted",  type: "column", data: data.map((d) => d.accepted)  },
        { name: "Cancelled", type: "column", data: data.map((d) => d.cancelled) },
        { name: "Payments",  type: "line",   data: data.map((d) => d.payments)  },
        { name: "Refunds",   type: "line",   data: data.map((d) => d.refunds)   },
      ]);
    });

    return () => socket.disconnect();
  }, []);

  // Y-axis safe maximums
  const acceptedMax  = series[0].data.length ? Math.max(...series[0].data) : 10;
  const cancelledMax = series[1].data.length ? Math.max(...series[1].data) : 10;
  const bookingMax   = Math.max(acceptedMax, cancelledMax) + 5;
  const paymentsMax  = series[2].data.length ? Math.max(...series[2].data) : 1000;
  const refundsMax   = series[3].data.length ? Math.max(...series[3].data) : 1000;
  const moneyMax     = Math.max(paymentsMax, refundsMax);

  const options = {
    chart: {
      type: "line",
      stacked: false,
      toolbar: { show: false },
      zoom:    { enabled: false },
    },

    plotOptions: {
      bar: { columnWidth: "55%", borderRadius: 4 },
    },

    // 4 series: 2 columns (no stroke) + 2 lines (stroke width 3)
    stroke: { width: [0, 0, 3, 3] },

    dataLabels: { enabled: false },

    xaxis: { categories },

    yaxis: [
      {
        // series[0] Accepted + series[1] Cancelled
        min: 0,
        max: bookingMax,
        title: { text: "Bookings" },
        labels: { formatter: (val) => Math.round(val) },
      },
      {
        // series[2] Payments
        opposite: true,
        min: 0,
        max: moneyMax * 1.2,
        title: { text: "Amount (₵)" },
        labels: {
          formatter: (val) => {
            if (val >= 1000) return `₵${(val / 1000).toFixed(1)}k`;
            return `₵${Number(val).toFixed(0)}`;
          },
        },
      },
      {
        // series[3] Refunds — same scale as Payments, axis hidden to avoid duplicate
        opposite: true,
        show: false,
        min: 0,
        max: moneyMax * 1.2,
      },
    ],

    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0 || seriesIndex === 1) return `${val} bookings`;
          if (val >= 1000) return `₵${(val / 1000).toFixed(1)}k`;
          return `₵${Number(val).toFixed(2)}`;
        },
      },
    },

    colors: ["#00E396", "#FF4560", "#008FFB", "#FEB019"],

    legend: { position: "bottom" },
  };

  if (!categories.length)
    return (
      <div className="text-center py-5">
        <ClipLoader color="#3641d7" size={30} />
      </div>
    );

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={350}
    />
  );
};

export default Analytics;