const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MedicationRegimen = sequelize.define(
    "MedicationRegimen",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      profile_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      prescription_item_id: {
        type: DataTypes.UUID,
      },
      drug_product_id: {
        type: DataTypes.UUID,
      },
      display_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      total_daily_dose: {
        type: DataTypes.DECIMAL(10, 3),
      },
      dose_unit: {
        type: DataTypes.TEXT,
      },
      start_date: {
        type: DataTypes.DATEONLY,
      },
      end_date: {
        type: DataTypes.DATEONLY,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      schedule_type: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "fixed_times",
        validate: {
          isIn: [["fixed_times", "interval_hours", "custom"]],
        },
      },
      schedule_payload: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      timezone: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "Asia/Ho_Chi_Minh",
      },
      created_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
      tableName: "medication_regimens",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_med_regimens_profile",
          fields: ["profile_id"],
        },
        {
          name: "idx_med_regimens_prescription_item",
          fields: ["prescription_item_id"],
        },
      ],
    }
  );

  return MedicationRegimen;
};
