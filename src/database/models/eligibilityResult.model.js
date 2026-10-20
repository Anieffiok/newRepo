import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const EligibilityResult = sequelize.define(
  "EligibilityResult",
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
    matchLabel: {
      type: DataTypes.ENUM(
        "STRONG_MATCH",
        "GOOD_MATCH",
        "NEEDS_PREPARATION",
        "NOT_ELIGIBLE",
        "UNABLE_TO_DETERMINE",
      ),
      allowNull: false,
      field: "match_label",
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    aiInterpretation: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "ai_interpretation",
    },
  },
  {
    tableName: "eligibility_results",
    timestamps: true,
  },
);

export default EligibilityResult;
