import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import { fetchCategories, addCategory, removeCategory, editCategory } from '../../store/slices/categorySlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function AdminCategories() {
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector((state) => state.categories);

  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    dispatch(addCategory(newCat.trim()))
      .unwrap()
      .then(() => {
        setNewCat('');
        toast.success('Category added');
      })
      .catch(err => toast.error(err || 'Failed to add category'));
  };

  const handleEditCategory = (oldName) => {
    if (!editCatName.trim()) return;
    if (oldName === editCatName.trim()) {
      setEditingCat(null);
      return;
    }
    
    dispatch(editCategory({ oldName, newName: editCatName.trim() }))
      .unwrap()
      .then(() => {
        setEditingCat(null);
        toast.success('Category updated');
      })
      .catch(err => {
        toast.error(err || 'Failed to update category');
      });
  };

  const handleDeleteCategory = (name) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! Products in this category might be affected.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeCategory(name))
          .unwrap()
          .then(() => {
            Swal.fire('Deleted!', 'The category has been deleted.', 'success');
          })
          .catch((err) => {
            toast.error(err || 'Failed to delete category');
          });
      }
    });
  };

  return (
    <div className="admin-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/admin" className="btn btn-ghost" style={{ padding: '0.5rem' }}>
            <FiArrowLeft size={20} />
          </Link>
          <h1>Manage Categories</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Category</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="New category name"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <button 
            type="button" 
            onClick={handleAddCategory} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <FiPlus /> Add
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Existing Categories</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categories.map((cat) => (
              <div 
                key={cat} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)'
                }}
              >
                {editingCat === cat ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1, marginRight: '1rem' }}>
                    <input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                      autoFocus
                    />
                    <button 
                      onClick={() => handleEditCategory(cat)}
                      style={{ padding: '0.5rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <FiCheck />
                    </button>
                    <button 
                      onClick={() => setEditingCat(null)}
                      style={{ padding: '0.5rem', background: 'var(--text-secondary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                    {cat}
                  </span>
                )}
                
                {editingCat !== cat && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => { setEditingCat(cat); setEditCatName(cat); }}
                      style={{ padding: '0.5rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      style={{ padding: '0.5rem', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && <p>No categories found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
