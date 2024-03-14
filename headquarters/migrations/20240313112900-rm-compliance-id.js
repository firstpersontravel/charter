'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Clear out all relays to start fresh
    await queryInterface.sequelize.query(
      'DELETE FROM Relays',
      { type: queryInterface.sequelize.QueryTypes.UPDATE });
    await queryInterface.removeColumn('Relays', 'messaging_compliance_id');
    await queryInterface.removeColumn('Relays', 'trip_id');
    await queryInterface.removeColumn('Relays', 'participant_phone_number');
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn('Relays', 'messaging_compliance_id', {
      type: 'VARCHAR(34)',
      allowNull: false,
      defaultValue: '',
      after: 'messaging_service_id'
    });
    await queryInterface.addColumn('Relays', 'participant_phone_number', {
      type: 'VARCHAR(15)',
      allowNull: false,
      defaultValue: '',
      after: 'messaging_compliance_id'
    });
    await queryInterface.changeColumn('Relays', 'trip_id', {
      type: 'INTEGER',
      allowNull: true,
      after: 'experience_id'
    });
  }
};
