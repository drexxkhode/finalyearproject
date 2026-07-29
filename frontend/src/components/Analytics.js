import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import ClipLoader from "react-spinners/ClipLoader";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_URL ?? "http://localhost:5000";

const Analytics = () => {
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState([]);
  const [statusSeries, setStatusSeries] = useState([
    { name: "Confirmed", data: [] },
    { name: "Completed", data: [] },
    { name: "Cancelled", data: [] },
    { name: "Rejected",  data: [] },
  ]);
  const [moneySeries, setMoneySeries] = useState([
    { name: "Payments", data: [] },
    { name: "Refunds",  data: [] },
  ]);


  useEffect(() => {
    const socket = io(API, {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("booking-analytics-monthly", (data) => {
      if (!Array.isArray(data)) return;

      if (data.length === 0) {
        setStatus('empty');
        return;
      }

      setCategories(data.map((d) => d.month));
      setStatusSeries([
        { name: "Confirmed", data: data.map((d) => d.confirmed) },
        { name: "Completed", data: data.map((d) => d.completed) },
        { name: "Cancelled", data: data.map((d) => d.cancelled) },
        { name: "Rejected",  data: data.map((d) => d.rejected)  },
      ]);
      setMoneySeries([
        { name: "Payments", data: data.map((d) => d.payments) },
        { name: "Refunds",  data: data.map((d) => d.refunds)  },
      ]);
    });

    return () => socket.disconnect();
  }, []);

  const monthCount  = categories.length;
  const columnWidth = monthCount <= 3 ? "30%" : monthCount <= 6 ? "50%" : "65%";

  const moneyFormatter = (val) => {
    if (val >= 1000) return `₵${(val / 1000).toFixed(1)}k`;
    return `₵${Number(val).toFixed(2)}`;
  };

  const statusOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, zoom: { enabled: true } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth,
        borderRadius: 10,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        dataLabels: {
          total: {
            enabled: true,
            style: { fontSize: '13px', fontWeight: 900 },
          },
        },
      },
    },
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom', offsetX: -10, offsetY: 0 } } },
    ],
    xaxis: { categories },
    legend: { position: 'right', offsetY: 40 },
    fill: { opacity: 1 },
    colors: ["#0d6efd", "#00E396", "#FF4560", "#6f42c1"],
    dataLabels: { enabled: false },
  };

  const moneyOptions = {
    chart: { type: "line", toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    xaxis: { categories },
    yaxis: { labels: { formatter: moneyFormatter } },
    tooltip: { y: { formatter: moneyFormatter } },
    colors: ["#008FFB", "#FEB019"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };

  if (status === 'empty') return (
    <div className="text-center py-5 text-muted">
      <i className="bi bi-bar-chart fs-1 d-block mb-2 opacity-25"></i>
      <p className="mb-0">No booking data yet.</p>
      <small>Analytics will appear once bookings are made.</small>
    </div>
  );

  if (!categories.length)
    return (
      <div className="text-center py-5">
        <ClipLoader color="#3641d7" size={30} />
      </div>
    );

 return (
  <div className="row g-3">
    <div className="col-lg-8">
      
        <Chart options={statusOptions} series={statusSeries} type="bar" height={350} />
      
    </div>
    <div className="col-lg-4">
      <h6 className="text-center mb-2 text-muted">Payments vs Refunds</h6>
      <Chart options={moneyOptions} series={moneySeries} type="line" height={320} />
    </div>
  </div>
);
};

export default Analytics;