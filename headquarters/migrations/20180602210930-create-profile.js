'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('profile', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        allowNull: false,
        type: 'INTEGER',
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      script_name: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      role_name: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      departure_name: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      is_active: {
        type: 'TINYINT(1)',
        defaultValue: true
      },
      photo: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      phone_number: {
        type: 'VARCHAR(10)',
        allowNull: false,
        defaultValue: ''
      },
      skype_username: {
        type: 'VARCHAR(64)',
        allowNull: false,
        defaultValue: ''
      },
      facetime_username: {
        type: 'VARCHAR(64)',
        allowNull: false,
        defaultValue: ''
      },
      values: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: ''
      },
      is_archived: {
        type: 'TINYINT(1)',
        defaultValue: false
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('profile');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
