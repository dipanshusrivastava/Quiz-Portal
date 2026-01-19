const express = require("express");
const auth = require("../middleware/auth");
const { Quiz, Question, Option, Result } = require("../models");

const router = express.Router();

/*
-----------------------------------
GET all quizzes (titles only)
-----------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      attributes: ["id", "title", "startTime"],
    });

    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

/*
-----------------------------------
CREATE QUIZ
-----------------------------------
Expected body:
{
  title: "Math Quiz",
  passcode: "1234",
  questions: [
    {
      question: "2 + 2 = ?",
      options: ["1","2","3","4"],
      correctAnswer: 3
    }
  ]
}
-----------------------------------
*/
router.post("/create", auth, async (req, res) => {
  try {
    const { title, questions } = req.body;

    // ❌ Validation
    if (!title || !questions || !questions.length) {
      return res
        .status(400)
        .json({ message: "Title and questions are required" });
    }

    // ✅ Create quiz (DRAFT)
    const quiz = await Quiz.create({
      title,
      creatorId: req.user.id, // 👈 ownership
      status: "DRAFT",
    });

    // ✅ Create questions & options
    for (const q of questions) {
      const question = await Question.create({
        text: q.question,
        QuizId: quiz.id,
      });

      for (let i = 0; i < q.options.length; i++) {
        await Option.create({
          text: q.options[i],
          isCorrect: i === q.correctAnswer,
          QuestionId: question.id,
        });
      }
    }

    res.json({
      message: "Quiz created successfully",
      quizId: quiz.id,
    });
  } catch (err) {
    console.error("CREATE QUIZ ERROR:", err);
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

// my quizzes
router.get("/my-quizzes", auth, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { creatorId: req.user.id }, // 👈 filter
      attributes: ["id", "title", "status"],
    });

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Failed to load quizzes" });
  }
});

// GET QUIZ FOR EDIT (NO PASSCODE)
router.get("/edit/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: {
        model: Question,
        include: Option,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({
      id: quiz.id,
      title: quiz.title,
      questions: quiz.Questions.map((q) => ({
        question: q.text,
        options: q.Options.map((o) => o.text),
        correctAnswer: q.Options.findIndex((o) => o.isCorrect),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load quiz for edit" });
  }
});

//
// UPDATE QUIZ
router.put("/:id", async (req, res) => {
  try {
    const { title, questions } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findByPk(quizId, {
      include: { model: Question, include: Option },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Update title
    quiz.title = title;
    await quiz.save();

    // Remove old questions & options
    for (const q of quiz.Questions) {
      await Option.destroy({ where: { QuestionId: q.id } });
    }
    await Question.destroy({ where: { QuizId: quizId } });

    // Recreate questions
    for (const q of questions) {
      const question = await Question.create({
        text: q.question,
        QuizId: quizId,
      });

      for (let i = 0; i < q.options.length; i++) {
        await Option.create({
          text: q.options[i],
          isCorrect: i === q.correctAnswer,
          QuestionId: question.id,
        });
      }
    }

    res.json({ message: "Quiz updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update quiz" });
  }
});

//  hosting
router.post("/host/:id", auth, async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (quiz.creatorId !== req.user.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await quiz.update({
    passcode: req.body.passcode,
    duration: req.body.duration,
    startTime: req.body.startTime,
    status: "LIVE",
  });

  res.json({ message: "Quiz hosted" });
});

// GET LEADERBOARD FOR A QUIZ
router.get("/leaderboard/:id", auth, async (req, res) => {
  try {
    const quizId = req.params.id;

    const results = await Result.findAll({
      where: { QuizId: quizId },
      order: [["score", "DESC"]],
    });

    // Add rank manually
    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      name: r.name || "Anonymous",
      email: r.email || "-",
      score: r.score,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

/*
-----------------------------------
GET QUIZ BY ID (with passcode)
-----------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: {
        model: Question,
        include: Option,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // startTime
    if (quiz.startTime) {
      const now = new Date();
      const start = new Date(quiz.startTime);

      if (now < start) {
        return res.status(403).json({
          message: "Quiz has not started yet",
          startsIn: start - now,
        });
      }
    }

    // Passcode check
    const enteredPasscode = req.headers["x-passcode"];
    if (enteredPasscode !== quiz.passcode) {
      return res.status(403).json({ message: "Incorrect passcode" });
    }

    // Convert SQL format → frontend format
    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      duration: quiz.duration, // 👈 THIS LINE FIXES THE TIMER
      questions: quiz.Questions.map((q) => ({
        question: q.text,
        options: q.Options.map((o) => o.text),
        correctAnswer: q.Options.findIndex((o) => o.isCorrect),
      })),
    };

    res.json(formattedQuiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
});

/*
-----------------------------------
SUBMIT QUIZ
-----------------------------------
*/
router.post("/submit/:id", auth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers } = req.body;

    const quiz = await Quiz.findByPk(quizId, {
      include: {
        model: Question,
        include: Option,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let score = 0;

    quiz.Questions.forEach((question, index) => {
      const correctIndex = question.Options.findIndex(opt => opt.isCorrect);
      if (answers[index] === correctIndex) score++;
    });

    await Result.create({
      score,
      name: req.user.name,
      email: req.user.email,
      QuizId: quiz.id,
    });

    res.json({ score });
  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

module.exports = router;
