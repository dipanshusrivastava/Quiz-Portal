const express = require("express");
const auth = require("../middleware/auth");
const {
  Quiz,
  Question,
  Option,
  Result,
  QuizHostHistory,
  User,
} = require("../models");

const router = express.Router();

// Checking if quiz time is over or not

function isQuizExpired(quiz) {
  const start = new Date(quiz.startTime);
  const end = new Date(start.getTime() + quiz.duration * 60000);
  return new Date() > end;
}

// Host History Route

router.get("/host-history/:id", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const history = await QuizHostHistory.findAll({
      where: { QuizId: quiz.id },
      order: [["hostedAt", "DESC"]],
    });

    res.json(history);
  } catch (err) {
    console.error("HOST HISTORY ERROR:", err);
    res.status(500).json({ message: "Failed to load host history" });
  }
});

// Get All Quizzes Route

const { Op } = require("sequelize");

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const quizzes = await Quiz.findAll({
      where: {
        status: "LIVE", // ✅ only LIVE quizzes
      },
      attributes: ["id", "title", "startTime", "status"],
      order: [["startTime", "ASC"]],
    });

    res.json(quizzes);
  } catch (err) {
    console.error("FETCH QUIZZES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

// Create Quiz Route

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

// my quizzes Route
router.get("/my-quizzes", auth, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { creatorId: req.user.id },
      attributes: ["id", "title", "status", "startTime", "duration"],
    });

    const now = new Date();

    // 🔄 Auto-update status if quiz time is over
    for (const quiz of quizzes) {
      if (quiz.status === "LIVE" && quiz.startTime && quiz.duration) {
        const start = new Date(quiz.startTime);
        const end = new Date(start.getTime() + quiz.duration * 60000);

        if (now > end) {
          await quiz.update({ status: "COMPLETED" });
        }
      }
    }

    // 🔁 Fetch updated data (clean response)
    const updatedQuizzes = await Quiz.findAll({
      where: { creatorId: req.user.id },
      attributes: ["id", "title", "status"],
    });

    res.json(updatedQuizzes);
  } catch (err) {
    console.error("MY QUIZZES ERROR:", err);
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

// UPDATE QUIZ

router.put("/:id", auth, async (req, res) => {
  try {
    const { title, questions } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findByPk(quizId, {
      include: { model: Question, include: Option },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // 🔒 Ownership check
    if (quiz.creatorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this quiz" });
    }

    // ❌ Block editing while quiz is LIVE
    if (quiz.status === "LIVE") {
      return res.status(403).json({
        message: "Quiz cannot be edited while it is LIVE",
      });
    }

    // ❌ Basic validation
    if (!title || !questions || !questions.length) {
      return res.status(400).json({
        message: "Title and questions are required",
      });
    }

    // ✅ Update title
    quiz.title = title;
    await quiz.save();

    // 🧹 Remove old questions & options
    for (const q of quiz.Questions) {
      await Option.destroy({ where: { QuestionId: q.id } });
    }
    await Question.destroy({ where: { QuizId: quizId } });

    // 🔁 Recreate questions
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
    console.error("EDIT QUIZ ERROR:", err);
    res.status(500).json({ message: "Failed to update quiz" });
  }
});

//  hosting
router.post("/host/:id", auth, async (req, res) => {
  try {
    // ✅ STEP 1: destructure from req.body
    const { passcode, duration, startTime } = req.body;

    if (!passcode || !duration || !startTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // 🔒 Ownership check
    if (quiz.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ❌ Prevent re-hosting LIVE quiz
    if (quiz.status === "LIVE") {
      return res.status(403).json({ message: "Quiz is already live" });
    }

    // ✅ Update quiz
    await quiz.update({
      passcode,
      duration,
      startTime,
      status: "LIVE",
    });

    // ✅ Save hosting history
    await QuizHostHistory.create({
      passcode,
      duration,
      startTime,
      QuizId: quiz.id,
    });

    res.json({ message: "Quiz hosted successfully" });
  } catch (err) {
    console.error("HOST QUIZ ERROR:", err);
    res.status(500).json({ message: "Failed to host quiz" });
  }
});

// Preview Route
router.get("/preview/:id", auth, async (req, res) => {
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

    // 🔒 Creator-only preview
    if (quiz.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Send quiz WITHOUT restrictions
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
    console.error("PREVIEW QUIZ ERROR:", err);
    res.status(500).json({ message: "Failed to load quiz preview" });
  }
});

// GET LEADERBOARD FOR A QUIZ
router.get("/leaderboard/:id", auth, async (req, res) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // CREATOR rules
    if (req.user.role === "CREATOR") {
      if (quiz.creatorId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (quiz.status !== "COMPLETED") {
        return res.status(403).json({
          message: "Results are available only after quiz completion",
        });
      }
    }

    // Fetch results
    const results = await Result.findAll({
      where: { QuizId: quizId },
      order: [
        ["score", "DESC"], // 1️⃣ Higher score first
        ["submittedAt", "ASC"], // 2️⃣ Earlier submission wins tie
      ],
    });

    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      name: r.name || "Anonymous",
      email: r.email || "-",
      score: r.score,
      submittedAt: r.submittedAt,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
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

    // ❌ Quiz not hosted yet
    if (quiz.status === "DRAFT") {
      return res.status(403).json({ message: "Quiz is not live yet" });
    }

    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(start.getTime() + quiz.duration * 60000);

    // ⏳ Quiz has not started yet
    if (now < start) {
      return res.status(403).json({
        message: "Quiz has not started yet",
        startsIn: start - now,
      });
    }

    // 🛑 Quiz time over → auto mark COMPLETED
    if (now > end) {
      if (quiz.status !== "COMPLETED") {
        await quiz.update({ status: "COMPLETED" });
      }

      return res.status(403).json({
        message: "Quiz has ended",
        endedAt: end,
      });
    }

    // 🔐 Passcode check
    const enteredPasscode = req.headers["x-passcode"];
    if (enteredPasscode !== quiz.passcode) {
      return res.status(403).json({ message: "Incorrect passcode" });
    }

    // ✅ Convert SQL format → frontend format
    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      duration: quiz.duration,
      startTime: quiz.startTime,
      questions: quiz.Questions.map((q) => ({
        question: q.text,
        options: q.Options.map((o) => o.text),
        correctAnswer: q.Options.findIndex((o) => o.isCorrect),
      })),
    };

    res.json(formattedQuiz);
  } catch (err) {
    console.error("FETCH QUIZ ERROR:", err);
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

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers format" });
    }

    const quiz = await Quiz.findByPk(quizId, {
      include: {
        model: Question,
        include: Option,
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // ❌ Block if quiz already completed
    if (quiz.status === "COMPLETED") {
      return res.status(403).json({ message: "Quiz already completed" });
    }

    // ❌ Prevent double submission (same user)
    const existingResult = await Result.findOne({
      where: {
        QuizId: quiz.id,
        email: req.user.email,
      },
    });

    if (existingResult) {
      return res.status(400).json({ message: "Quiz already submitted" });
    }

    // ⏱ Time calculation
    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(start.getTime() + quiz.duration * 60000);

    // ❌ Block if quiz never started
    if (now < start) {
      return res.status(403).json({ message: "Quiz has not started yet" });
    }

    // ✅ Calculate score
    let score = 0;

    quiz.Questions.forEach((question, index) => {
      const correctIndex = question.Options.findIndex((opt) => opt.isCorrect);
      if (answers[index] === correctIndex) {
        score++;
      }
    });

    // ✅ Save result FIRST (important for auto-submit)
    await Result.create({
      score,
      name: req.user.name,
      email: req.user.email,
      QuizId: quiz.id,
    });

    // 🛑 If time is over, mark quiz completed AFTER saving
    if (now > end) {
      await quiz.update({ status: "COMPLETED" });
    }

    res.json({
      message: "Quiz submitted successfully",
      score,
    });
  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

module.exports = router;
