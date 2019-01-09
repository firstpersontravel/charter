/**
 * Sequelize and CLI database config.
 */
const config = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  define: {
    underscored: false,
    timestamps: false
  },
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  operatorsAliases: false,
  logging: false
};

module.exports = {
  development: config,
  test: Object.assign({}, config, {
    dialect: 'sqlite',
    username: 'galaxy_test',
    database: 'galaxy_test',
    password: 'galaxy_test_pw'
  }),
  production: config
};
