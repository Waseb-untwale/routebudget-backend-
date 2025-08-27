// const CabAssignment = require('../models');
// const Driver = require('../models');
// const Cab = require('../models');

const { Driver, CabAssignment, CabsDetails,Admin } = require("../models");
const mongoose = require("mongoose");
const { Op } = require("sequelize");

const getFreeCabsForDriver = async (req, res) => {
  try {
    const driverId = req.driver.id; // assuming JWT middleware sets this correctly

    // 1. Find the driver by ID
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const adminId = driver.addedBy;

    // 2. Get assignments and all cabs added by that admin
    const [assignments, allCabs] = await Promise.all([
      CabAssignment.findAll({
        where: { assignedBy: adminId },
        include: [
          {
            model: CabsDetails,
          },
        ],
      }),
      CabsDetails.findAll({ where: { addedBy: adminId } }),
    ]);

    // 3. Extract assigned cab IDs
    const assignedCabIds = new Set();
    assignments.forEach((assgn) => {
      if (assgn.status === "assigned" && assgn.cabId) {
        assignedCabIds.add(assgn.cabId.toString());
      }
    });

    // 4. Filter free cabs
    const freeCabs = allCabs.filter(
      (cab) => !assignedCabIds.has(cab.id.toString())
    );

    return res.status(200).json({ freeCabs });
  } catch (err) {
    console.error("Error fetching free cabs:", err);
    return res.status(500).json({
      message: "Error fetching free cabs for driver",
      error: err.message,
    });
  }
};

const freeCabDriver = async (req, res) => {
  try {
    const adminId = req.admin.id;

    // Step 1: Fetch all assignments, drivers, and cabs added by this admin
    const [assignments, allDrivers, allCabs] = await Promise.all([
      CabAssignment.findAll({
        where: { assignedBy: adminId },
        include: [{ model: Driver }, { model: CabsDetails }],
      }),
      Driver.findAll({ where: { addedBy: adminId } }),
      CabsDetails.findAll({ where: { addedBy: adminId } }),
    ]);

    // Step 2: Collect assigned cab and driver IDs
    const assignedCabIds = new Set();
    const assignedDriverIds = new Set();

    assignments.forEach((assgn) => {
      if (assgn.status === "assigned") {
        if (assgn.cabId) assignedCabIds.add(assgn.cabId.toString());
        if (assgn.driverId) assignedDriverIds.add(assgn.driverId.toString());
      }
    });

    // Step 3: Filter unassigned (free) drivers and cabs
    const freeDrivers = allDrivers.filter(
      (driver) => !assignedDriverIds.has(driver.id.toString())
    );
    const freeCabs = allCabs.filter(
      (cab) => !assignedCabIds.has(cab.id.toString())
    );

    res.status(200).json({ freeDrivers, freeCabs });
  } catch (err) {
    console.error("Error fetching free cab/driver:", err);
    res.status(500).json({
      message: "Error fetching free cabs and drivers",
      error: err.message,
    });
  }
};

