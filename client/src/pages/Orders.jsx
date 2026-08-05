import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Orders() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders/my')
      .then((r) => setOrders(r.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const STATUS_COLORS = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <button className="btn btn-primary" onClick={() => navigate('/products')}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="order-status" style={{ color: STATUS_COLORS[order.status] || '#fff' }}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="order-items-preview">
                {order.items.slice(0, 3).map((item, i) => (
                  <span key={i}>{item.name} × {item.quantity}</span>
                ))}
                {order.items.length > 3 && <span>+{order.items.length - 3} more</span>}
              </div>
              <div className="order-footer">
                <span className="order-total">Total: <strong>৳{order.totalPrice?.toFixed(2)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
