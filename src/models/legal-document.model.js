const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const LegalDocument = sequelize.define(
    "LegalDocument",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      doc_type: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          isIn: [["terms_of_use", "privacy_policy", "disclaimer", "other"]],
        },
      },
      version: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      content_url: {
        type: DataTypes.TEXT,
      },
      effective_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "legal_documents",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "legal_documents_doc_type_version_unique",
          unique: true,
          fields: ["doc_type", "version"],
        },
      ],
    }
  );

  return LegalDocument;
};
