const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Prescription = sequelize.define(
    "Prescription",
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
      prescriber_name: {
        type: DataTypes.TEXT,
      },
      prescriber_specialty: {
        type: DataTypes.TEXT,
      },
      facility_name: {
        type: DataTypes.TEXT,
      },
      issued_date: {
        type: DataTypes.DATEONLY,
      },
      note: {
        type: DataTypes.TEXT,
      },
      source_type: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "manual",
        validate: {
          isIn: [["manual", "scan"]],
        },
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "active",
        validate: {
          isIn: [["active", "completed", "cancelled"]],
        },
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
      tableName: "prescriptions",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_prescriptions_profile",
          fields: ["profile_id"],
        },
      ],
    }
  );

  return Prescription;
};
