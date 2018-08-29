'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameColumn('playthrough', 'template_names',
      'variant_names');
  },

  down: async (queryInterface) => {
    await queryInterface.renameColumn('playthrough', 'variant_names',
      'template_names');
  }
};
