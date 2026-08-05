import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const cart = useSelector((s) => s.cart.cart);
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out!');
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          👔 MM MART
        </Link>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            </li>
          ))}
          {user?.role === 'admin' && (
            <li>
              <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                Admin
              </NavLink>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          {user && (
            <>
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                <FiHeart />
              </Link>
              <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
                <FiShoppingCart />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
              <Link to="/profile" className="icon-btn" aria-label="Profile">
                <FiUser />
              </Link>
              <button className="icon-btn" onClick={handleLogout} aria-label="Logout">
                <FiLogOut />
              </button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
