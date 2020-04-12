'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Messages', 'from_role_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'trip_id'
    });
    await queryInterface.addColumn('Messages', 'to_role_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'from_role_name'
    });
    await queryInterface.sequelize.query(`
      UPDATE Messages
      INNER JOIN Players FromPlayer
        ON Messages.sent_by_id = FromPlayer.id
      INNER JOIN Players ToPlayer
        ON Messages.sent_to_id = ToPlayer.id
      SET
        Messages.from_role_name = FromPlayer.role_name,
        Messages.to_role_name = ToPlayer.role_name;
    `);
    await queryInterface.removeColumn('Messages', 'sent_by_id');
    await queryInterface.removeColumn('Messages', 'sent_to_id');
  },
  down: async (queryInterface) => {
    await queryInterface.addColumn('Trips', 'sent_by_id', {
      type: 'INTEGER',
      allowNull: false
    });
    await queryInterface.addColumn('Players', 'sent_to_id', {
      type: 'INTEGER',
      allowNull: false
    });
    await queryInterface.removeColumn('Messages', 'from_role_name');
    await queryInterface.removeColumn('Messages', 'to_role_name');
  }
};
