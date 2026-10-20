import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const LearningResource = sequelize.define(
  "LearningResource",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    skillCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "skill_category",
    },
    difficulty: {
      type: DataTypes.ENUM("BEGINNER", "INTERMEDIATE", "ADVANCED"),
      defaultValue: "BEGINNER",
      allowNull: false,
    },
    isFree: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "is_free",
    },
    durationEstimate: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "duration_estimate",
    },
    countryFocus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "country_focus",
    },
  },
  {
    tableName: "learning_resources",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default LearningResource;
