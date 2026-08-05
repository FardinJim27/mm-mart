const run = async () => {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fardinjim77@gmail.com', password: 'admin123' })
    });
    const cookie = loginRes.headers.get('set-cookie');
    console.log('Login successful');
    
    // 2. Fetch products
    const fetchRes = await fetch('http://localhost:5000/api/products');
    const fetchData = await fetchRes.json();
    let products = fetchData.products;
    console.log('Initial products count:', products.length);
    const prodId = products[0]._id;
    
    // 3. Update the product
    await fetch(`http://localhost:5000/api/products/${prodId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ name: 'Updated Name by Script' })
    });
    console.log('Product updated via API');
    
    // 4. Fetch products again
    const fetchRes2 = await fetch('http://localhost:5000/api/products');
    const fetchData2 = await fetchRes2.json();
    console.log('Name after update:', fetchData2.products.find(p => p._id === prodId).name);
    
    // 5. Create a new product
    const createRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ name: 'New Product', description: 'Test', price: 99, category: 'jackets' })
    });
    const createData = await createRes.json();
    console.log('Product created via API, ID:', createData.product._id);
    
    // 6. Fetch products again
    const fetchRes3 = await fetch('http://localhost:5000/api/products');
    const fetchData3 = await fetchRes3.json();
    console.log('Products count after create:', fetchData3.products.length);
    
    // 7. Delete the created product
    await fetch(`http://localhost:5000/api/products/${createData.product._id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookie }
    });
    console.log('Product deleted via API');
    
    // 8. Fetch products again
    const fetchRes4 = await fetch('http://localhost:5000/api/products');
    const fetchData4 = await fetchRes4.json();
    console.log('Products count after delete:', fetchData4.products.length);
    
  } catch (err) {
    console.error('Error:', err);
  }
};
run();
