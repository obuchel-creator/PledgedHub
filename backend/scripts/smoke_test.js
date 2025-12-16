(async()=>{
  const http = require('http');
  function request(opts, body) {
    return new Promise((resolve, reject) => {
      const req = http.request(opts, res => {
        let s = '';
        res.on('data', c => s += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(s) }); }
          catch (e) { resolve({ status: res.statusCode, body: s }); }
        });
      });
      req.on('error', e => reject(e));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  const base = '127.0.0.1'; const port = process.env.PORT || 5002;

  try {
    const r = await request({ hostname: base, port, path: '/auth', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'smoke@example.com', password: 'password123', name: 'Smoke Tester' });
    console.log('REGISTER', r.status, JSON.stringify(r.body));

    const login = await request({ hostname: base, port, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { identifier: 'smoke@example.com', password: 'password123' });
    console.log('LOGIN', login.status, JSON.stringify(login.body));

    const pledge = await request({ hostname: base, port, path: '/pledges', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { title: 'Smoke Pledge', name: 'Smoke Pledge', goal: 200, amount: 50 });
    console.log('PLEDGE', pledge.status, JSON.stringify(pledge.body));

    const all = await request({ hostname: base, port, path: '/pledges', method: 'GET', headers: { 'Content-Type': 'application/json' } });
    console.log('ALL PLEDGES', all.status, (Array.isArray(all.body) ? all.body.length : JSON.stringify(all.body)));

    let pledgeId = null;
    if (pledge.body) {
      if (pledge.body.id) pledgeId = pledge.body.id;
      else if (pledge.body.pledge && pledge.body.pledge.id) pledgeId = pledge.body.pledge.id;
    }
    if (!pledgeId && Array.isArray(all.body) && all.body.length) pledgeId = all.body[0].id || all.body[0]._id;

    if (pledgeId) {
      const userId = login.body && login.body.user ? login.body.user.id : 1;
      const pay = await request({ hostname: base, port, path: '/payments', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { userId, pledgeId, amount: 10, paymentMethod: 'manual' });
      console.log('PAY', pay.status, JSON.stringify(pay.body));
    } else {
      console.log('NO PLEDGE ID');
    }
  } catch (e) {
    console.error('ERR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
