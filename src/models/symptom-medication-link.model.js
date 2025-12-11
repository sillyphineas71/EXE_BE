const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SymptomMedicationLink = sequelize.define(
    "SymptomMedicationLink",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      symptom_entry_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      regimen_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "symptom_medication_links",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "symptom_regimen_unique",
          unique: true,
          fields: ["symptom_entry_id", "regimen_id"],
        },
        {
          name: "idx_symptom_links_symptom",
          fields: ["symptom_entry_id"],
        },
        {
          name: "idx_symptom_links_regimen",
          fields: ["regimen_id"],
        },
      ],
    }
  );

  return SymptomMedicationLink;
};
