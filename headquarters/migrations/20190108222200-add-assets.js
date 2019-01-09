'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('Assets', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      org_id: {
        type: 'INTEGER',
        allowNull: false
      },
      experience_id: {
        type: 'INTEGER',
        allowNull: false
      },
      type: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      name: {
        type: 'VARCHAR(64)',
        allowNull: false,
        defaultValue: ''
      },
      data: {
        type: 'LONGTEXT',
        allowNull: false
      },
      is_archived: {
        type: 'TINYINT(1)',
        allowNull: false,
        defaultValue: false
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Assets');
  }
};
