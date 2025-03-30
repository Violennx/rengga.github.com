const backendURL = "https://rengga-github-com.vercel.app/";

document.querySelector('#submitBtn').addEventListener('click', () => {
  const code = document.querySelector('#redeemCode').value; // Ambil input dari pengguna
  fetch(`${backendURL}/api/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code }) // Kirim kode ke backend
  })
    .then(response => response.json())
    .then(data => alert(data.message)) // Tampilkan respon ke pengguna
    .catch(error => console.error('Error:', error));
});