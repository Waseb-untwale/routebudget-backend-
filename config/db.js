
// const Sequelize  = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//     process.env.PG_DB,         // DB name
//     process.env.PG_USER,       // Username
//     process.env.PG_PASSWORD,   // Password
//     {
//         host: process.env.PG_HOST,
//         port: process.env.PG_PORT,
//         dialect: process.env.PG_DIALECT,
//         logging: false, // set true if you want to log SQL queries
//     }
// );

// // Function to test DB connection
// const connectDB = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('✅ PostgreSQL Connected Successfully');
//     } catch (error) {
//         console.error('❌ PostgreSQL Connection Failed:', error);
//         process.exit(1);
//     }
// };

// module.exports = { sequelize, connectDB };

// config/db.js


// config/db.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Using Database URL');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {}, // 👈 No SSL for local
    logging: false,
  });
} else {
  console.log('Using Local DB Config');
  sequelize = new Sequelize(
    'route_budget',
    'postgres',
    'wasebpostgresql@#$123',
    {
      host: 'localhost',
      port: 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully');
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
