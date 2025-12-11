const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PatientProfile = sequelize.define(
    "PatientProfile",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
      },
      sex: {
        type: DataTypes.TEXT,
      },
      relationship_to_owner: {
        type: DataTypes.TEXT,
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: "patient_profiles",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          name: "idx_patient_profiles_owner",
          fields: ["owner_user_id"],
        },
      ],
    }
  );

  return PatientProfile;
};
