"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunity_requirements_type" AS ENUM (
        'DEGREE', 'DISCIPLINE', 'SKILLS', 'EXPERIENCE',
        'CERTIFICATIONS', 'LOCATION', 'OTHER'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunity_requirements_evidence_source" AS ENUM (
        'PUBLISHED', 'ROVIA_INTERPRETATION'
      );
    `);

    await queryInterface.createTable("opportunity_requirements", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      opportunity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "opportunities",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM(
          "DEGREE",
          "DISCIPLINE",
          "SKILLS",
          "EXPERIENCE",
          "CERTIFICATIONS",
          "LOCATION",
          "OTHER",
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      evidence_source: {
        type: Sequelize.ENUM("PUBLISHED", "ROVIA_INTERPRETATION"),
        defaultValue: "PUBLISHED",
        allowNull: false,
      },
      accepts_any_discipline: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex(
      "opportunity_requirements",
      ["opportunity_id"],
      {
        name: "opp_requirements_opportunity_id_idx",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("opportunity_requirements");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunity_requirements_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunity_requirements_evidence_source";',
    );
  },
};
