import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { updatePassword, fetchMe } from '../store/slices/authSlice';

// Validates BD phone: 01XXXXXXXXX (11 digits) or +8801XXXXXXXXX (13 digits with country code)
const BD_PHONE_REGEX = /^(\+?880)?01[3-9]\d{8}$/;

function validatePhone(phone) {
  if (!phone) return null; // optional field
  const cleaned = phone.replace(/\s+/g, '');
  return BD_PHONE_REGEX.test(cleaned) ? null : 'Enter a valid BD number (e.g. 01712345678 or +8801712345678)';
}

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || '',
    },
  });

  const [phoneError, setPhoneError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync form whenever the Redux user updates (e.g. after a successful save)
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zip: user.address?.zip || '',
        country: user.address?.country || '',
      },
    });
    setPhoneError(null);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setForm({ ...form, phone: value });
      setPhoneError(validatePhone(value));
    } else if (name in form.address) {
      setForm({ ...form, address: { ...form.address, [name]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/profile', {
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      await dispatch(fetchMe());
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
      newPassword: passwordForm.newPassword,
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
          {/* Name */}
          <div className="field">
            <label htmlFor="profile-name">Name</label>
            <input id="profile-name" name="name" value={form.name} onChange={handleChange} />
          </div>

          {/* Phone */}
          <div className="field">
            <label htmlFor="profile-phone">
              Phone
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                (BD number, optional)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', fontSize: '0.875rem', pointerEvents: 'none',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                🇧🇩
              </span>
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="01712345678"
                style={{ paddingLeft: '2.5rem' }}
                maxLength={14}
              />
            </div>
            {phoneError && (
              <span style={{ fontSize: '0.8rem', color: 'var(--error, #ef4444)', marginTop: '0.25rem', display: 'block' }}>
                {phoneError}
              </span>
            )}
          </div>

          {/* Address */}
          <div className="field-group">
            <div className="field">
              <label>Street</label>
              <input name="street" value={form.address.street} onChange={handleChange} placeholder="123 Main Rd" />
            </div>
            <div className="field">
              <label>City</label>
              <input name="city" value={form.address.city} onChange={handleChange} placeholder="Dhaka" />
            </div>
            <div className="field">
              <label>State / District</label>
              <input name="state" value={form.address.state} onChange={handleChange} placeholder="Dhaka" />
            </div>
            <div className="field">
              <label>ZIP / Postal</label>
              <input name="zip" value={form.address.zip} onChange={handleChange} placeholder="1200" />
            </div>
            <div className="field">
              <label>Country</label>
              <input name="country" value={form.address.country} onChange={handleChange} placeholder="Bangladesh" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !!phoneError}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
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
