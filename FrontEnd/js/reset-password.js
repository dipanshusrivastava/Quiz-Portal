function resetPassword() {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    alert("Invalid or missing reset token");
    return;
  }

  if (!password || !confirmPassword) {
    alert("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  fetch("http://localhost:5000/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      newPassword: password,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Password reset successful");
      window.location.href = "./login.html";
    })
    .catch(() => {
      alert("Reset failed. Try again.");
    });
}
