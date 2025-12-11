const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RefSource = sequelize.define(
    "RefSource",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
      },
      description: {
        type: DataTypes.TEXT,
      },
      license_info: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ref_sources",
      underscored: true,
      timestamps: false,
    }
  );

  return RefSource;
};
