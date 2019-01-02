'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('Organizations', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: 'VARCHAR(32)',
        allowNull: false,
        defaultValue: ''
      },
      title: {
        type: 'VARCHAR(64)',
        allowNull: false,
        defaultValue: ''
      }
    });
    await queryInterface.createTable('OrganizationRoles', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      organization_id: {
        type: 'INTEGER',
        allowNull: false
      },
      user_id: {
        type: 'INTEGER',
        allowNull: false
      },
      is_admin: {
        type: 'TINYINT(1)',
        allowNull: false,
        defaultValue: false
      }
    });
    await queryInterface.sequelize.query('insert into Organizations (name, title) values ("firstpersontravel", "First Person Travel");');
    await queryInterface.sequelize.query('insert into OrganizationRoles (organization_id, user_id, is_admin) values (1, 1, 1);');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Organizations');
    await queryInterface.dropTable('OrganizationRoles');
  }
};
