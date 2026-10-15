export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_skills", {
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
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "skills", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      proficiency: {
        type: Sequelize.ENUM("BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"),
        defaultValue: "BEGINNER",
        allowNull: false,
      },
      evidence: {
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

    // Prevent duplicate skill entries per user
    await queryInterface.addIndex("user_skills", ["user_id", "skill_id"], {
      unique: true,
      name: "user_skills_user_skill_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_skills");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_user_skills_proficiency";',
    );
  },
};
