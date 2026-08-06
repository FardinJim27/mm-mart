import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/ProductCard';
import { FiFilter, FiX } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Products() {
  const dispatch = useDispatch();
  const { items: CATEGORIES } = useSelector((s) => s.categories);
  const { items, loading, total, pages } = useSelector((s) => s.products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const keyword = searchParams.get('keyword') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    dispatch(fetchProducts({ category, sort, keyword, page }));
  }, [dispatch, category, sort, keyword, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="products-page">
      {/* Search / Toolbar */}
      <div className="products-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search products…"
          defaultValue={keyword}
          onKeyDown={(e) => e.key === 'Enter' && setParam('keyword', e.target.value)}
        />
        <select className="sort-select" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="filter-toggle" onClick={() => setShowFilter(!showFilter)}>
          <FiFilter /> Filters
        </button>
      </div>

      <div className="products-layout">
        {/* Sidebar */}
        <aside className={`products-sidebar ${showFilter ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button onClick={() => setShowFilter(false)}><FiX /></button>
          </div>
          <div className="filter-group">
            <h4>Category</h4>
            <button
              className={`filter-chip ${!category ? 'active' : ''}`}
              onClick={() => setParam('category', '')}
            >All</button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`filter-chip ${category === c ? 'active' : ''}`}
                onClick={() => setParam('category', c)}
              >
                {c}
              </button>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <main>
          <p className="result-count">{total} products found</p>
          {loading ? (
            <div className="products-grid">
              {[...Array(12)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="products-grid">
                {items.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination">
                  {[...Array(pages)].map((_, i) => (
                    <button
                      key={i}
                      className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                      onClick={() => setParam('page', i + 1)}
                    >{i + 1}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">No products found.</div>
          )}
        </main>
      </div>
    </div>
  );
}
