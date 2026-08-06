import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { FiArrowRight } from 'react-icons/fi';

export default function Home() {
  const dispatch = useDispatch();
  const { items: CATEGORIES } = useSelector((s) => s.categories);
  const { items, loading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 8, sort: 'newest' }));
  }, [dispatch]);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag"> Elevate Your Everyday</span>
          <h1>Timeless <span className="gradient-text">Style</span>, Uncompromising <span className="gradient-text">Quality.</span></h1>
          <p>Premium fashion crafted for effortless elegance, all year round. Discover our curated collection of seasonal essentials and timeless pieces.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop Now <FiArrowRight />
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">500+</span><span>Products</span></div>
            <div className="stat"><span className="stat-num">10k+</span><span>Customers</span></div>
            <div className="stat"><span className="stat-num">4.9★</span><span>Rating</span></div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`} className="category-card">
              <span className="category-label">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/products" className="view-all">View All <FiArrowRight /></Link>
        </div>
        {loading ? (
          <div className="loading-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : (
          <div className="products-grid">
            {items.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="empty-state">
            <p>No products yet. <Link to="/admin/products/new">Add your first product →</Link></p>
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="section promo-banner">
        <div className="promo-content">
          <h2>Free Shipping on Orders Over ৳99</h2>
          <p>Limited time winter offer — shop now and stay warm!</p>
          <Link to="/products" className="btn btn-primary">Explore Collection</Link>
        </div>
      </section>
    </div>
  );
}
