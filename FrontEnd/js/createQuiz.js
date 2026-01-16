function createQuiz() {
  const title = document.getElementById("title").value.trim();
  const questionsText = document.getElementById("questions").value;
  const token = localStorage.getItem("token");

  if (!title || !questionsText) {
    alert("Please enter quiz title and questions");
    return;
  }

  let questions;
  try {
    questions = JSON.parse(questionsText);
  } catch {
    alert("Invalid JSON format for questions");
    return;
  }

  fetch("http://localhost:5000/api/quiz/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ FIXED
    },
    body: JSON.stringify({
      title,
      questions,
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
