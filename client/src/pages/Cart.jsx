import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../store/slices/cartSlice';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Cart() {
  const dispatch = useDispatch();
  const { cart, loading } = useSelector((s) => s.cart);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, i) => {
    const price = i.product?.discountPrice > 0 ? i.product.discountPrice : i.product?.price || 0;
    return acc + price * i.quantity;
  }, 0);
  const shipping = subtotal > 99 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const handleClearCart = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clear it!"
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(clearCart());
        Swal.fire({
          title: "Cleared!",
          text: "Your cart has been cleared.",
          icon: "success"
        });
      }
    });
  };

  return (
    <div className="cart-page">
      <h1>Your Cart {items.length > 0 && <span className="badge-count">({items.length})</span>}</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <FiShoppingBag size={64} />
          <h3>Your cart is empty</h3>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => {
              const product = item.product;
              const image = product?.images?.[0]?.url || 'https://placehold.co/100x120/1a1a2e/white?text=?';
              const price = product?.discountPrice > 0 ? product.discountPrice : product?.price || 0;
              return (
                <div key={item._id} className="cart-item">
                  <img src={image} alt={product?.name} />
                  <div className="cart-item-info">
                    <h4>{product?.name}</h4>
                    {item.size && <span className="meta">Size: {item.size}</span>}
                    {item.color && <span className="meta">Color: {item.color}</span>}
                    <span className="item-price">৳{price}</span>
                  </div>
                  <div className="cart-qty">
                    <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}><FiMinus /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}><FiPlus /></button>
                  </div>
                  <span className="cart-item-total">৳{(price * item.quantity).toFixed(2)}</span>
                  <button className="remove-btn" onClick={() => dispatch(removeFromCart(item._id))}><FiTrash2 /></button>
                </div>
              );
            })}
            <button className="btn btn-ghost" onClick={handleClearCart}>Clear Cart</button>
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `৳${shipping}`}</span></div>
            <div className="summary-row total"><span>Total</span><span>৳{total.toFixed(2)}</span></div>
            <Link to="/checkout" className="btn btn-primary btn-block">Proceed to Checkout</Link>
            <Link to="/products" className="btn btn-ghost btn-block">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
