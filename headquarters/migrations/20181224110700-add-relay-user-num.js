'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('Relays', 'phone_number',
      'relay_phone_number');
    await queryInterface.addColumn('Relays', 'user_phone_number', {
      type: 'VARCHAR(10)',
      allowNull: false,
      after: 'relay_phone_number',
      defaultValue: '',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('Relays', 'relay_phone_number',
      'phone_number');
    await queryInterface.removeColumn('Relays', 'user_phone_number');
  }
};
