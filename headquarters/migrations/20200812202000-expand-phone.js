'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('Relays', 'relay_phone_number', {
      type: 'VARCHAR(15)',
      allowNull: false,
      defaultValue: '',
      after: 'with_role_name'
    });
    await queryInterface.sequelize.query(`
      UPDATE Relays
      SET relay_phone_number = CONCAT("+1", relay_phone_number)
      WHERE relay_phone_number != ""
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    await queryInterface.changeColumn('Relays', 'participant_phone_number', {
      type: 'VARCHAR(15)',
      allowNull: false,
      defaultValue: '',
      after: 'relay_phone_number'
    });
    await queryInterface.sequelize.query(`
      UPDATE Relays
      SET participant_phone_number = CONCAT("+1", participant_phone_number)
      WHERE participant_phone_number != ""
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });

    await queryInterface.removeColumn('Profiles', 'photo');
    await queryInterface.removeColumn('Profiles', 'phone_number');
    await queryInterface.removeColumn('Profiles', 'email');
    await queryInterface.removeColumn('Profiles', 'skype_username');
    await queryInterface.removeColumn('Profiles', 'facetime_username');

    await queryInterface.changeColumn('Participants', 'phone_number', {
      type: 'VARCHAR(15)',
      allowNull: false,
      defaultValue: '',
      after: 'email'
    });
    await queryInterface.sequelize.query(`
      UPDATE Participants
      SET phone_number = CONCAT("+1", phone_number)
      WHERE phone_number != ""
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });
  },
  down: async () => {}
};
