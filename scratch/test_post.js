async function test() {
  try {
    const res = await fetch('https://saudistock-j5buj1o07-arbabalfadhaas-projects.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test New User',
        email: 'test_new_register@example.com',
        password: 'password123'
      })
    });
    console.log('Status:', res.status);
    console.log('Response Body:', await res.text());
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
test();
