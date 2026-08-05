import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((s) => s.auth);
  return user ? children : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }) => {
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user?.role === 'admin') {
      const eventSource = new EventSource('/api/orders/notifications', { withCredentials: true });
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          toast.info(`🛒 New order placed! Total: ৳${data.total?.toFixed(2)}`, {
            autoClose: 10000,
            position: 'top-right'
          });
        } catch (err) {}
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
