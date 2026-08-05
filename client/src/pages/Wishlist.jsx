import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, toggleWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <FiHeart size={64} />
          <h3>Your wishlist is empty</h3>
          <Link to="/products" className="btn btn-primary">Discover Products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {items.map((product) => {
            const image = product.images?.[0]?.url || 'https://placehold.co/400x500/1a1a2e/white?text=No+Image';
            const price = product.discountPrice > 0 ? product.discountPrice : product.price;
            return (
              <div key={product._id} className="product-card">
                <Link to={`/products/${product._id}`} className="product-image-wrap">
                  <img src={image} alt={product.name} loading="lazy" />
                </Link>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-footer">
                    <span className="price">৳{price}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="add-to-cart-btn" onClick={() => {
                        dispatch(addToCart({ productId: product._id, quantity: 1 }));
                        toast.success('Added to cart!');
                      }}><FiShoppingCart /></button>
                      <button className="wishlist-btn active" onClick={() => dispatch(toggleWishlist(product._id))}><FiHeart /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
