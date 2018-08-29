'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('group', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      script_id: {
        name: 'scriptId',
        allowNull: false,
        type: 'INTEGER',
        references: {
          model: 'script',
          key: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      date: {
        type: 'DATE',
        validate: {
          is: {}
        }
      },
      is_archived: {
        type: 'TINYINT(1)',
        defaultValue: false,
        validate: {
          isIn: [
            [
              true,
              false
            ]
          ]
        }
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('group');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
