const API = "http://localhost:5000/api";

function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  // Required fields check
  if (!name || !email || !password || !role) {
    alert("Please enter all fields");
    return;
  }

  // Level-1 email format validation (frontend)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address");
    return;
  }

  fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      role,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Signup successful");
      // window.location.href = "../index.html";
    })
    .catch(() => {
      alert("Signup failed");
    });
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
