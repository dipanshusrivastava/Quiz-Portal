const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Question = sequelize.define("Question", {
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Question;
