import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const Opportunity = sequelize.define(
  "Opportunity",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    organisation: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
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
      ),
      allowNull: false,
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    workMode: {
      type: DataTypes.ENUM("REMOTE", "HYBRID", "ONSITE"),
      allowNull: true,
      field: "work_mode",
    },
    careerLevel: {
      type: DataTypes.ENUM(
        "STUDENT",
        "ENTRY_LEVEL",
        "MID_LEVEL",
        "SENIOR",
        "EXECUTIVE",
      ),
      allowNull: true,
      field: "career_level",
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    applicationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "application_url",
    },
    sourceUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "source_url",
    },
    sourceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "source_type",
    },
    trustLabel: {
      type: DataTypes.ENUM(
        "OFFICIALLY_VERIFIED",
        "SOURCE_VERIFIED",
        "USER_REPORTED",
        "AI_INFERRED",
        "UNVERIFIED",
      ),
      defaultValue: "UNVERIFIED",
      allowNull: false,
      field: "trust_label",
    },
    verificationStatus: {
      type: DataTypes.ENUM(
        "UNVERIFIED",
        "UNDER_REVIEW",
        "VERIFIED",
        "REJECTED",
      ),
      defaultValue: "UNVERIFIED",
      allowNull: false,
      field: "verification_status",
    },
    status: {
      type: DataTypes.ENUM(
        "ACTIVE",
        "CLOSING_SOON",
        "CLOSED",
        "EXPIRED",
        "UNDER_REVIEW",
      ),
      defaultValue: "ACTIVE",
      allowNull: false,
    },
    lastCheckedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_checked_at",
    },
    checkedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "checked_by",
    },
    addedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "added_by_user_id",
    },
  },
  {
    tableName: "opportunities",
    timestamps: true,
  },
);

export default Opportunity;
