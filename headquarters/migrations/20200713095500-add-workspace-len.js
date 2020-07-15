'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('Orgs', 'name', {
      type: 'VARCHAR(64)',
      allowNull: false,
      after: 'id',
    });
    await queryInterface.changeColumn('Orgs', 'title', {
      type: 'VARCHAR(64)',
      allowNull: false,
      after: 'name'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.changeColumn('Orgs', 'name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'id'
    });
    await queryInterface.changeColumn('Orgs', 'title', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'name'
    });
  }
};