const assignTripToDriver = async (req, res) => {
  try {
    const { driverId, cabNumber, assignedBy } = req.body;

    // ✅ Check required fields
    if (!driverId || !cabNumber || !assignedBy) {
      return res
        .status(400)
        .json({
          message: "Driver ID, Cab Number, and Assigned By are required",
        });
    }

    // ✅ Find cab by ID or cabNumber
    let cab = null;
    if (!isNaN(cabNumber)) {
      // numeric ID
      cab = await CabsDetails.findByPk(cabNumber);
    }
    if (!cab) {
      // search by cabNumber string
      cab = await CabsDetails.findOne({ where: { cabNumber } });
    }

    if (!cab) {
      return res.status(404).json({ message: "Cab not found" });
    }

    // ✅ Check for existing assignment (either driver or cab already assigned and not completed)
    const existingAssignment = await CabAssignment.findOne({
      where: {
        [Op.or]: [
          { driverId, status: { [Op.ne]: "completed" } },
          { cabId: cab.id, status: { [Op.ne]: "completed" } },
        ],
      },
    });

    if (existingAssignment) {
      return res
        .status(400)
        .json({ message: "Driver or cab already has an active trip" });
    }

    // ✅ Create new trip assignment
    const assignment = await CabAssignment.create({
      driverId,
      cabId: cab.id,
      assignedBy,
      status: "assigned",
    });

    return res
      .status(201)
      .json({ message: "✅ Trip assigned to driver", assignment });
  } catch (error) {
    console.error("❌ Error assigning trip:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};


//correct code with odometer

// const updateTripDetailsByDriver = async (req, res) => {
//   try {
//     const driverId = req.driver.id;

//     const assignment = await CabAssignment.findOne({
//       where: {
//         driverId,
//         status: { [Op.ne]: "completed" },
//       },
//     });

//     if (!assignment) {
//       return res.status(404).json({
//         message: "No active trip found for this driver.",
//       });
//     }

//     const files = req.files || {};
//     const body = req.body || {};
//     const sanitizedBody = Object.fromEntries(
//       Object.entries(body).map(([k, v]) => [k.trim(), v])
//     );

//     const parseJSON = (val) => {
//       if (typeof val !== "string") return val || {};
//       try {
//         return JSON.parse(val);
//       } catch {
//         return {};
//       }
//     };

//     const extractPaths = (field) =>
//       Array.isArray(files[field]) ? files[field].map((f) => f.path) : [];

//     const mergeArray = (existing = [], incoming) =>
//       existing
//         .concat(Array.isArray(incoming) ? incoming : [incoming])
//         .filter((v) => v !== null && v !== undefined && v !== "");

//     const parseNumberArray = (incoming) => {
//       if (incoming === undefined || incoming === null) return [];
//       if (Array.isArray(incoming)) {
//         return incoming
//           .map((v) => {
//             const n = Number(v);
//             return isNaN(n) ? null : n;
//           })
//           .filter((v) => v !== null);
//       }
//       const n = Number(incoming);
//       return isNaN(n) ? [] : [n];
//     };

//     const calculateKm = (meters) =>
//       meters.reduce(
//         (acc, curr, i, arr) =>
//           i === 0 ? acc : acc + Math.max(0, curr - arr[i - 1]),
//         0
//       );

//     // ----------------- BASIC LOCATIONS -----------------
//     const updatedPickupLocation = body.pickupLocation || assignment.pickupLocation || null;
    
//     const updatedDropLocation = body.dropLocation || assignment.dropLocation || null;
   
//     console.log("Updated Pickup Location:", updatedPickupLocation)

//     if (sanitizedBody.location) {
//       assignment.location = {
//         ...assignment.location,
//         ...parseJSON(sanitizedBody.location),
//       };
//     }

//     // ----------------- FUEL -----------------
//     let updatedFuelAmount = mergeArray(
//       assignment.fuelAmount || [],
//       parseNumberArray(body.fuelAmount)
//     );
//     let updatedFuelReceiptImage = mergeArray(
//       assignment.fuelReceiptImage || [],
//       extractPaths("receiptImage")
//     );
//     let updatedFuelTransactionImage = mergeArray(
//       assignment.fuelTransactionImage || [],
//       extractPaths("transactionImage")
//     );

//     let updatedFuelType = assignment.fuelType;
//     if (body.fuelType && ["Cash", "Card"].includes(body.fuelType)) {
//       updatedFuelType = body.fuelType;
//     }

//     // ----------------- FASTTAG -----------------
//     let updatedFastTagAmount = mergeArray(
//       assignment.fastTagAmount || [],
//       parseNumberArray(body.fastTagAmount)
//     );
//     let updatedFastTagPaymentMode = body.fastTagPaymentMode && ["Online Deduction", "Cash", "Card"].includes(body.fastTagPaymentMode)
//       ? body.fastTagPaymentMode
//       : assignment.fastTagPaymentMode;
//     let updatedFastTagCardDetails = body.fastTagCardDetails || assignment.fastTagCardDetails;

//     if (sanitizedBody.fastTag) {
//       const tag = parseJSON(sanitizedBody.fastTag);
//       updatedFastTagAmount = mergeArray(updatedFastTagAmount, parseNumberArray(tag.amount));
//       if (["Online Deduction", "Cash", "Card"].includes(tag.paymentMode)) {
//         updatedFastTagPaymentMode = tag.paymentMode;
//       }
//       if (tag.cardDetails) {
//         updatedFastTagCardDetails = tag.cardDetails;
//       }
//     }

//     // ----------------- TYRE PUNCTURE -----------------
//     let updatedTyreRepairAmount = mergeArray(
//       assignment.tyreRepairAmount || [],
//       parseNumberArray(body.tyreRepairAmount)
//     );
//     let updatedTyreImage = mergeArray(
//       assignment.tyreImage || [],
//       extractPaths("punctureImage")
//     );

//     if (sanitizedBody.tyrePuncture) {
//       const tyre = parseJSON(sanitizedBody.tyrePuncture);
//       updatedTyreRepairAmount = mergeArray(updatedTyreRepairAmount, parseNumberArray(tyre.repairAmount));
//     }

//     // ----------------- VEHICLE SERVICING -----------------
//     let updatedServicingAmount = mergeArray(
//       assignment.servicingAmount || [],
//       parseNumberArray(body.servicingAmount)
//     );
//     let updatedServicingMeter = mergeArray(
//       assignment.servicingMeter || [],
//       parseNumberArray(body.servicingMeter)
//     );
//     let updatedServicingImage = mergeArray(
//       assignment.servicingImage || [],
//       extractPaths("vehicleServicingImage")
//     );
//     let updatedServicingReceiptImage = mergeArray(
//       assignment.servicingReceiptImage || [],
//       extractPaths("vehicleServicingReceiptImage")
//     );

//     if (sanitizedBody.vehicleServicing) {
//       const service = parseJSON(sanitizedBody.vehicleServicing);
//       updatedServicingAmount = mergeArray(updatedServicingAmount, parseNumberArray(service.amount));
//       updatedServicingMeter = mergeArray(updatedServicingMeter, parseNumberArray(service.meter));
//     }

//     // Calculate KM travelled
//     let updatedServicingKmTravelled = updatedServicingMeter.length > 0
//       ? calculateKm(updatedServicingMeter)
//       : assignment.servicingKmTravelled || 0;

//     let updatedservicingRequired = assignment.servicingRequired;

//     // Reset if servicing is completed
//     if (
//       updatedServicingAmount.length > (assignment.servicingAmount?.length || 0) &&
//       updatedservicingRequired
//     ) {
//       updatedServicingKmTravelled = 0;
//       updatedservicingRequired = false;
//       updatedServicingMeter = [];
//     } else if (updatedServicingKmTravelled > 10000) {
//       updatedservicingRequired = true;
//     }

//     // ----------------- OTHER PROBLEMS -----------------
//     let updatedOtherAmount = mergeArray(
//       assignment.otherAmount || [],
//       parseNumberArray(body.otherAmount)
//     );
//     let updatedOtherImage = mergeArray(
//       assignment.otherImage || [],
//       extractPaths("otherProblemsImage")
//     );
//     let updatedOtherDetails = body.otherDetails || assignment.otherDetails || "";

//     if (sanitizedBody.otherProblems) {
//       const other = parseJSON(sanitizedBody.otherProblems);
//       updatedOtherAmount = mergeArray(updatedOtherAmount, parseNumberArray(other.amount));
//       if (other.details) {
//         updatedOtherDetails = other.details;
//       }
//     }

//     // ----------------- UPDATE DB -----------------
//     await assignment.update({
//       pickupLocation: updatedPickupLocation,
//       dropLocation: updatedDropLocation,
//       fuelAmount: updatedFuelAmount,
//       fuelReceiptImage: updatedFuelReceiptImage,
//       fuelTransactionImage: updatedFuelTransactionImage,
//       fuelType: updatedFuelType,
//       fastTagAmount: updatedFastTagAmount,
//       fastTagPaymentMode: updatedFastTagPaymentMode,
//       fastTagCardDetails: updatedFastTagCardDetails,
//       tyreRepairAmount: updatedTyreRepairAmount,
//       tyreImage: updatedTyreImage,
//       servicingAmount: updatedServicingAmount,
//       servicingMeter: updatedServicingMeter,
//       servicingImage: updatedServicingImage,
//       servicingReceiptImage: updatedServicingReceiptImage,
//       servicingKmTravelled: updatedServicingKmTravelled,
//       servicingRequired: updatedservicingRequired,
//       otherAmount: updatedOtherAmount,
//       otherImage: updatedOtherImage,
//       otherDetails: updatedOtherDetails,
//     });

//     const updatedAssignment = await CabAssignment.findByPk(assignment.id);

//     res.status(200).json({
//       message: "✅ Trip details updated successfully",
//       assignment: updatedAssignment,
//     });
//   } catch (err) {
//     console.error("❌ Trip update error:", err);
//     res.status(500).json({
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };



const updateTripDetailsByDriver = async (req, res) => {
  try {
    const driverId = req.driver.id;

    const assignment = await CabAssignment.findOne({
      where: {
        driverId,
        status: { [Op.ne]: "completed" },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message: "No active trip found for this driver.",
      });
    }

    const files = req.files || {};
    const body = req.body || {};
    const sanitizedBody = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k.trim(), v])
    );

    const parseJSON = (val) => {
      if (typeof val !== "string") return val || {};
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    };

    const extractPaths = (field) =>
      Array.isArray(files[field]) ? files[field].map((f) => f.path) : [];

    const mergeArray = (existing = [], incoming) =>
      existing
        .concat(Array.isArray(incoming) ? incoming : [incoming])
        .filter((v) => v !== null && v !== undefined && v !== "");

    const parseNumberArray = (incoming) => {
      if (incoming === undefined || incoming === null) return [];
      if (Array.isArray(incoming)) {
        return incoming
          .map((v) => {
            const n = Number(v);
            return isNaN(n) ? null : n;
          })
          .filter((v) => v !== null);
      }
      const n = Number(incoming);
      return isNaN(n) ? [] : [n];
    };

    // ----------------- BASIC LOCATIONS -----------------
    const updatedPickupLocation = body.pickupLocation || assignment.pickupLocation || null;
    const updatedDropLocation = body.dropLocation || assignment.dropLocation || null;

    console.log("Updated Pickup Location:", updatedPickupLocation)

    if (sanitizedBody.location) {
      assignment.location = {
        ...assignment.location,
        ...parseJSON(sanitizedBody.location),
      };
    }

    // ----------------- FUEL -----------------
    let updatedFuelAmount = mergeArray(
      assignment.fuelAmount || [],
      parseNumberArray(body.fuelAmount)
    );
    let updatedFuelReceiptImage = mergeArray(
      assignment.fuelReceiptImage || [],
      extractPaths("receiptImage")
    );
    let updatedFuelTransactionImage = mergeArray(
      assignment.fuelTransactionImage || [],
      extractPaths("transactionImage")
    );

    let updatedFuelType = assignment.fuelType;
    if (body.fuelType && ["Cash", "Card"].includes(body.fuelType)) {
      updatedFuelType = body.fuelType;
    }

    // ----------------- FASTTAG -----------------
    let updatedFastTagAmount = mergeArray(
      assignment.fastTagAmount || [],
      parseNumberArray(body.fastTagAmount)
    );
    let updatedFastTagPaymentMode = body.fastTagPaymentMode && ["Online Deduction", "Cash", "Card"].includes(body.fastTagPaymentMode)
      ? body.fastTagPaymentMode
      : assignment.fastTagPaymentMode;
    let updatedFastTagCardDetails = body.fastTagCardDetails || assignment.fastTagCardDetails;

    if (sanitizedBody.fastTag) {
      const tag = parseJSON(sanitizedBody.fastTag);
      updatedFastTagAmount = mergeArray(updatedFastTagAmount, parseNumberArray(tag.amount));
      if (["Online Deduction", "Cash", "Card"].includes(tag.paymentMode)) {
        updatedFastTagPaymentMode = tag.paymentMode;
      }
      if (tag.cardDetails) {
        updatedFastTagCardDetails = tag.cardDetails;
      }
    }

    // ----------------- TYRE PUNCTURE -----------------
    let updatedTyreRepairAmount = mergeArray(
      assignment.tyreRepairAmount || [],
      parseNumberArray(body.tyreRepairAmount)
    );
    let updatedTyreImage = mergeArray(
      assignment.tyreImage || [],
      extractPaths("punctureImage")
    );

    if (sanitizedBody.tyrePuncture) {
      const tyre = parseJSON(sanitizedBody.tyrePuncture);
      updatedTyreRepairAmount = mergeArray(updatedTyreRepairAmount, parseNumberArray(tyre.repairAmount));
    }

    // ----------------- VEHICLE SERVICING -----------------
    let updatedServicingAmount = mergeArray(
      assignment.servicingAmount || [],
      parseNumberArray(body.servicingAmount)
    );

    // 🔹 REPLACED servicingMeter with servicingKM
    let updatedServicingMeter= mergeArray(
      assignment.servicingMeter || [],
      parseNumberArray(body.servicingMeter)
    );

    let updatedServicingImage = mergeArray(
      assignment.servicingImage || [],
      extractPaths("vehicleServicingImage")
    );
    let updatedServicingReceiptImage = mergeArray(
      assignment.servicingReceiptImage || [],
      extractPaths("vehicleServicingReceiptImage")
    );

    if (sanitizedBody.vehicleServicing) {
      const service = parseJSON(sanitizedBody.vehicleServicing);
      updatedServicingAmount = mergeArray(updatedServicingAmount, parseNumberArray(service.amount));
      updatedServicingMeter = mergeArray(updatedServicingMeter, parseNumberArray(service.servicingMeter));
    }

    // 🔹 Directly sum trip km
    let updatedServicingKmTravelled = updatedServicingMeter.reduce((a, b) => a + b, 0);

    let updatedservicingRequired = assignment.servicingRequired;

    // Reset if servicing is completed
    if (
      updatedServicingAmount.length > (assignment.servicingAmount?.length || 0) &&
      updatedservicingRequired
    ) {
      updatedServicingKmTravelled = 0;
      updatedservicingRequired = false;
      updatedServicingMeter = [];
    } else if (updatedServicingKmTravelled > 10000) {
      updatedservicingRequired = true;
    }

    // ----------------- OTHER PROBLEMS -----------------
    let updatedOtherAmount = mergeArray(
      assignment.otherAmount || [],
      parseNumberArray(body.otherAmount)
    );
    let updatedOtherImage = mergeArray(
      assignment.otherImage || [],
      extractPaths("otherProblemsImage")
    );
    let updatedOtherDetails = body.otherDetails || assignment.otherDetails || "";

    if (sanitizedBody.otherProblems) {
      const other = parseJSON(sanitizedBody.otherProblems);
      updatedOtherAmount = mergeArray(updatedOtherAmount, parseNumberArray(other.amount));
      if (other.details) {
        updatedOtherDetails = other.details;
      }
    }

    // ----------------- UPDATE DB -----------------
    await assignment.update({
      pickupLocation: updatedPickupLocation,
      dropLocation: updatedDropLocation,
      fuelAmount: updatedFuelAmount,
      fuelReceiptImage: updatedFuelReceiptImage,
      fuelTransactionImage: updatedFuelTransactionImage,
      fuelType: updatedFuelType,
      fastTagAmount: updatedFastTagAmount,
      fastTagPaymentMode: updatedFastTagPaymentMode,
      fastTagCardDetails: updatedFastTagCardDetails,
      tyreRepairAmount: updatedTyreRepairAmount,
      tyreImage: updatedTyreImage,
      servicingAmount: updatedServicingAmount,
      servicingMeter: updatedServicingMeter,   // 🔹 updated field
      servicingImage: updatedServicingImage,
      servicingReceiptImage: updatedServicingReceiptImage,
      servicingKmTravelled: updatedServicingKmTravelled,
      servicingRequired: updatedservicingRequired,
      otherAmount: updatedOtherAmount,
      otherImage: updatedOtherImage,
      otherDetails: updatedOtherDetails,
    });

    const updatedAssignment = await CabAssignment.findByPk(assignment.id);

    res.status(200).json({
      message: "✅ Trip details updated successfully",
      assignment: updatedAssignment,
    });
  } catch (err) {
    console.error("❌ Trip update error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};



/**it is Mine code */
// const getAssignCab = async (req, res) => {
//   try {
//     const adminId = req.admin.id;
//     console.log("adminId", adminId);

//     const assignments = await CabAssignment.findAll({
//       where: { assignedBy: adminId },
//       include: [
//         { model: CabsDetails},
//         { model: Driver}
//       ]
//     });

//     res.status(200).json({
//       assignments, // 👈 React code expects this key
//       pagination: null // Optional: if you're handling pagination
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

/**It Team code */

const getAssignCab = async (req, res) => {
  try {
    const adminId = req.admin.id;
    console.log("adminId", adminId);

    const assignments = await CabAssignment.findAll({
      where: {
        assignedBy: adminId
      },
      include: [
        {
          model: CabsDetails,
        },
        {
          model: Driver,
        },
      ],
    });

    console.log("assignments", assignments);

    res.status(200).json({
      assignments,
    });
  } catch (error) {
    console.error("Error fetching assigned cabs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getDriverAssignedCabs= async(req,res)=>{
  const driverId = req.driver.id; 
  console.log("drivreId",driverId)

  const assignment =await CabAssignment.findAll({
    where:{
      driverId:driverId,
      status:"assigned"
    }
  })

  console.log("assignment",assignment)

  if(!assignment){
    return res.status(404).json({message:"No active trip found for this driver."})
  }

  res.status(200).json({assignment:assignment})
}

//without add customerdetails
// const assignCab = async (req, res) => {
//   try {
//     const { driverId, cabNumber, assignedBy } = req.body;

//     if (!driverId || !cabNumber || !assignedBy) {
//       return res.status(400).json({
//         message: 'Driver ID, Cab Number, and Assigned By are required',
//       });
//     }

//     // Find the cab by ID (UUID) or cabNumber
//     let cab;
//     if (/^[0-9a-fA-F]{24}$/.test(cabNumber)) {
//       // If it's in ObjectId format (for backwards compatibility)
//       cab = await CabsDetails.findOne({ where: { id: cabNumber } });
//     } else {
//       cab = await CabsDetails.findOne({ where: { cabNumber } });
//     }

//     if (!cab) {
//       return res.status(404).json({ message: 'Cab not found' });
//     }

//     // Check if driver already has an active assignment
//     const existingDriverAssignment = await CabAssignment.findOne({
//       where: {
//         driverId,
//         status: { [Op.ne]: 'completed' },
//       },
//     });

//     if (existingDriverAssignment) {
//       return res.status(400).json({
//         message: 'This driver already has an active cab assigned',
//       });
//     }

//     // Check if cab is already assigned
//     const existingCabAssignment = await CabAssignment.findOne({
//       where: {
//         cabId: cab.id,
//         status: { [Op.ne]: 'completed' },
//       },
//     });

//     if (existingCabAssignment) {
//       return res.status(400).json({
//         message: 'This cab is already assigned to another driver',
//       });
//     }

//     // Create a new assignment
//     const newAssignment = await CabAssignment.create({
//       driverId,
//       cabId: cab.id,
//       assignedBy,
//       status: 'ongoing', // assuming default is 'ongoing'
//     });

//     res.status(201).json({
//       message: 'Cab assigned successfully',
//       assignment: newAssignment,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

//assignCabwithcustomerDetails

const assignCab = async (req, res) => {
  try {
    const {
      driverId,
      cabNumber,
      assignedBy,
      customerName,
      customerPhone,
      pickupLocation,
      dropLocation,
      tripType,
      vehicleType,
      duration,
      estimatedDistance,
      estimatedFare,
      scheduledPickupTime,
      specialInstructions,
      adminNotes,
    } = req.body;

    // if (
    //   !driverId || !cabNumber || !assignedBy ||
    //   !customerName || !customerPhone || !pickupLocation || !dropLocation ||
    //   !tripType || !vehicleType
    // ) {
    //   return res.status(400).json({
    //     message: "Missing required fields",
    //   });
    // }

    // Find Cab
    let cab;
    if (/^[0-9a-fA-F]{24}$/.test(cabNumber)) {
      cab = await CabsDetails.findOne({ where: { id: cabNumber } });
    } else {
      cab = await CabsDetails.findOne({ where: { cabNumber } });
    }

    if (!cab) {
      return res.status(404).json({ message: "Cab not found" });
    }

    // Check Driver Assignment
    const existingDriverAssignment = await CabAssignment.findOne({
      where: {
        driverId,
        status: { [Op.ne]: "completed" },
      },
    });

    if (existingDriverAssignment) {
      return res.status(400).json({
        message: "Driver already has an active cab assignment",
      });
    }

    // Check Cab Assignment
    const existingCabAssignment = await CabAssignment.findOne({
      where: {
        cabId: cab.id,
        status: { [Op.ne]: "completed" },
      },
    });

    if (existingCabAssignment) {
      return res.status(400).json({
        message: "Cab is already assigned to another driver",
      });
    }

    // Create Assignment
    const newAssignment = await CabAssignment.create({
      driverId,
      cabId: cab.id,
      assignedBy,
      status: "assigned",

      // Customer & Trip Info
      customerName,
      customerPhone,
      pickupLocation,
      dropLocation,
      tripType,
      vehicleType,
      duration,
      estimatedDistance,
      estimatedFare,
      scheduledPickupTime,
      specialInstructions,
      adminNotes,
    });

    return res.status(201).json({
      message: "Cab assigned successfully",
      assignment: newAssignment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const driverAssignCab = async (req, res) => {
  try {
    const { cabNumber, assignedBy } = req.body;
    const driverId = req.driver.id; // Authenticated driver
    console.log("cabNumber,assignedBy a", cabNumber, assignedBy, driverId);

    if (!cabNumber || !assignedBy) {
      return res
        .status(400)
        .json({
          message: "Driver ID, Cab Number, and Assigned By are required",
        });
    }

    // ✅ Find cab by cabNumber
    const cab = await CabsDetails.findOne({ where: { cabNumber } });

    if (!cab) {
      return res.status(404).json({ message: "Cab not found" });
    }

    // ✅ Check if driver already has an active assignment
    const existingDriverAssignment = await CabAssignment.findOne({
      where: {
        driverId,
        status: { [Op.ne]: "completed" },
      },
    });

    if (existingDriverAssignment) {
      return res
        .status(400)
        .json({ message: "This driver already has an active cab assigned" });
    }

    // ✅ Check if cab is already assigned
    const existingCabAssignment = await CabAssignment.findOne({
      where: {
        cabId: cab.id,
        status: { [Op.ne]: "completed" },
      },
    });

    if (existingCabAssignment) {
      return res
        .status(400)
        .json({ message: "This cab is already assigned to another driver" });
    }

    // ✅ Assign cab to driver
    const newAssignment = await CabAssignment.create({
      driverId,
      cabId: cab.id,
      assignedBy,
      status: "assigned", // set default if applicable
    });

    res.status(201).json({
      message: "Cab assigned successfully",
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Assignment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Mark a trip as completed (call this from driver or sub-admin when trip ends)
// const completeTrip = async (req, res) => {
//   try {
//     const assignmentId = req.params.id;
//     const assignment = await CabAssignment.findById(assignmentId);

//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     assignment.status = "completed";
//     await assignment.save();

//     res.json({ message: "Trip marked as completed", assignment });
//   } catch (err) {
//     res.status(500).json({ message: "Server Error", error: err.message });
//   }
// };

const completeTrip = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    // Find assignment by primary key (ID)
    const assignment = await CabAssignment.findByPk(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Update the status
    assignment.status = "completed";
    await assignment.save();

    res.json({ message: "Trip marked as completed", assignment });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const completeTripByAdmin = async (req, res) => {
  try {
    if (!["superadmin", "subadmin", "Admin"].includes(req.admin.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const assignmentId = req.params.id;
    const assignment = await CabAssignment.findByPk(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.status = "completed";
    await assignment.save();

    res.json({ message: "Trip marked as completed by admin", assignment });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ✅ Unassign cab (only owner or super admin)
// const unassignCab = async (req, res) => {
//   try {
//     const adminId = req.admin.id;
//     const adminRole = req.admin.role;

//     const cabAssignment = await CabAssignment.findById(req.params.id);
//     if (!cabAssignment) return res.status(404).json({ message: "Cab assignment not found" });

//     if (cabAssignment.assignedBy.toString() !== adminId && adminRole !== "super-admin") {
//       return res.status(403).json({ message: "Unauthorized: You can only unassign cabs assigned by you" });
//     }

//     await CabAssignment.findByIdAndDelete(req.params.id);
//     res.status(200).json({ message: "Cab unassigned successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

const unassignCab = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const adminRole = req.admin.role;
    const assignmentId = req.params.id;

    // Step 1: Find the cab assignment
    const cabAssignment = await CabAssignment.findByPk(assignmentId);

    if (!cabAssignment) {
      return res.status(404).json({ message: "Cab assignment not found" });
    }

    // Step 2: Check authorization
    if (cabAssignment.assignedBy !== adminId && adminRole !== "super-admin") {
      return res
        .status(403)
        .json({
          message: "Unauthorized: You can only unassign cabs assigned by you",
        });
    }

    // Step 3: Delete the assignment
    await CabAssignment.destroy({ where: { id: assignmentId } });

    res.status(200).json({ message: "Cab unassigned successfully" });
  } catch (error) {
    console.error("Error in unassignCab:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Get all current (not completed) assignments for logged-in driver
// const getAssignDriver = async (req, res) => {
//   try {
//     const driverId = req.driver.id;
//     const assignments = await CabAssignment.find({ driver: driverId, status: { $ne: "completed" } })
//       .populate("cab")
//       .populate("driver");

//     if (!assignments.length) {
//       return res.status(404).json({ message: "No active cab assignments found for this driver." });
//     }

//     res.status(200).json(assignments);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

const getAssignDriver = async (req, res) => {
  try {
    const driverId = req.driver.id;

    const assignments = await CabAssignment.findAll({
      where: {
        driverId: driverId,
        status: {
          [Op.ne]: "completed",
        },
      },
      include: [
        {
          model: CabsDetails,
        },
        {
          model: Driver,
        },
        {
          model:Admin,
        }
      ],
    });

    if (!assignments.length) {
      return res
        .status(404)
        .json({ message: "No active cab assignments found for this driver." });
    }

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Edit the logged-in driver's profile
// const EditDriverProfile = async (req, res) => {
//   try {
//     const driverId = req.driver.id;
//     const updatedDriver = await Driver.findByIdAndUpdate(driverId, req.body, {
//       new: true,
//       runValidators: true
//     }).select("-password");

//     if (!updatedDriver) return res.status(404).json({ message: "Driver not found" });

//     res.json({ message: "Profile updated successfully", updatedDriver });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const EditDriverProfile = async (req, res) => {
  try {
    const driverId = req.driver.id;

    // Step 1: Update driver record
    const [updatedCount, updatedRows] = await Driver.update(req.body, {
      where: { id: driverId },
      returning: true, // return updated data
    });

    // Step 2: Check if driver was found
    if (updatedCount === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Step 3: Remove password before sending back
    const updatedDriver = updatedRows[0].toJSON();
    delete updatedDriver.password;

    // Step 4: Send response
    res.json({
      message: "Profile updated successfully",
      updatedDriver,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getFreeCabsForDriver,
  freeCabDriver,
  assignCab,
  getAssignCab,
  unassignCab,
  EditDriverProfile,
  getAssignDriver,
  completeTrip,
  getDriverAssignedCabs,
  assignTripToDriver,
  updateTripDetailsByDriver,
  completeTripByAdmin,
  driverAssignCab,
};
