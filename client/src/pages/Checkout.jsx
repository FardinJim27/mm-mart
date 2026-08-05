import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { clearCart } from '../store/slices/cartSlice';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector((s) => s.cart);
  const items = cart?.items || [];

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const itemsPrice = items.reduce((acc, i) => {
    const price = i.product?.discountPrice > 0 ? i.product.discountPrice : i.product?.price || 0;
    return acc + price * i.quantity;
  }, 0);
  const shippingPrice = itemsPrice > 99 ? 0 : 9.99;
  const taxPrice = 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems = items.map((i) => ({
        product: i.product._id,
        name: i.product.name,
        image: i.product.images?.[0]?.url || '',
        price: i.product.discountPrice > 0 ? i.product.discountPrice : i.product.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      }));

      await api.post('/orders', {
        items: orderItems,
        shippingAddress,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      });

      dispatch(clearCart());
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h3>Shipping Address</h3>
          <form onSubmit={handlePlaceOrder} className="auth-form" style={{ maxWidth: '100%', padding: '2rem', background: 'var(--surface)', borderRadius: '12px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={shippingAddress.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input type="text" name="street" value={shippingAddress.street} onChange={handleChange} required />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>City</label>
                <input type="text" name="city" value={shippingAddress.city} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>State/Province</label>
                <input type="text" name="state" value={shippingAddress.state} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>ZIP / Postal Code</label>
                <input type="text" name="zip" value={shippingAddress.zip} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Country</label>
                <input type="text" name="country" value={shippingAddress.country} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={shippingAddress.phone} onChange={handleChange} required />
            </div>
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}
            </button>
          </form>
        </div>
        
        <div className="cart-summary" style={{ height: 'fit-content', position: 'sticky', top: '2rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3>Order Summary</h3>
          <div style={{ margin: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            {items.map(i => (
              <div key={i._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#ccc', paddingRight: '1rem' }}>{i.quantity}x {i.product.name}</span>
                <span>৳{(i.quantity * (i.product.discountPrice > 0 ? i.product.discountPrice : i.product.price)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><span>৳{itemsPrice.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shippingPrice === 0 ? 'Free' : `৳${shippingPrice}`}</span></div>
          <div className="summary-row total"><span>Total</span><span>৳{totalPrice.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
