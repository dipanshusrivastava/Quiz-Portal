const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
}

const userId = getUserIdFromToken();

if (localStorage.getItem(`attempted_${quizId}_user_${userId}`)) {
  alert("You have already attempted this quiz.");
  window.location.href = "./available-quizzes.html";
}
const quizPasscode = sessionStorage.getItem("quizPasscode");
const quizTitle = document.getElementById("quizTitle");
const quizForm = document.getElementById("quizForm");

let hasSubmitted = false;
let timerInterval;
let timeLeft = 0;

let answers = [];

if (!quizId) {
  alert("Invalid quiz link");
  window.location.href = "./available-quizzes.html";
}

// Fetch quiz
fetch(`http://localhost:5000/api/quiz/${quizId}`, {
  headers: {
    "x-passcode": quizPasscode,
  },
})
  .then(async (res) => {
    const data = await res.json();

    // 👇 Quiz not started yet
    if (!res.ok && data.message === "Quiz has not started yet") {
      alert("You are early. The test will start soon.");
      window.location.href = "./available-quizzes.html";
      return;
    }

    if (!res.ok) {
      throw new Error(data.message || "Failed to load quiz");
    }

    return data;
  })
  .then((quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      quizForm.innerHTML = "<p>No questions found in this quiz.</p>";
      return;
    }

    quizTitle.innerText = quiz.title;
    // ✅ GLOBAL TIMER (remaining time only)
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(startTime.getTime() + quiz.duration * 60000);
    const now = new Date();

    let remainingSeconds = Math.floor((endTime - now) / 1000);

    // 🛑 Quiz already expired
    if (remainingSeconds <= 0) {
      alert("Quiz time is already over");
      submitQuiz(); // optional auto-submit or redirect
      return;
    }

    // ▶️ Start timer with remaining time only
    startTimer(remainingSeconds);
    
    quizForm.innerHTML = "";

    quiz.questions.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <p><b>${i + 1}. ${q.question}</b></p>
        ${q.options
          .map(
            (opt, j) => `
          <label>
            <input type="radio" name="q${i}" value="${j}">
            ${opt}
          </label><br>
        `,
          )
          .join("")}
      `;

      quizForm.appendChild(div);
    });

    quizForm.addEventListener("change", (e) => {
      if (e.target.type === "radio") {
        const index = e.target.name.replace("q", "");
        answers[index] = Number(e.target.value);
      }
    });
  })
  .catch((err) => {
    console.error(err);
    quizForm.innerHTML = "<p>Unable to load quiz.</p>";
  });

function submitQuiz() {
  if (hasSubmitted) return;
  hasSubmitted = true;
  clearInterval(timerInterval);

  const token = localStorage.getItem("token");

  fetch(`http://localhost:5000/api/quiz/submit/${quizId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ REQUIRED
    },
    body: JSON.stringify({ answers }),
  })
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem(`attempted_${quizId}_user_${userId}`, "true");
      window.location.href = "./leaderboard.html?id=" + quizId;
    })
    .catch((err) => {
      console.error(err);
      hasSubmitted = false;
    });
}

function startTimer(seconds) {
  timeLeft = seconds;
  const timerDiv = document.getElementById("timer");

  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const secondsLeft = timeLeft % 60;

    // Show timer on UI
    timerDiv.innerText = `Time Left: ${minutes}:${secondsLeft
      .toString()
      .padStart(2, "0")}`;

    // Auto-submit when time ends
    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      if (!hasSubmitted) {
        alert("Time is up! Auto submitting...");
        submitQuiz();
      }
    }

    timeLeft--;
  }, 1000);
}
