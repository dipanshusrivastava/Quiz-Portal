const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Quiz = sequelize.define("Quiz", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false, // 👈 ownership
  },

  passcode: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  startTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  status: {
    type: DataTypes.ENUM("DRAFT", "LIVE"),
    defaultValue: "DRAFT",
  },
});

module.exports = Quiz;