const run = async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fardinjim77@gmail.com', password: 'admin123' })
    });
    const cookie = loginRes.headers.get('set-cookie');
    
    const p1 = fetch('http://localhost:5000/api/orders', { headers: { Cookie: cookie } });
    const p2 = fetch('http://localhost:5000/api/users', { headers: { Cookie: cookie } });
    const p3 = fetch('http://localhost:5000/api/products');
    
    const [ordersRes, usersRes, productsRes] = await Promise.all([p1, p2, p3]);
    
    console.log('Orders status:', ordersRes.status);
    if (!ordersRes.ok) console.log(await ordersRes.text());
    console.log('Users status:', usersRes.status);
    if (!usersRes.ok) console.log(await usersRes.text());
    console.log('Products status:', productsRes.status);
  } catch(e) {
    console.error(e);
  }
};
run();
