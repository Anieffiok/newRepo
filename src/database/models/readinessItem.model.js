import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const ReadinessItem = sequelize.define(
  "ReadinessItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    readinessResultId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "readiness_result_id",
    },
    itemType: {
      type: DataTypes.ENUM(
        "PROFILE",
        "SKILL",
        "DOCUMENT",
        "CERTIFICATION",
        "ASSESSMENT",
        "EXPERIENCE",
      ),
      allowNull: false,
      field: "item_type",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "DONE", "DISMISSED"),
      defaultValue: "PENDING",
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("HIGH", "MEDIUM", "LOW"),
      defaultValue: "MEDIUM",
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    profileSection: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "profile_section",
    },
  },
  {
    tableName: "readiness_items",
    timestamps: true,
  },
);

export default ReadinessItem;
