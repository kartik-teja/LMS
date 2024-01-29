"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Courses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Courses.belongsTo(models.Users, { foreignKey: "email" });

      Courses.hasMany(models.Chapters, { foreignKey: "email" });
    }
  }
  Courses.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      chapters: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      registeredUsersCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Courses",
    }
  );
  return Courses;
};
