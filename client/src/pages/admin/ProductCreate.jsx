import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft, FiUploadCloud, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { addCategory, removeCategory, editCategory } from '../../store/slices/categorySlice';
import Swal from 'sweetalert2';

export default function ProductCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  
  const { items: categories } = useSelector((state) => state.categories);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'jackets',
    brand: '',
    stock: '',
    sizes: [],
    colors: '',
    imageUrl: '',
  });

  const availableSizes = form.category?.toLowerCase() === 'footwear'
    ? Array.from({ length: 10 }, (_, i) => String(36 + i))
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    if (categories.length > 0 && !form.category && !id) {
      setForm((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories, form.category, id]);

  useEffect(() => {
    if (id) {
      setFetching(true);
      api.get(`/products/${id}`)
        .then(res => {
          const p = res.data.product;
          setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price || '',
            discountPrice: p.discountPrice || '',
            category: p.category || '',
            brand: p.brand || '',
            stock: p.stock || 0,
            sizes: p.sizes || [],
            colors: p.colors ? p.colors.join(', ') : '',
            imageUrl: p.images?.[0]?.url || '',
          });
        })
        .catch(err => {
          toast.error('Failed to fetch product details');
          navigate('/admin');
        })
        .finally(() => setFetching(false));
    }
  }, [id, navigate]);

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    dispatch(addCategory(newCat.trim()))
      .unwrap()
      .then((name) => {
        setForm(prev => ({ ...prev, category: name }));
        setNewCat('');
        toast.success('Category added');
      })
      .catch((err) => toast.error(err || 'Failed to add category'));
  };

  const handleEditCategory = () => {
    if (!form.category || !editCatName.trim()) return;
    if (form.category === editCatName.trim()) {
      setIsEditingCat(false);
      return;
    }
    
    dispatch(editCategory({ oldName: form.category, newName: editCatName.trim() }))
      .unwrap()
      .then((res) => {
        setForm(prev => ({ ...prev, category: res.newName }));
        setIsEditingCat(false);
        toast.success('Category updated');
      })
      .catch(err => {
        toast.error(err || 'Failed to update category');
      });
  };

  const handleDeleteCategory = () => {
    if (!form.category) return;
    
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeCategory(form.category))
          .unwrap()
          .then(() => {
            setForm(prev => ({ ...prev, category: categories.length > 1 ? categories.find(c => c !== form.category) : '' }));
            Swal.fire({
              title: "Deleted!",
              text: "The category has been deleted.",
              icon: "success"
            });
          })
          .catch((err) => toast.error(err));
      }
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSizeToggle = (size) => {
    setForm((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setForm((prev) => ({ ...prev, imageUrl: res.data }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Image upload failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
        category: form.category,
        brand: form.brand,
        stock: Number(form.stock),
        sizes: form.sizes,
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        images: form.imageUrl ? [{ url: form.imageUrl, publicId: '' }] : [],
      };

      if (id) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product added successfully!');
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${id ? 'update' : 'add'} product`);
      toast.error(`Failed to ${id ? 'update' : 'add'} product`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="admin-page"><div className="spinner" style={{margin: 'auto'}}></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{id ? 'Edit Product' : 'Add New Product'}</h1>
        <button onClick={() => navigate('/admin')} className="btn btn-ghost">
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>

      <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px' }}>
        <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '100%' }}>
          {error && <div className="error-banner">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            
            <div className="field">
              <label htmlFor="brand">Brand</label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={form.brand}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="field">
              <label htmlFor="price">Price (৳)</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="field">
              <label htmlFor="discountPrice">Discount Price (৳) (Optional)</label>
              <input
                id="discountPrice"
                name="discountPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {isEditingCat ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                    <button type="button" onClick={handleEditCategory} title="Save category" style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--success)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <FiCheck />
                    </button>
                    <button type="button" onClick={() => setIsEditingCat(false)} title="Cancel edit" style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--text-secondary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      id="category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => { setEditCatName(form.category); setIsEditingCat(true); }} title="Edit selected category" style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <FiEdit2 />
                    </button>
                    <button type="button" onClick={handleDeleteCategory} title="Delete selected category" style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--error)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <FiTrash2 />
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="New category"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <button type="button" onClick={handleAddCategory} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FiPlus /> Add
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="stock">Stock Quantity</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', resize: 'vertical' }}
            />
          </div>

          <div className="field" style={{ marginTop: '1rem' }}>
            <label>Product Image</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{ 
                border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border)', 
                borderRadius: '8px', 
                padding: '2rem', 
                textAlign: 'center',
                background: isDragging ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-primary)',
                transition: 'all 0.3s ease'
              }}
            >
              {form.imageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={form.imageUrl.startsWith('http') ? form.imageUrl : `http://localhost:5000${form.imageUrl}`} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                  <button type="button" onClick={() => setForm({...form, imageUrl: ''})} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <FiUploadCloud size={48} color="var(--text-secondary)" />
                  <div>
                    <p style={{ margin: '0 0 0.5rem' }}>Drag and drop an image here</p>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>or</p>
                    <label style={{ cursor: 'pointer', background: 'var(--accent)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block' }}>
                      Browse Files
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Alternatively, paste an image URL:</span>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={handleChange}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="colors">Colors (comma separated)</label>
            <input
              id="colors"
              name="colors"
              type="text"
              placeholder="Black, Navy, Olive"
              value={form.colors}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>

          <div className="field" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              Sizes
              {form.category?.toLowerCase() === 'footwear' && <span style={{fontSize: '0.8rem', color: '#888', fontWeight: 'normal', marginLeft: '0.5rem'}}>(European Shoe Sizes)</span>}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {availableSizes.map((size) => (
                <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={form.sizes.includes(size)}
                    onChange={() => handleSizeToggle(size)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
            style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiSave /> {loading ? 'Saving...' : (id ? 'Update Product' : 'Save Product')}
          </button>
        </form>
      </div>
    </div>
  );
}
