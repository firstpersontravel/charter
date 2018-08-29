'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('participant', 'role_name', {
      type: 'VARCHAR(64)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.changeColumn('participant', 'current_page_name', {
      type: 'VARCHAR(64)',
      allowNull: false,
      after: 'role_name',
      defaultValue: ''
    });
    await queryInterface.addColumn('participant', 'acknowledged_page_name', {
      type: 'VARCHAR(64)',
      allowNull: false,
      after: 'current_page_name',
      defaultValue: ''
    });
    await queryInterface.addColumn('participant', 'acknowledged_page_at', {
      type: 'DATETIME',
      allowNull: true,
      after: 'acknowledged_page_name'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.changeColumn('participant', 'role_name', {
      type: 'VARCHAR(255)',
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.changeColumn('participant', 'current_page_name', {
      type: 'VARCHAR(255)',
      allowNull: false,
      after: 'role_name',
      defaultValue: ''
    });
    await queryInterface.removeColumn('participant', 'acknowledged_page_name');
    await queryInterface.removeColumn('participant', 'acknowledged_page_at');
  }
};
