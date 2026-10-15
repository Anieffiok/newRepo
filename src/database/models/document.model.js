import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize.js";

const Document = sequelize.define(
  "Document",
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
    documentType: {
      type: DataTypes.ENUM("CV", "CERTIFICATE", "TRANSCRIPT", "OTHER"),
      defaultValue: "OTHER",
      allowNull: false,
      field: "document_type",
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "file_name",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "mime_type",
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "size_bytes",
    },
    storageKey: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "storage_key",
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "uploaded_at",
    },
  },
  {
    tableName: "documents",
    timestamps: true,
  },
);

export default Document;
