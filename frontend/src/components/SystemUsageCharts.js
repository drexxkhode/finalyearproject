import axios from 'axios';
import { useState, useEffect } from 'react';
import Chart from "react-apexcharts";

const API = process.env.REACT_APP_URL;
const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14', '#0dcaf0'];

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected:  'Rejected',
};

const PAYMENT_STATUS_LABELS = {
  completed:      'Completed',
  refunded:       'Refunded',
  partial_refund: 'Partial Refund',
};

// ── Wrapper: card shell + loading/empty states around the raw Chart ────────
function PieCard({ title, labels, series, loading, formatValue }) {
  const hasData = series.some(v => v > 0);

  return (
    <div className="col-lg-4 col-md-6 mb-3">
      <div className="card h-100">
        <div className="card-header"><h6 className="card-title mb-0">{title}</h6></div>
        <div className="card-body d-flex align-items-center justify-content-center" style={{ minHeight: 280 }}>
          {loading ? (
            <div className="spinner-border text-primary" />
          ) : !hasData ? (
            <p className="text-muted small mb-0">No data yet</p>
          ) : (
            <Chart
              type="pie"
              width="100%"
              height={280}
              series={series}
              options={{
                labels,
                colors: COLORS,
                legend: { position: 'bottom', fontSize: '12px' },
                dataLabels: {
                  formatter: (val, { seriesIndex, w }) =>
                    formatValue ? formatValue(w.config.series[seriesIndex]) : `${val.toFixed(0)}%`,
                },
                tooltip: {
                  y: { formatter: val => (formatValue ? formatValue(val) : val) },
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SystemUsageCharts({ userTotals }) {
  const [bookingsByStatus, setBookingsByStatus] = useState([]);
  const [paymentsByStatus, setPaymentsByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API}/api/super/analytics/bookings-by-status`, { headers }),
      axios.get(`${API}/api/super/analytics/payments-by-status`, { headers }),
    ])
      .then(([bookingsRes, paymentsRes]) => {
        setBookingsByStatus(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setPaymentsByStatus(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      })
      .catch(() => {
        setBookingsByStatus([]);
        setPaymentsByStatus([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const userLabels = ['Turf Managers/Staff', 'App Users', 'Super Admins'];
  const userSeries = [
    Number(userTotals?.total_admins ?? 0),
    Number(userTotals?.total_users ?? 0),
    Number(userTotals?.total_superadmins ?? 0),
  ];

  return (
    <div className="row">
      <PieCard
        title="All Bookings by Status"
        labels={bookingsByStatus.map(r => STATUS_LABELS[r.status] ?? r.status)}
        series={bookingsByStatus.map(r => Number(r.count))}
        loading={loading}
      />
      <PieCard
        title="All Payments by Status"
        labels={paymentsByStatus.map(r => PAYMENT_STATUS_LABELS[r.payment_status] ?? r.payment_status)}
        series={paymentsByStatus.map(r => Number(r.total_amount))}
        loading={loading}
        formatValue={v => `₵${Number(v).toFixed(2)}`}
      />
      <PieCard
        title="System Users"
        labels={userLabels}
        series={userSeries}
        loading={false}
      />
    </div>
  );
}