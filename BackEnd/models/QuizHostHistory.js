const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const QuizHostHistory = sequelize.define("QuizHostHistory", {
  passcode: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  hostedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = QuizHostHistory;
