import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const PrivacySetting = sequelize.define(
  "PrivacySetting",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "user_id",
    },
    profileVisibility: {
      type: DataTypes.ENUM("PUBLIC", "PRIVATE"),
      defaultValue: "PRIVATE",
      allowNull: false,
      field: "profile_visibility",
    },
    showEducation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "show_education",
    },
    showExperience: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "show_experience",
    },
    showSkills: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "show_skills",
    },
    showCertifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "show_certifications",
    },
    showApplications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: "show_applications",
    },
  },
  {
    tableName: "privacy_settings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default PrivacySetting;
