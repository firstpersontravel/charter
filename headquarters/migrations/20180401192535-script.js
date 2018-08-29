'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('script', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      created_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        },
        defaultValue: null
      },
      name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      title: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      timezone: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      version: {
        type: 'INTEGER'
      },
      content: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('script');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
