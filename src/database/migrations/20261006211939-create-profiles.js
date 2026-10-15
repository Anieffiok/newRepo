/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("profiles", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      headline: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
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
        defaultValue: "ENTRY_LEVEL",
        allowNull: false,
      },
      biography: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      completion_status: {
        type: Sequelize.ENUM("INCOMPLETE", "COMPLETE"),
        defaultValue: "INCOMPLETE",
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

    await queryInterface.addIndex("profiles", ["user_id"], {
      unique: true,
      name: "profiles_user_id_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("profiles");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_profiles_career_level";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_profiles_completion_status";',
    );
  },
};
