'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Profiles', 'email', {
      type: 'VARCHAR(255)',
      after: 'photo',
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Profiles', 'email');
  }
};
