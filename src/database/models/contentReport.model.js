import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const ContentReport = sequelize.define(
  "ContentReport",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "reporter_id",
    },
    targetType: {
      type: DataTypes.ENUM("OPPORTUNITY", "USER", "PROFILE"),
      allowNull: false,
      field: "target_type",
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "target_id",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "REVIEWED", "DISMISSED"),
      defaultValue: "PENDING",
      allowNull: false,
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "resolution_notes",
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "reviewed_by",
    },
  },
  {
    tableName: "content_reports",
    timestamps: true,
    underscored: true,
  },
);

export default ContentReport;
