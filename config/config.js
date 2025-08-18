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
    use_env_variable: 'postgres://route_budget_user:wasebpostgresql%40%23%24123@dpg-d2he6sgdl3ps7387s2o0-a.db.render.com:5432/route_budget',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
