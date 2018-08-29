'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('playthrough', {
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
      group_id: {
        name: 'groupId',
        allowNull: false,
        type: 'INTEGER',
        references: {
          model: 'group',
          key: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: 'DATETIME',
        validate: {
          isDate: true
        },
        defaultValue: null
      },
      title: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      date: {
        type: 'DATE',
        validate: {
          is: {}
        }
      },
      schedule_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      template_names: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      values: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      },
      schedule: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      },
      history: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
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
    await queryInterface.dropTable('playthrough');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
