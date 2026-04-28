(async () => {
  const fetch = require('node-fetch');
  const res = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=aryan.k@srm.edu&password=password123'
  });
  const data = await res.json();
  console.log("LOGIN:", res.status, data);

  const res2 = await fetch('http://localhost:8000/api/v1/students/me/dashboard', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
  const data2 = await res2.json();
  console.log("ME DASHBOARD:", res2.status, data2);
  
  if (data.student_id) {
    const res3 = await fetch(`http://localhost:8000/api/v1/students/${data.student_id}/dashboard`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
    console.log("ID DASHBOARD:", res3.status);
  }
})();
