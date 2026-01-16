const params = new URLSearchParams(window.location.search);
const quizId = params.get("id");

const tableBody = document.querySelector("#leaderboardTable tbody");

if (!quizId) {
  tableBody.innerHTML = "<tr><td colspan='3'>Invalid quiz ID</td></tr>";
} else {
  fetch(`http://localhost:5000/api/quiz/leaderboard/${quizId}`)
    .then(res => res.json())
    .then(data => {
      console.log("Leaderboard data:", data); // 🔍 check console

      if (!Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='3'>No results yet</td></tr>";
        return;
      }

      tableBody.innerHTML = "";
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.rank}</td>
          <td>${row.name}</td>
          <td>${row.score}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error(err);
      tableBody.innerHTML = "<tr><td colspan='3'>Unable to load leaderboard</td></tr>";
    });
}
