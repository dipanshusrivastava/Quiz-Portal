const sequelize = require("../config/db");

const User = require("./User");
const Quiz = require("./Quiz");
const Question = require("./Question");
const Option = require("./Option");
const Result = require("./Result");

// Relationships
Quiz.hasMany(Question, { onDelete: "CASCADE" });
Question.belongsTo(Quiz);

Question.hasMany(Option, { onDelete: "CASCADE" });
Option.belongsTo(Question);

User.hasMany(Result);
Result.belongsTo(User);

Quiz.hasMany(Result);
Result.belongsTo(Quiz);

module.exports = {
  sequelize,
  User,
  Quiz,
  Question,
  Option,
  Result,
};
