import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const OpportunityRequirement = sequelize.define(
  "OpportunityRequirement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    opportunityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "opportunity_id",
    },
    type: {
      type: DataTypes.ENUM(
        "DEGREE",
        "DISCIPLINE",
        "SKILLS",
        "EXPERIENCE",
        "CERTIFICATIONS",
        "LOCATION",
        "OTHER",
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "is_required",
    },
    evidenceSource: {
      type: DataTypes.ENUM("PUBLISHED", "ROVIA_INTERPRETATION"),
      defaultValue: "PUBLISHED",
      allowNull: false,
      field: "evidence_source",
    },
    acceptsAnyDiscipline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: "accepts_any_discipline",
    },
  },
  {
    tableName: "opportunity_requirements",
    timestamps: true,
  },
);

export default OpportunityRequirement;
