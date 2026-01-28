const quizId = new URLSearchParams(window.location.search).get("id");
const token = localStorage.getItem("token");

// 🟢 HOST QUIZ
function host() {
  const passcode = document.getElementById("passcode").value;
  const duration = document.getElementById("duration").value;
  const startTime = document.getElementById("startTime").value;

  if (!passcode || !duration || !startTime) {
    alert("Please fill all fields");
    return;
  }

  fetch(`http://localhost:5000/api/quiz/host/${quizId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ passcode, duration, startTime }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("Quiz hosted successfully");
      loadHostHistory(); // 🔄 refresh history
    })
    .catch(() => {
      alert("Failed to host quiz");
    });
}

// 📦 LOAD HOST HISTORY
function loadHostHistory() {
  fetch(`http://localhost:5000/api/quiz/host-history/${quizId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("API error");
      }
      return res.json();
    })
    .then((history) => {
      const list = document.getElementById("historyList");
      list.innerHTML = "";

      // ✅ SAFETY CHECK
      if (!Array.isArray(history) || history.length === 0) {
        list.innerHTML = "<p>No previous hosting history.</p>";
        return;
      }

      history.forEach((h) => {
        list.innerHTML += `
          <div class="host-history-card">
            <p><b>Passcode:</b> ${h.passcode}</p>
            <p><b>Duration:</b> ${h.duration} minutes</p>
            <p><b>Start Time:</b> ${new Date(h.startTime).toLocaleString()}</p>
            <p><b>Hosted At:</b> ${new Date(h.hostedAt).toLocaleString()}</p>
            <button onclick="viewQuiz()">View Quiz Questions</button>
          </div>
        `;
      });
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to load history");
    });
}


// 👀 VIEW QUIZ (READ-ONLY)
function viewQuiz() {
  window.open(`preview-quiz.html?id=${quizId}`, "_blank");
}

// 🚀 LOAD HISTORY ON PAGE LOAD (THIS IS IMPORTANT)
loadHostHistory();
