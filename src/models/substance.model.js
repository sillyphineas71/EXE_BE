const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Substance = sequelize.define(
    "Substance",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      atc_code: {
        type: DataTypes.TEXT,
      },
      title: {
        type: DataTypes.TEXT,
      },
      summary: {
        type: DataTypes.TEXT,
      },
      indications: {
        type: DataTypes.TEXT,
      },
      warnings: {
        type: DataTypes.TEXT,
      },
      side_effects: {
        type: DataTypes.TEXT,
      },
      usual_dose_text: {
        type: DataTypes.TEXT,
      },
      source_id: {
        type: DataTypes.UUID,
      },
      last_reviewed_at: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "substances",
      underscored: true,
      timestamps: false,
    }
  );

  return Substance;
};
