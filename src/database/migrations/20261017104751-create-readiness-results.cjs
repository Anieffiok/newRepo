"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_readiness_results_state" AS ENUM (
        'READY', 'NEEDS_PREPARATION', 'MISSING_REQUIREMENT', 'INFORMATION_NEEDED'
      );
    `);

    await queryInterface.createTable("readiness_results", {
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
      eligibility_result_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "eligibility_results", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      state: {
        type: Sequelize.ENUM(
          "READY",
          "NEEDS_PREPARATION",
          "MISSING_REQUIREMENT",
          "INFORMATION_NEEDED",
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

    await queryInterface.addConstraint("readiness_results", {
      fields: ["user_id", "opportunity_id"],
      type: "unique",
      name: "unique_user_opportunity_readiness",
    });

    await queryInterface.addIndex("readiness_results", ["user_id"], {
      name: "readiness_results_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("readiness_results");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_readiness_results_state";',
    );
  },
};
