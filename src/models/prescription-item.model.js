const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PrescriptionItem = sequelize.define(
    "PrescriptionItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      prescription_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      original_name_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      original_instructions: {
        type: DataTypes.TEXT,
      },
      drug_product_id: {
        type: DataTypes.UUID,
      },
      substance_id: {
        type: DataTypes.UUID,
      },
      dose_amount: {
        type: DataTypes.DECIMAL(10, 3),
      },
      dose_unit: {
        type: DataTypes.TEXT,
      },
      frequency_text: {
        type: DataTypes.TEXT,
      },
      route: {
        type: DataTypes.TEXT,
      },
      duration_days: {
        type: DataTypes.INTEGER,
      },
      start_date: {
        type: DataTypes.DATEONLY,
      },
      end_date: {
        type: DataTypes.DATEONLY,
      },
      is_prn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "prescription_items",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_prescription_items_prescription",
          fields: ["prescription_id"],
        },
      ],
    }
  );

  return PrescriptionItem;
};
