"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── ENUM Types ───────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_type" AS ENUM (
        'JOB', 'GRADUATE_TRAINEE', 'INTERNSHIP', 'FELLOWSHIP',
        'SCHOLARSHIP', 'APPRENTICESHIP', 'COMPETITION', 'TRAINING',
        'VOLUNTEERING', 'OTHER'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_work_mode" AS ENUM (
        'REMOTE', 'HYBRID', 'ONSITE'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_career_level" AS ENUM (
        'STUDENT', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR', 'EXECUTIVE'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_trust_label" AS ENUM (
        'OFFICIALLY_VERIFIED', 'SOURCE_VERIFIED', 'USER_REPORTED',
        'AI_INFERRED', 'UNVERIFIED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_verification_status" AS ENUM (
        'UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_opportunities_status" AS ENUM (
        'ACTIVE', 'CLOSING_SOON', 'CLOSED', 'EXPIRED', 'UNDER_REVIEW'
      );
    `);

    // ─── Opportunities Table ──────────────────────────────────────
    await queryInterface.createTable("opportunities", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      organisation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM,
        values: [
          "JOB",
          "GRADUATE_TRAINEE",
          "INTERNSHIP",
          "FELLOWSHIP",
          "SCHOLARSHIP",
          "APPRENTICESHIP",
          "COMPETITION",
          "TRAINING",
          "VOLUNTEERING",
          "OTHER",
        ],
        allowNull: false,
      },
      industry: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      work_mode: {
        type: Sequelize.ENUM("REMOTE", "HYBRID", "ONSITE"),
        allowNull: true,
      },
      career_level: {
        type: Sequelize.ENUM(
          "STUDENT",
          "ENTRY_LEVEL",
          "MID_LEVEL",
          "SENIOR",
          "EXECUTIVE",
        ),
        allowNull: true,
      },
      deadline: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      application_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      source_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      source_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      trust_label: {
        type: Sequelize.ENUM(
          "OFFICIALLY_VERIFIED",
          "SOURCE_VERIFIED",
          "USER_REPORTED",
          "AI_INFERRED",
          "UNVERIFIED",
        ),
        defaultValue: "UNVERIFIED",
        allowNull: false,
      },
      verification_status: {
        type: Sequelize.ENUM(
          "UNVERIFIED",
          "UNDER_REVIEW",
          "VERIFIED",
          "REJECTED",
        ),
        defaultValue: "UNVERIFIED",
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "ACTIVE",
          "CLOSING_SOON",
          "CLOSED",
          "EXPIRED",
          "UNDER_REVIEW",
        ),
        defaultValue: "ACTIVE",
        allowNull: false,
      },
      last_checked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      checked_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      added_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
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

    // ─── Indexes ──────────────────────────────────────────────────
    await queryInterface.addIndex("opportunities", ["status"], {
      name: "opportunities_status_idx",
    });
    await queryInterface.addIndex("opportunities", ["deadline"], {
      name: "opportunities_deadline_idx",
    });
    await queryInterface.addIndex("opportunities", ["trust_label"], {
      name: "opportunities_trust_label_idx",
    });
    await queryInterface.addIndex("opportunities", ["added_by_user_id"], {
      name: "opportunities_added_by_idx",
    });
    await queryInterface.addIndex("opportunities", ["type"], {
      name: "opportunities_type_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("opportunities");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_work_mode";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_career_level";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_trust_label";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_verification_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_opportunities_status";',
    );
  },
};
