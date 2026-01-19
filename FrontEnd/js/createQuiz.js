// ✅ This replaces JSON textarea usage
let questions = [];

/* ------------------------
   ADD QUESTION
-------------------------*/
function addQuestion() {
  const questionText = document.getElementById("questionText").value.trim();
  const optionInputs = document.querySelectorAll(".option");
  const correctRadio = document.querySelector('input[name="correct"]:checked');

  if (!questionText) {
    alert("Question cannot be empty");
    return;
  }

  const options = [...optionInputs].map((opt) => opt.value.trim());
  if (options.some((o) => !o)) {
    alert("All options are required");
    return;
  }

  if (!correctRadio) {
    alert("Please select the correct answer");
    return;
  }

  questions.push({
    question: questionText,
    options,
    correctAnswer: Number(correctRadio.value),
  });

  renderPreview();
  resetQuestionForm();
}

/* ------------------------
   PREVIEW QUESTIONS
-------------------------*/
function renderPreview() {
  const container = document.getElementById("questionPreview");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <strong>Q${index + 1}:</strong> ${q.question}<br/>
      Correct Answer: <em>${q.options[q.correctAnswer]}</em>
      <hr/>
    `;

    container.appendChild(div);
  });
}

/* ------------------------
   RESET QUESTION FORM
-------------------------*/
function resetQuestionForm() {
  document.getElementById("questionText").value = "";
  document.querySelectorAll(".option").forEach((o) => (o.value = ""));
  document
    .querySelectorAll('input[name="correct"]')
    .forEach((r) => (r.checked = false));
}

/* ------------------------
   CREATE QUIZ (YOUR FUNCTION, REFACTORED)
-------------------------*/
function createQuiz() {
  const title = document.getElementById("title").value.trim();
  const token = localStorage.getItem("token");

  if (!title) {
    alert("Please enter quiz title");
    return;
  }

  if (questions.length === 0) {
    alert("Please add at least one question");
    return;
  }

  fetch("http://localhost:5000/api/quiz/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ SAME AS YOUR CODE
    },
    body: JSON.stringify({
      title,
      questions, // ✅ SAME JSON STRUCTURE AS BEFORE
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
        window.location.href = "./dashboard.html";
      } else {
        alert("Failed to create quiz");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Server error");
    });
}
