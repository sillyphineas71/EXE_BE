const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PrescriptionFile = sequelize.define(
    "PrescriptionFile",
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
      file_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "prescription_files",
      underscored: true,
      timestamps: false,
    }
  );

  return PrescriptionFile;
};
