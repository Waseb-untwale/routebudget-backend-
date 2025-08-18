
// const bcrypt = require("bcryptjs");
// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const Admin = sequelize.define(
//     "Admin",
//     {
//       profileImage: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         defaultValue: "",
//       },
//       companyLogo: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         defaultValue: "",
//       },
//       companyInfo: {
//         type: DataTypes.TEXT, // Use TEXT for longer content
//         allowNull: false,
//       },
//       signature: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         defaultValue: "",
//       },
//       name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//         validate: {
//           isEmail: true,
//         },
//       },
//       password: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       role: {
//         type: DataTypes.ENUM("admin", "subadmin"),
//         allowNull: false,
//         defaultValue: "subadmin",
//       },
//       phone: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       status: {
//         type: DataTypes.STRING,
//         defaultValue: 'active',
//       },
//       resetOTP: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         defaultValue: null,
//       },
//       resetOTPExpiry: {
//         type: DataTypes.DATE,
//         allowNull: true,
//         defaultValue: null,
//       },
//     },
//     {
//       timestamps: true,
//       tableName: 'admins',
//       hooks: {
//         beforeCreate: async (admin) => {
//           if (admin.password) {
//             admin.password = await bcrypt.hash(admin.password, 10);
//           }
//         },
//         beforeUpdate: async (admin) => {
//           if (admin.changed("password")) {
//             admin.password = await bcrypt.hash(admin.password, 10);
//           }
//         },
//       },
//     }
//   );

//   // Associations
//   Admin.associate = (models) => {
//     Admin.hasMany(models.Driver, {
//       foreignKey: "adminId",
//       as: "assignedDrivers",
//     });

//     Admin.hasMany(models.Cab, {
//       foreignKey: "adminId",
//       as: "assignedCabs",
//     });
//   };

//   // Compare password
//  Admin.prototype.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

//   return Admin;
// };


const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Admin = sequelize.define(
    "Admin",
    {
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      companyLogo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      companyInfo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "subadmin"),
        allowNull: false,
        defaultValue: "subadmin",
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
      },
      resetOTP: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      resetOTPExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      tableName: 'admins',
      hooks: {
        beforeCreate: async (admin) => {
          console.log("Running beforeCreate hook...");
          if (admin.password) {
            admin.password = await bcrypt.hash(admin.password, 10);
          }
        },
        beforeUpdate: async (admin) => {
          if (admin.changed("password")) {
            admin.password = await bcrypt.hash(admin.password, 10);
          }
        },
      },
    }
  );

  // Compare plain password with hashed password
  Admin.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Associations
  Admin.associate = (models) => {
    Admin.hasMany(models.Driver, {
      foreignKey: "adminId",
      as: "assignedDrivers",
    });

    Admin.hasMany(models.Cab, {
      foreignKey: "adminId",
      as: "assignedCabs",
    });
    
  };

  return Admin;
};
