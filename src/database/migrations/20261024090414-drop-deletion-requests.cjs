"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable("deletion_requests");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_deletion_requests_status";',
    );
  },

  async down() {
    // Not reversible: the table and its rows are removed.
  },
};
