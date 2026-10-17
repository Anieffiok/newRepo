import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const Application = sequelize.define(
  "Application",
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
      field: "user_id",
    },
    opportunityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "opportunity_id",
    },
    applicationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "application_date",
    },
    applicationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "application_url",
    },
    source: {
      type: DataTypes.ENUM("FOUND_IN_ROVIA", "FOUND_ELSEWHERE"),
      defaultValue: "FOUND_IN_ROVIA",
      allowNull: false,
    },
    currentStage: {
      type: DataTypes.ENUM(
        "APPLIED",
        "ASSESSMENT",
        "INTERVIEW",
        "FINAL_STAGE",
        "OUTCOME",
        "REVIEW",
      ),
      defaultValue: "APPLIED",
      allowNull: false,
      field: "current_stage",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "CLOSED"),
      defaultValue: "ACTIVE",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    outcomeType: {
      type: DataTypes.ENUM(
        "OFFER_RECEIVED",
        "ACCEPTED",
        "DECLINED",
        "REJECTED",
        "WITHDRAWN",
        "NO_RESPONSE",
        "POSITION_FILLED",
        "UNKNOWN",
      ),
      allowNull: true,
      field: "outcome_type",
    },
    outcomeDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "outcome_date",
    },
    outcomeNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "outcome_notes",
    },
  },
  {
    tableName: "applications",
    timestamps: true,
  },
);

export default Application;
