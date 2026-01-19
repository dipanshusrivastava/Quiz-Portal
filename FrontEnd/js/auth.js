const API = "http://localhost:5000/api";


function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name, // ✅ must be here
      email,
      password,
      role,
    }),
  });
  window.location.href = "../index.html";
}

function login() {
  if (!email.value || !password.value) {
    alert("Please enter email and password");
    return;
  }

  fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.token) {
        alert("Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      window.location.href = "./dashboard.html";
    });
}
