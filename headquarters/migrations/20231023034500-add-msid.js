'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Relays', 'messaging_service_id', {
      type: 'VARCHAR(34)',
      allowNull: false,
      defaultValue: '',
      after: 'relay_phone_number'
    });
    await queryInterface.addColumn('Relays', 'messaging_compliance_id', {
      type: 'VARCHAR(34)',
      allowNull: false,
      defaultValue: '',
      after: 'messaging_service_id'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Relays', 'messaging_service_id');
    await queryInterface.removeColumn('Relays', 'messaging_compliance_id');
  }
};
