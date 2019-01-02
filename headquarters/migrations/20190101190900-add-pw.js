'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Users', 'password_hash', {
      type: 'VARCHAR(60)',
      after: 'email',
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'password_hash');
  }
};
