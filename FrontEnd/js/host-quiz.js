const quizId = new URLSearchParams(window.location.search).get("id");
const token = localStorage.getItem("token");

function host() {
  const passcode = document.getElementById("passcode").value;
  const duration = document.getElementById("duration").value;
  const startTime = document.getElementById("startTime").value;

  fetch(`http://localhost:5000/api/quiz/host/${quizId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ passcode, duration, startTime }),
  })
  .then(res => res.json())
  .then(() => {
    alert("Quiz is now LIVE");
    window.location.href = "dashboard.html";
  });
}
