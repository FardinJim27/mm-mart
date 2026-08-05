import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders')
      .then((res) => setOrders(res.data.orders))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading && orders.length === 0) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to="/admin" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: '0.5rem' }}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1>Manage Orders</h1>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>#{o._id.slice(-8).toUpperCase()}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o.user?.name || o.shippingAddress?.fullName}</td>
                <td>৳{o.totalPrice?.toFixed(2)}</td>
                <td>{o.isPaid ? 'Paid' : 'Unpaid'}</td>
                <td>
                  <span className={`status-badge ${o.status}`}>{o.status}</span>
                </td>
                <td>
                  <select 
                    value={o.status}
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>No orders found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
