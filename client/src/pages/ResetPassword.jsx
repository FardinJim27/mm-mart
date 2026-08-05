import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { FiLock } from 'react-icons/fi';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Please fill in all fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    dispatch(resetPassword({ token, password }))
      .unwrap()
      .then((res) => {
        toast.success(res.message || 'Password reset successful');
        navigate('/');
      })
      .catch((err) => {
        toast.error(err || 'Failed to reset password');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="password">New Password</label>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
