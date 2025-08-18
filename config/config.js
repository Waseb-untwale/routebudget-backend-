require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: 'wasebpostgresql@#$123',
    database: 'route_budget',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
