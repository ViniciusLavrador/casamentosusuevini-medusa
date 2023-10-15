const { DataSource } = require("typeorm");

require("dotenv").config();

const AppDataSource = new DataSource({
  type: process.env.DATABASE_TYPE,
  port: process.env.PGPORT,
  host: process.env.PGHOST,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  entities: ["dist/models/*.js"],
  migrations: ["dist/migrations/*.js"],
});

module.exports = {
  datasource: AppDataSource,
};
