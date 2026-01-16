const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Result = sequelize.define("Result", {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Result;
