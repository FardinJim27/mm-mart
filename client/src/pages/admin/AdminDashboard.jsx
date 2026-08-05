import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FiPackage, FiUsers, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, revenue: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/users'),
      api.get('/products'),
    ]).then(([ordersRes, usersRes, productsRes]) => {
      const allOrders = ordersRes.data.orders;
      setOrders(allOrders.slice(0, 5));
      setStats({
        orders: allOrders.length,
        users: usersRes.data.users.length,
        products: productsRes.data.total,
        revenue: allOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Revenue (৳)',
      data: [1200, 1900, 3000, 2500, 2800, 3500, stats.revenue > 0 ? stats.revenue : 4200],
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderRadius: 6,
    }],
  };

  const statCards = [
    { icon: <FiDollarSign />, label: 'Revenue', value: `৳${stats.revenue.toFixed(2)}`, color: '#6366f1' },
    { icon: <FiPackage />, label: 'Orders', value: stats.orders, color: '#f59e0b' },
    { icon: <FiShoppingBag />, label: 'Products', value: stats.products, color: '#10b981' },
    { icon: <FiUsers />, label: 'Users', value: stats.users, color: '#3b82f6' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <Link to="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
          <Link to="/admin/orders" className="btn btn-ghost">Manage Orders</Link>
        </div>
      </div>

      <div className="stat-cards">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card" style={{ borderColor: s.color }}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div>
              <h3>{loading ? '…' : s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="chart-card">
          <h3>Revenue Overview</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        <div className="recent-orders">
          <h3>Recent Orders</h3>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>#{o._id.slice(-8).toUpperCase()}</td>
                  <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                  <td>৳{o.totalPrice?.toFixed(2)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={3}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
