const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");
if (localStorage.getItem(`attempted_${quizId}`)) {
  alert("You have already attempted this quiz.");
  window.location.href = "./available-quizzes.html";
}
const quizPasscode = sessionStorage.getItem("quizPasscode"); // from prompt

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

// function showEarlyMessage(ms) {
//   const timerDiv = document.getElementById("timer");

//   let remaining = Math.floor(ms / 1000);

//   const interval = setInterval(() => {
//     const h = Math.floor(remaining / 3600);
//     const m = Math.floor((remaining % 3600) / 60);
//     const s = remaining % 60;

//     timerDiv.innerText = `Test will start in ${h}h ${m}m ${s}s`;

//     if (remaining <= 0) {
//       clearInterval(interval);
//       location.reload(); // reload and quiz will open
//     }

//     remaining--;
//   }, 1000);
// }

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
    // ⏱️ Start timer using quiz duration (minutes → seconds)
    startTimer(quiz.duration * 60);
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
        `
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
  clearInterval(timerInterval); // stop timer

  fetch(`http://localhost:5000/api/quiz/submit/${quizId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  })
    .then((res) => res.json())
    .then((data) => {
      localStorage.setItem(`attempted_${quizId}`, "true");
      // alert(`Quiz submitted! Your score: ${data.score}`);
      window.location.replace(
        "/exam-portal-platform/FrontEnd/pages/leaderboard.html?id=" + quizId
      );
    })
    .catch((err) => {
      console.error(err);
      hasSubmitted = false; // allow retry if error
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
