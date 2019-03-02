'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Orgs', 'is_personal', {
      type: 'TINYINT(1)',
      allowNull: false,
      defaultValue: 0,
      after: 'title'
    });
    await queryInterface.addColumn('Scripts', 'is_locked', {
      type: 'TINYINT(1)',
      allowNull: false,
      defaultValue: 0,
      after: 'is_active'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Orgs', 'is_personal');
    await queryInterface.removeColumn('Scripts', 'is_locked');
  }
};
