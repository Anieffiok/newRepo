import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const ReadinessResult = sequelize.define(
  "ReadinessResult",
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
    eligibilityResultId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "eligibility_result_id",
    },
    state: {
      type: DataTypes.ENUM(
        "READY",
        "NEEDS_PREPARATION",
        "MISSING_REQUIREMENT",
        "INFORMATION_NEEDED",
      ),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    aiGuidance: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "ai_guidance",
    },
  },
  {
    tableName: "readiness_results",
    timestamps: true,
  },
);

export default ReadinessResult;
