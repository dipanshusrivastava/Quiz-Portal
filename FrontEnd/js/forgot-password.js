function forgotPassword() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  fetch("http://localhost:5000/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("If this email exists, a reset link has been sent.");
    })
    .catch(() => {
      alert("Something went wrong. Try again later.");
    });
}
