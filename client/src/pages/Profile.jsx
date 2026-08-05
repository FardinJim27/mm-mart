import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { updatePassword, fetchMe } from '../store/slices/authSlice';

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: user?.name || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || '',
    },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in form.address) {
      setForm({ ...form, address: { ...form.address, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/profile', form);
      dispatch(fetchMe());
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setPasswordLoading(true);
    dispatch(updatePassword({ 
      currentPassword: passwordForm.currentPassword, 
      newPassword: passwordForm.newPassword 
    }))
      .unwrap()
      .then(() => {
        toast.success('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      })
      .catch((err) => toast.error(err || 'Failed to update password'))
      .finally(() => setPasswordLoading(false));
  };

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="avatar-section">
          <div className="avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
            <span className="role-badge">{user?.role}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="field-group">
            <div className="field">
              <label>Street</label>
              <input name="street" value={form.address.street} onChange={handleChange} placeholder="123 Winter Ave" />
            </div>
            <div className="field">
              <label>City</label>
              <input name="city" value={form.address.city} onChange={handleChange} placeholder="Frostville" />
            </div>
            <div className="field">
              <label>State</label>
              <input name="state" value={form.address.state} onChange={handleChange} placeholder="NY" />
            </div>
            <div className="field">
              <label>ZIP</label>
              <input name="zip" value={form.address.zip} onChange={handleChange} placeholder="10001" />
            </div>
            <div className="field">
              <label>Country</label>
              <input name="country" value={form.address.country} onChange={handleChange} placeholder="US" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="profile-card">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="profile-form">
          <div className="field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>
          
          <div className="field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
          </div>
          
          <div className="field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
