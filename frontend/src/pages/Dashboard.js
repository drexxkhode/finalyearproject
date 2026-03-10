import { useState, useEffect } from 'react';
import axios from 'axios';
import Analytics from '../components/Analytics';
const  API = process.env.REACT_APP_URL;
const Dashboard = () => {
const [total, setTotal] = useState({});

const getTotal = async () =>{
  try {
  const res = await axios.get(`${API}/api/admin/total`,{
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": 'application/json'
}
});
setTotal(res.data);
} catch (err) {
  console.log(err.res?.data?.message || "Could not fetch dashboard total data");
}
};

useEffect(()=>{
getTotal();
},[]);

  return (
    <>
      <div className="row gx-3">
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-calendar-check fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total Bookings</h5>
                <h3 className="m-0 text-primary">{total.total_bookings}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-cash-stack fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total Payments</h5>
                <h3 className="m-0 text-primary">{total.total_payments}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-people fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total Users</h5>
                <h3 className="m-0 text-primary">{total.total_admins}</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 col-12">
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-2">
                <i className="bi bi-chat fs-1 text-primary lh-1"></i>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="m-0 text-secondary fw-normal">Total Enquiries</h5>
                <h3 className="m-0 text-primary">{total.total_enquiries}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Row end */}

      {/* Row start */}
      <div className="row gx-3">
        <div className="col-xxl-12">
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title">Statistics</h5>
            </div>
            <div className="card-body">
              {/* Visitors & Sales Charts */}
              <div className="row gx-3 mb-3">
                <div className="col-lg-12 col-sm-12 mb-3">
                  <h6 className="text-center mb-3">Overview</h6>
                <Analytics />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
