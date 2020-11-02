'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('LogEntries', {
      id: {
        type: 'INTEGER',
        allowNull: false
      },
      org_id: {
        type: 'INTEGER',
        allowNull: false,
      },
      trip_id: {
        type: 'INTEGER',
        allowNull: false,
      },
      created_at: {
        type: 'DATETIME',
        allowNull: false
      },
      level: {
        type: 'INTEGER',
        allowNull: false
      },
      message: {
        type: 'VARCHAR(255)',
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('LogEntries');
  }
};
