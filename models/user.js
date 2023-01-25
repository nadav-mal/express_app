'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    firstName: {
      type : DataTypes.STRING,
      validate: {
        is: {
          args: /^[a-zA-Z]+$/i,
          msg: 'First name should only contain letters'
        },
        len: {
          args: [3, 32],
          msg: 'First name should be between 3 and 32 characters'
        },
        notEmpty: true
      }
    },
    lastName: {
      type : DataTypes.STRING,
      validate: {
        is: {
          args: /^[a-zA-Z]+$/i,
          msg: 'Last name should only contain letters'
        },
        len: {
          args: [3, 32],
          msg: 'Last name should be between 3 and 32 characters'
        },
        notEmpty: true
      }
    },
    email: {
      type : DataTypes.STRING,
      validate : {
        isEmail :{
          msg : 'Email validation failed'
        }
      }
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};