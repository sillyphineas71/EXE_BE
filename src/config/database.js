const { Sequelize } = require("sequelize");
const config = require("./env");

const buildSequelizeInstance = () => {
  if (config.database.url) {
    return new Sequelize(config.database.url, {
      dialect: "postgres",
      logging: config.database.logging ? console.log : false,
      dialectOptions: config.database.ssl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    });
  }

  return new Sequelize(
    config.database.name,
    config.database.username,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: "postgres",
      logging: config.database.logging ? console.log : false,
      dialectOptions: config.database.ssl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    }
  );
};

const sequelize = buildSequelizeInstance();

const connectDatabase = async () => {
  await sequelize.authenticate();
  if (config.database.sync) {
    await sequelize.sync();
  }
};

module.exports = {
  sequelize,
  connectDatabase,
};
