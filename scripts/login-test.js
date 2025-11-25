(async () => {
  const base = 'http://localhost:3001';
  const email = 'test-block@example.com';
  const correct = 'correct123';
  const wrong = 'wrongpass';
  const headers = { 'Content-Type': 'application/json' };

  try {
    console.log('Registering user (if not exists)...');
    const r = await fetch(base + '/register', { method: 'POST', headers, body: JSON.stringify({ email, password: correct }) });
    console.log('Register status', r.status);
    try { console.log(await r.json()); } catch (e) {}
  } catch (e) {
    console.log('Register error (ignored):', e.message);
  }

  for (let i = 1; i <= 5; i++) {
    const res = await fetch(base + '/login', { method: 'POST', headers, body: JSON.stringify({ email, password: wrong }) });
    const text = await res.text();
    console.log(`#${i} Wrong login => status=${res.status}, body=${text}`);
  }

  // Now try correct password
  const resOk = await fetch(base + '/login', { method: 'POST', headers, body: JSON.stringify({ email, password: correct }) });
  const bodyOk = await resOk.text();
  console.log('Correct login after failures => status=', resOk.status, ', body=', bodyOk);
})();
