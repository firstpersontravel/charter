'use strict';

module.exports = {
  up: async (queryInterface) => {
    const orgIdType = { type: 'INTEGER', after: 'id', allowNull: false };
    await queryInterface.addColumn('Actions', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Actions set org_id = 1;');
    await queryInterface.addColumn('Experiences', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Experiences set org_id = 1;');
    await queryInterface.addColumn('Groups', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Groups set org_id = 1;');
    await queryInterface.addColumn('Messages', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Messages set org_id = 1;');
    await queryInterface.addColumn('Players', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Players set org_id = 1;');
    await queryInterface.addColumn('Profiles', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Profiles set org_id = 1;');
    await queryInterface.addColumn('Relays', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Relays set org_id = 1;');
    await queryInterface.addColumn('Scripts', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Scripts set org_id = 1;');
    await queryInterface.addColumn('Trips', 'org_id', orgIdType);
    await queryInterface.sequelize.query('update Trips set org_id = 1;');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Actions', 'org_id');
    await queryInterface.removeColumn('Experiences', 'org_id');
    await queryInterface.removeColumn('Groups', 'org_id');
    await queryInterface.removeColumn('Messages', 'org_id');
    await queryInterface.removeColumn('Players', 'org_id');
    await queryInterface.removeColumn('Profiles', 'org_id');
    await queryInterface.removeColumn('Relays', 'org_id');
    await queryInterface.removeColumn('Scripts', 'org_id');
    await queryInterface.removeColumn('Trips', 'org_id');
  }
};
