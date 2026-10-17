"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_eligibility_items_result" AS ENUM (
        'SATISFIED', 'POTENTIAL_GAP', 'NOT_SATISFIED',
        'INFORMATION_NEEDED', 'NOT_APPLICABLE'
      );
    `);

    await queryInterface.createTable("eligibility_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      eligibility_result_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "eligibility_results", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      requirement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "opportunity_requirements", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      result: {
        type: Sequelize.ENUM(
          "SATISFIED",
          "POTENTIAL_GAP",
          "NOT_SATISFIED",
          "INFORMATION_NEEDED",
          "NOT_APPLICABLE",
        ),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_info_used: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex(
      "eligibility_items",
      ["eligibility_result_id"],
      {
        name: "eligibility_items_result_id_idx",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("eligibility_items");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_eligibility_items_result";',
    );
  },
};
