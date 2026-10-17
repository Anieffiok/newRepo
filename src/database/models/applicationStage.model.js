import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const ApplicationStage = sequelize.define(
  "ApplicationStage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "application_id",
    },
    stageType: {
      type: DataTypes.ENUM(
        "APPLIED",
        "ASSESSMENT",
        "INTERVIEW",
        "FINAL_STAGE",
        "OTHER",
      ),
      allowNull: false,
      field: "stage_type",
    },
    status: {
      type: DataTypes.ENUM("PLANNED", "COMPLETED", "SKIPPED"),
      defaultValue: "PLANNED",
      allowNull: false,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "scheduled_date",
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completion_date",
    },
    assessmentArea: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "assessment_area",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: "sort_order",
    },
  },
  {
    tableName: "application_stages",
    timestamps: true,
  },
);

export default ApplicationStage;
