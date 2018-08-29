'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('relay', {
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
      stage: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      schedule_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      for_role_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      as_role_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      with_role_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      phone_number: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      allows_sms: {
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
      },
      allows_phone: {
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
      },
      is_active: {
        type: 'TINYINT(1)',
        defaultValue: true,
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
    await queryInterface.dropTable('relay');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
