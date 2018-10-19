'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Actions', 'type', {
      type: 'VARCHAR(10)',
      allowNull: false,
      after: 'playthrough_id',
      defaultValue: 'action',
    });
    await queryInterface.removeColumn('Actions', 'synced_at');
    await queryInterface.changeColumn('Actions', 'name', {
      type: 'VARCHAR(64)',
      after: 'type',
      allowNull: false,
      defaultValue: ''
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Actions', 'type');
    await queryInterface.addColumn('Actions', 'synced_at', {
      type: 'DATETIME',
      allowNull: true,
      after: 'created_at'
    });
    await queryInterface.changeColumn('Actions', 'name',
      { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' });
  }
};
