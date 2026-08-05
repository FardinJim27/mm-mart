import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { FiHeart, FiShoppingCart, FiStar, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { deleteProduct } from '../store/slices/productSlice';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const wishlist = useSelector((s) => s.wishlist.items);
  const isWishlisted = wishlist.some(
    (w) => (w._id || w) === product._id
  );

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to use wishlist'); return; }
    dispatch(toggleWishlist(product._id));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  const image = product.images?.[0]?.url || 'https://placehold.co/400x500/1a1a2e/white?text=No+Image';

  const handleDelete = (e) => {
    e.preventDefault();
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
          })
          .catch((err) => toast.error(err || 'Failed to delete product'));
      }
    });
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image-wrap">
        <img src={image} alt={product.name} loading="lazy" />
        <button
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <FiHeart />
        </button>
        {user?.role === 'admin' && (
          <>
            <button
              className="delete-btn"
              style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              onClick={handleDelete}
              aria-label="Delete product"
            >
              <FiTrash2 />
            </button>
            <button
              className="edit-btn"
              style={{ position: 'absolute', top: '50px', left: '10px', background: 'rgba(56,189,248,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              onClick={(e) => { e.preventDefault(); navigate(`/admin/products/${product._id}/edit`); }}
              aria-label="Edit product"
            >
              <FiEdit2 />
            </button>
          </>
        )}
        {product.stock === 0 && <span className="out-of-stock-badge">OUT OF STOCK</span>}
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <FiStar />
          <span>{product.rating?.toFixed(1) || '0.0'}</span>
          <span className="review-count">({product.numReviews})</span>
        </div>
        <div className="product-footer">
          <div className="product-price">
            {product.discountPrice > 0 && (
              <span className="original-price">৳{product.price}</span>
            )}
            <span className="price">৳{product.discountPrice > 0 ? product.discountPrice : product.price}</span>
          </div>
          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart} 
            aria-label="Add to cart"
            disabled={product.stock === 0}
            style={{ opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </Link>
  );
}
