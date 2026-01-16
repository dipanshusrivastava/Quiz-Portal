const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,

  // Prevent too many connections
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  dialectOptions: {
    timeout: 30000
  }
});

module.exports = sequelize;
