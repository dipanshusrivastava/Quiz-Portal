const API = "http://localhost:5000/api";

const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

const titleInput = document.getElementById("title");
const questionsDiv = document.getElementById("questions");

// 🔹 Load quiz data
fetch(`${API}/quiz/edit/${quizId}`, {
  headers: {
    Authorization: localStorage.getItem("token"),
  },
})
  .then((res) => res.json())
  .then((quiz) => {
    titleInput.value = quiz.title;
    renderQuestions(quiz.questions);
  })
  .catch(() => alert("Failed to load quiz"));

// 🔹 Render questions with proper labels & layout
function renderQuestions(questions) {
  questionsDiv.innerHTML = "";

  questions.forEach((q, qIndex) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const optionsHTML = q.options
      .map((opt, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C, D
        return `
          <div class="option-row">
            <span class="option-label">${label}.</span>

            <input 
              type="text"
              class="option"
              value="${opt}"
            />

            <label class="correct-label">
              <input 
                type="radio"
                name="correct-${qIndex}"
                ${q.correctAnswer === i ? "checked" : ""}
              />
              Correct
            </label>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <h4>Question ${qIndex + 1}</h4>

      <label class="field-label">Question</label>
      <input 
        type="text" 
        class="question-text"
        value="${q.question}"
      />

      <label class="field-label">Options</label>
      ${optionsHTML}
    `;

    questionsDiv.appendChild(card);
  });
}

// 🔹 Save updated quiz (NO CHANGE in logic)
function saveQuiz() {
  const updatedQuestions = [];

  document.querySelectorAll(".question-card").forEach((card) => {
    const questionText = card.querySelector(".question-text").value;
    const options = [];
    let correctAnswer = 0;

    card.querySelectorAll(".option-row").forEach((row, i) => {
      const optText = row.querySelector(".option").value;
      const isCorrect = row.querySelector("input[type=radio]").checked;

      options.push(optText);
      if (isCorrect) correctAnswer = i;
    });

    updatedQuestions.push({
      question: questionText,
      options,
      correctAnswer,
    });
  });

  fetch(`${API}/quiz/${quizId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
       Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      title: titleInput.value,
      questions: updatedQuestions,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      window.location.href = "./dashboard.html";
    })
    .catch(() => alert("Failed to save quiz"));
}
