const quizId = new URLSearchParams(window.location.search).get("id");
const token = localStorage.getItem("token");

console.log("Quiz ID:", quizId);
console.log("Token exists:", !!token);

fetch(`http://localhost:5000/api/quiz/preview/${quizId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => {
    console.log("Preview API status:", res.status);
    return res.json();
  })
  .then((quiz) => {
    console.log("Preview API response:", quiz);

    if (!quiz.questions || !quiz.questions.length) {
      console.warn("No questions received from API");
      return;
    }

    document.getElementById("quizTitle").innerText = quiz.title;

    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    quiz.questions.forEach((q, index) => {
      const div = document.createElement("div");
      div.className = "quiz-card";

      div.innerHTML = `
        <h3>Q${index + 1}. ${q.question}</h3>
        <ul>
          ${q.options
            .map(
              (opt, i) =>
                `<li style="color:${
                  i === q.correctAnswer ? "green" : "#333"
                }">${opt} ${
                  i === q.correctAnswer ? "✔" : ""
                }</li>`
            )
            .join("")}
        </ul>
      `;

      container.appendChild(div);
    });
  })
  .catch((err) => {
    console.error("Preview error:", err);
    alert("Failed to load quiz preview");
  });
