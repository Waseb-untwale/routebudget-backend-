

// const express = require("express");
// const {adminLogin,registerAdmin,totalSubAdminCount,getAllSubAdmins,addNewSubAdmin,getSubAdminById,updateSubAdmin, deleteSubAdmin,toggleBlockStatus,totalDriver,totalCab,getAllExpenses,getSubadminExpenses
// } = require("../controllers/adminController");
// const { sendSubAdminEmail, loginSubAdmin } = require("../controllers/emailController");
// const upload = require("../middleware/uploadMiddleware");
// const { getAnalytics, addAnalytics } = require("../controllers/adminController");
// const router = express.Router();
// router.post("/register", registerAdmin);
// router.post("/login", adminLogin);
// router.get("/sub-admin-count", totalSubAdminCount);
// router.get("/driver-count", totalDriver);
// router.get("/cab-count", totalCab);
// router.get("/getExpense", getAllExpenses);
// router.get("/getAllSubAdmins", getAllSubAdmins);
// router.post("/addNewSubAdmin", upload.fields([{ name: "profileImage", maxCount: 1 },{ name: "companyLogo", maxCount: 1 },{name: "signature", maxCount: 1}]), addNewSubAdmin);
// router.get("/getSubAdmin/:id", getSubAdminById);
// router.put("/updateSubAdmin/:id", updateSubAdmin);
// router.delete("/deleteSubAdmin/:id", deleteSubAdmin);
// router.put("/toggle-block/:id", toggleBlockStatus);
// router.post("/send", sendSubAdminEmail);
// router.post("/login", loginSubAdmin);

// router.get("/", getAnalytics);
// router.post("/", addAnalytics)

// router.get("/subadmin-expenses", getSubadminExpenses);

// router.post(
//   "/upload-profile",
//   upload.single("profileImage"),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded!" });
//       }

//       res.json({
//         message: "File uploaded successfully!",
//         fileUrl: req.file.path,
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

// module.exports = router;


const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const uploadFields = require ("../middleware/uploadFields")

// Admin & Subadmin Controllers
const {
  adminLogin,
  registerAdmin,
  totalSubAdminCount,
  getAllSubAdmins,
  addNewSubAdmin,
  getSubAdminById,
  updateSubAdmin,
  deleteSubAdmin,
  toggleBlockStatus,
  totalDriver,
  totalCab,
  getAllExpenses,
  getSubadminExpenses,
  getAnalytics,
  addAnalytics,
} = require("../controllers/adminController");

// Email-related Controllers
const {sendSubAdminEmail,loginSubAdmin,} = require("../controllers/emailController");

 router.post("/addNewSubAdmin",uploadFields,addNewSubAdmin);
 router.post("/login", loginSubAdmin); // Changed to avoid conflict with admin login


router.get("/sub-admin-count", totalSubAdminCount);
router.get("/getAllSubAdmins", getAllSubAdmins);
router.get("/getSubAdmin/:id", getSubAdminById);
router.put("/updateSubAdmin/:id", updateSubAdmin);
router.delete("/deleteSubAdmin/:id", deleteSubAdmin);
router.put("/toggle-block/:id", toggleBlockStatus);


router.get("/", getAnalytics);        // Get latest analytics (limit 10)
router.post("/", addAnalytics);       // Add new analytics record

router.get("/driver-count", totalDriver);
router.get("/cab-count", totalCab);
router.get("/getExpense", getAllExpenses);
router.get("/subadmin-expenses", getSubadminExpenses);

router.post("/send", sendSubAdminEmail);


router.post("/upload-profile", upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    res.json({
      message: "File uploaded successfully!",
      fileUrl: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/register", registerAdmin);
router.post("/login", adminLogin);


module.exports = router;

