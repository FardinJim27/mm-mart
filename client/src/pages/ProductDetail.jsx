import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById, deleteProduct, updateProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { FiHeart, FiShoppingCart, FiStar, FiArrowLeft, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const wishlist = useSelector((s) => s.wishlist.items);
  const isWishlisted = wishlist.some((w) => (w._id || w) === id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [adminStock, setAdminStock] = useState(0);

  useEffect(() => {
    if (product && product.stock !== undefined) {
      setAdminStock(product.stock);
    }
  }, [product]);

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!product) return <div className="empty-state">Product not found.</div>;

  const image = product.images?.[selectedImage]?.url || 'https://placehold.co/600x700/1a1a2e/white?text=No+Image';

  const handleAddToCart = () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, quantity: qty, size: selectedSize, color: selectedColor }));
    toast.success('Added to cart!');
  };

  const handleDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this product deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProduct(product._id))
          .unwrap()
          .then(() => {
            Swal.fire("Deleted!", "Product has been deleted.", "success");
            navigate('/products');
          })
          .catch((err) => toast.error(err || 'Failed to delete product'));
      }
    });
  };

  const handleUpdateStock = (newStock) => {
    dispatch(updateProduct({ id: product._id, data: { stock: newStock } }))
      .unwrap()
      .then(() => toast.success('Stock updated!'))
      .catch((err) => toast.error(err || 'Failed to update stock'));
  };

  return (
    <div className="product-detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ marginBottom: 0 }}><FiArrowLeft /> Back</button>
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => navigate(`/admin/products/${product._id}/edit`)}>
              <FiEdit2 /> Edit Product
            </button>
            <button className="btn btn-outline" style={{ borderColor: 'red', color: 'red' }} onClick={handleDelete}>
              <FiTrash2 /> Delete Product
            </button>
          </div>
        )}
      </div>
      <div className="detail-grid">
        {/* Images */}
        <div className="detail-images">
          <img src={image} alt={product.name} className="main-image" />
          {product.images?.length > 1 && (
            <div className="thumbnails">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className={`thumb ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <FiStar /> {product.rating?.toFixed(1)} ({product.numReviews} reviews)
          </div>
          <div className="detail-price">
            {product.discountPrice > 0 && <span className="original-price">৳{product.price}</span>}
            <span className="price">৳{product.discountPrice > 0 ? product.discountPrice : product.price}</span>
          </div>
          <p className="product-description">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="option-group">
              <h4>Size</h4>
              <div className="option-chips">
                {product.sizes.map((s) => (
                  <button key={s} className={`option-chip ${selectedSize === s ? 'active' : ''}`} onClick={() => setSelectedSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="option-group">
              <h4>Color</h4>
              <div className="option-chips">
                {product.colors.map((c) => (
                  <button key={c} className={`option-chip ${selectedColor === c ? 'active' : ''}`} onClick={() => setSelectedColor(c)}>{c}</button>
                ))}
              </div>
            </div>
          )}

          <div className="qty-row">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span>{qty}</span>
            <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <div className="detail-actions">
            {product.stock === 0 ? (
              <button 
                className={`btn btn-primary btn-lg ${isWishlisted ? 'active' : ''}`}
                onClick={() => { if (!user) { toast.error('Please login'); return; } dispatch(toggleWishlist(product._id)); }}
              >
                <FiHeart /> {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
                  <FiShoppingCart /> Add to Cart
                </button>
                <button
                  className={`btn btn-outline wishlist-action ${isWishlisted ? 'active' : ''}`}
                  onClick={() => { if (!user) { toast.error('Please login'); return; } dispatch(toggleWishlist(product._id)); }}
                >
                  <FiHeart />
                </button>
              </>
            )}
          </div>

          <p className="stock-info">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

          {user?.role === 'admin' && (
            <div className="admin-stock-control" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Admin Stock Control</span>
                <span>{adminStock} items</span>
              </h4>
              <input
                type="range"
                min="0"
                max="500"
                value={adminStock}
                onChange={(e) => setAdminStock(Number(e.target.value))}
                onMouseUp={() => handleUpdateStock(adminStock)}
                onTouchEnd={() => handleUpdateStock(adminStock)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>Drag to manually adjust product stock level.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <section className="reviews-section">
          <h2>Customer Reviews</h2>
          <div className="reviews-list">
            {product.reviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="review-header">
                  <strong>{r.name}</strong>
                  <span className="review-rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
