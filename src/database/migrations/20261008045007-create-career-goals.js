/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("career_goals", {
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
      goal_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      target_role: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      target_industry: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      target_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH"),
        defaultValue: "MEDIUM",
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "ACHIEVED", "ABANDONED"),
        defaultValue: "ACTIVE",
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

    await queryInterface.addIndex("career_goals", ["user_id"], {
      name: "career_goals_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("career_goals");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_career_goals_priority";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_career_goals_status";',
    );
  },
};
