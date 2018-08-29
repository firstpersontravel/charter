'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('user', 'profiles');
  },
  down: async (queryInterface) => {
    await queryInterface.addColumn('user', 'profiles', {
      type: 'TEXT',
      allowNull: false,
      defaultValue: '{}'
    });
  }
};
