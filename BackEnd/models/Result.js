const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Result = sequelize.define("Result", {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Result;
