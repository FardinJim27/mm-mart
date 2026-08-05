import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Footer() {
  const { items: categories } = useSelector((state) => state.categories);
  const wishlist = useSelector((state) => state.wishlist.items);
  const wishlistCount = wishlist.length;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand">👔 MM MART</span>
          <p>Premium fashion crafted for effortless elegance, all year round.</p>
        </div>
        <div className="footer-links">
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          {categories.slice(0, 4).map(cat => (
            <Link key={cat} to={`/products?category=${cat}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
        </div>
        <div className="footer-links">
          <h4>Account</h4>
          <Link to="/profile">My Profile</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/wishlist">Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MM FASHION. All rights reserved.</p>
      </div>
    </footer>
  );
}
