// const jwt = require("jsonwebtoken");
// const Admin = require("../models/Admin");

// // Authentication Middleware (Validates JWT Token)
// exports.authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.split(" ")[1];
//     if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.admin = await Admin.findById(decoded.id).select("-password");

//     if (!req.admin) return res.status(401).json({ message: "Invalid Token" });

//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Unauthorized", error });
//   }
// };
// // Role-Based Middleware (Super Admin Access)
// exports.isSuperAdmin = async (req, res, next) => {
//   if (req.admin.role !== "superadmin") {
//     return res.status(403).json({ message: "Access Denied: Super Admins Only" });
//   }
//   next();
// };

// // Role-Based Middleware (Admin Access Control)
// exports.isAdmin = async (req, res, next) => {
//   if (req.admin.role !== "Admin" && req.admin.role !== "superadmin") {
//     return res.status(403).json({ message: "Access Denied: Admins Only" });
//   }
//   next();
// };

// // Middleware to Validate Admin Permissions for Drivers, Cabs, and Assignments
// exports.validateAdminAccess = async (req, res, next) => {
//   try {
//     const { role, permissions } = req.admin;

//     if (role === "superadmin") {
//       return next(); // Superadmin has full access
//     }

//     const entity = req.baseUrl.split("/")[1]; // Extract entity name from URL (e.g., "drivers", "cabs")

//     if (!permissions.includes(entity)) {
//       return res.status(403).json({ message: `Access Denied: No Permission for ${entity}` });
//     }

//     next();
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error });
//   }
// };

const jwt = require("jsonwebtoken");
const { Admin } = require("../models");

// ✅ Middleware to authenticate the admin using JWT
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Sequelize method to find admin by primary key (id)
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Invalid Token: Admin not found" });
    }

    // ✅ Attach admin data to request object
    req.admin = {
      id: admin.id,
      role: admin.role,
      permissions: admin.permissions || [], // In case you use permission-based access
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

// ✅ Middleware to allow only super admins
exports.isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "Access Denied: Super Admins Only" });
  }
  next();
};

// ✅ Middleware to allow both admins and superadmins
exports.isAdmin = (req, res, next) => {
  const allowedRoles = ["Admin", "superadmin", "subadmin"];
  if (!allowedRoles.includes(req.admin.role)) {
    return res.status(403).json({ message: "Access Denied: Admins Only" });
  }
  next();
};

// ✅ Optional: Middleware for checking dynamic permissions like "drivers", "cabs", etc.
exports.validateAdminAccess = (req, res, next) => {
  try {
    const { role, permissions } = req.admin;

    if (role === "superadmin") return next(); // superadmin has full access

    const entity = req.baseUrl.split("/")[1]; // e.g., "/api/drivers" -> "drivers"

    if (!permissions.includes(entity)) {
      return res.status(403).json({ message: `Access Denied: No Permission for ${entity}` });
    }

    next();
  } catch (error) {
    console.error("Permission Middleware Error:", error.message);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
