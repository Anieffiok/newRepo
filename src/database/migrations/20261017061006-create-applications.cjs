"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_applications_source" AS ENUM (
        'FOUND_IN_ROVIA', 'FOUND_ELSEWHERE'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_applications_current_stage" AS ENUM (
        'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'FINAL_STAGE', 'OUTCOME', 'REVIEW'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_applications_status" AS ENUM (
        'ACTIVE', 'CLOSED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_applications_outcome_type" AS ENUM (
        'OFFER_RECEIVED', 'ACCEPTED', 'DECLINED', 'REJECTED',
        'WITHDRAWN', 'NO_RESPONSE', 'POSITION_FILLED', 'UNKNOWN'
      );
    `);

    await queryInterface.createTable("applications", {
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
      application_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      application_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      source: {
        type: Sequelize.ENUM("FOUND_IN_ROVIA", "FOUND_ELSEWHERE"),
        defaultValue: "FOUND_IN_ROVIA",
        allowNull: false,
      },
      current_stage: {
        type: Sequelize.ENUM(
          "APPLIED",
          "ASSESSMENT",
          "INTERVIEW",
          "FINAL_STAGE",
          "OUTCOME",
          "REVIEW",
        ),
        defaultValue: "APPLIED",
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "CLOSED"),
        defaultValue: "ACTIVE",
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      outcome_type: {
        type: Sequelize.ENUM(
          "OFFER_RECEIVED",
          "ACCEPTED",
          "DECLINED",
          "REJECTED",
          "WITHDRAWN",
          "NO_RESPONSE",
          "POSITION_FILLED",
          "UNKNOWN",
        ),
        allowNull: true,
      },
      outcome_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      outcome_notes: {
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

    await queryInterface.addIndex("applications", ["user_id"], {
      name: "applications_user_id_idx",
    });
    await queryInterface.addIndex("applications", ["opportunity_id"], {
      name: "applications_opportunity_id_idx",
    });
    await queryInterface.addIndex("applications", ["status"], {
      name: "applications_status_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("applications");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_applications_source";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_applications_current_stage";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_applications_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_applications_outcome_type";',
    );
  },
};
