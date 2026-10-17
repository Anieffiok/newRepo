"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_eligibility_results_match_label" AS ENUM (
        'STRONG_MATCH', 'GOOD_MATCH', 'NEEDS_PREPARATION',
        'NOT_ELIGIBLE', 'UNABLE_TO_DETERMINE'
      );
    `);

    await queryInterface.createTable("eligibility_results", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      opportunity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "opportunities", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      match_label: {
        type: Sequelize.ENUM(
          "STRONG_MATCH",
          "GOOD_MATCH",
          "NEEDS_PREPARATION",
          "NOT_ELIGIBLE",
          "UNABLE_TO_DETERMINE",
        ),
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    // One result per user per opportunity
    await queryInterface.addConstraint("eligibility_results", {
      fields: ["user_id", "opportunity_id"],
      type: "unique",
      name: "unique_user_opportunity_eligibility",
    });

    await queryInterface.addIndex("eligibility_results", ["user_id"], {
      name: "eligibility_results_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("eligibility_results");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_eligibility_results_match_label";',
    );
  },
};
