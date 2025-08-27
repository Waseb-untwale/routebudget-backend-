
// const Servicing = require("../models/ServicingAssignment");
// const Cabassigment = require("../models/CabAssignment");

// // ✅ Assign servicing (admin only)
// exports.assignServicing = async (req, res) => {
//   try {
//     const { cabId, driverId, serviceDate } = req.body;

//     const newService = await new Servicing({
//       cab: cabId,
//       driver: driverId,
//       assignedBy: req.admin.id,
//       serviceDate,
//     }).save();

//     res.status(201).json({
//       message: "Cab assigned for servicing",
//       servicing: newService,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };


// // ✅ Driver updates status with receipt and cost
// exports.updateServicingStatus = async (req, res) => {
//   try {
//     const servicing = await Servicing.findById(req.params.id);
//     if (!servicing) {
//       return res.status(404).json({ error: "Servicing not found" });
//     }

//     if (servicing.driver.toString() !== req.driver.id) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     // Update servicing details
//     servicing.receiptImage = req.file?.path || servicing.receiptImage;
//     servicing.servicingAmount = req.body.servicingCost || servicing.servicingAmount;
//      servicing.status = "completed";                 //***** */

//     const cabAssignment = await Cabassigment.findOne({ cab: servicing.cab });
//     if (!cabAssignment) {
//       return res.status(404).json({ error: "Cab assignment not found" });
//     }

//     // Update trip details
//     const meters = cabAssignment.tripDetails?.vehicleServicing?.meter || [];
//     const lastMeter = meters.length ? meters[meters.length - 1] : 0;

//     cabAssignment.tripDetails.vehicleServicing.meter = [];
//     cabAssignment.tripDetails.vehicleServicing.kmTravelled = 0;

//     // Save both in parallel
//     await Promise.all([servicing.save(), cabAssignment.save()]);

//     res.status(200).json({
//       message: "Servicing updated successfully",
//       servicing,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // ✅ Driver gets assigned (pending) servicings
// exports.getAssignedServicings = async (req, res) => {
//   try {
//     const services = await Servicing.find({
//       driver: req.driver.id,
//         status:"pending"
//     })
//       .populate("cab")
//       .populate("driver");

//     res.status(200).json({ services });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // ✅ Admin gets all assigned servicings
// exports.getAssignedServicingsAdmin = async (req, res) => {
//   try {
//     const services = await Servicing.find({
//       assignedBy: req.admin.id,
//     })
//       .populate("cab")
//       .populate("driver");

//     res.status(200).json({ services });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };


const { ServicingAssignment, CabsDetails, Driver, CabAssignment } = require("../models");

exports.assignServicing = async (req, res) => {
  try {
    const { cabId, driverId, serviceDate } = req.body;

    if (!cabId || !driverId || !serviceDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newService = await ServicingAssignment.create({
      cabId,
      driverId,
      assignedBy: req.admin.id,
      serviceDate,
    });

    res.status(201).json({
      message: "Cab assigned for servicing",
      servicing: newService,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.updateServicingStatus = async (req, res) => {
  try {
    const servicingId = req.params.id;
    const driverId = req.driver.id;

    // 1️⃣ Find servicing assignment
    const servicing = await ServicingAssignment.findByPk(servicingId);
    if (!servicing) {
      return res.status(404).json({ error: "Servicing not found" });
    }

    // 2️⃣ Authorization check
    if (servicing.driverId !== driverId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 3️⃣ Update servicing details
    servicing.receiptImage =
      req.file?.path || req.body.receiptImage || servicing.receiptImage;
    servicing.servicingAmount =
      req.body.servicingAmount || servicing.servicingAmount;
    servicing.status = "completed";

    // 4️⃣ Find related cab assignment
    const cabAssignment = await CabAssignment.findOne({
      where: { cabId: servicing.cabId, driverId },
    });

    if (!cabAssignment) {
      return res.status(404).json({ error: "Cab assignment not found" });
    }

    // 5️⃣ Reset servicing and trip data
    cabAssignment.servicingRequired = false;
    cabAssignment.servicingKmTravelled = 0;
    cabAssignment.servicingMeter = [];  // ✅ reset array properly
    cabAssignment.servicingTotalKm = 0; // ✅ reset total if needed

    // 6️⃣ Save updates
    await Promise.all([servicing.save(), cabAssignment.save()]);

    res.status(200).json({
      message: "Servicing completed successfully",
      servicing,
      cabAssignment,
    });
  } catch (err) {
    console.error("Error updating servicing:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.getAssignedServicings = async (req, res) => {
  try {
    const services = await ServicingAssignment.findAll({
      where: { driverId: req.driver.id, status: "pending" },
      include: [
        { model: CabsDetails },
        { model: Driver },
      ],
    });

    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ Admin gets all assigned servicings
exports.getAssignedServicingsAdmin = async (req, res) => {
  try {
    const services = await ServicingAssignment.findAll({
      where: { assignedBy: req.admin.id },
      include: [
        { model: CabsDetails },
        { model: Driver },
      ],
    });

    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// get single servicing by servicingId
exports.getServicingById = async (req, res) => {
  try {
    const { id } = req.params;

    const servicing = await ServicingAssignment.findByPk(id);

    if (!servicing) {
      return res.status(404).json({ message: "Servicing not found" });
    }

    res.status(200).json({ servicing });
  } catch (err) {
    console.error("Error fetching servicing by ID:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};





