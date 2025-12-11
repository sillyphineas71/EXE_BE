const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserLegalAcceptance = sequelize.define(
    "UserLegalAcceptance",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      legal_document_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ip_address: {
        type: DataTypes.TEXT,
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "user_legal_acceptances",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "user_legal_acceptance_unique",
          unique: true,
          fields: ["user_id", "legal_document_id"],
        },
      ],
    }
  );

  return UserLegalAcceptance;
};
