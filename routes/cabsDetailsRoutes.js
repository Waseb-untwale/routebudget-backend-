
// const express = require("express");
// const router = express.Router();
// // const Cab = require("../models/CabsDetails");
// // const Driver = require("../models/loginModel");
// const { Cab,Driver,CabsDetails } = require("../models");
// // const CabAssigment = require('../models/CabAssignment')
// const upload = require("../middleware/uploadFields");
// const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
// const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");

// router.patch('/add', authMiddleware, isAdmin, upload, async (req, res) => {
//     try {
//         console.log("📝 Request Body:", req.body);
//         console.log("📂 Uploaded Files:", req.files);

//         const { cabNumber, insuranceNumber, insuranceExpiry, registrationNumber } = req.body;

//         if (!cabNumber) {
//             return res.status(400).json({ message: "Cab number is required" });
//         }
//         const existingCab = await CabsDetails.findOne({ where: { cabNumber } });

//         if (existingCab) {
//             return res.status(400).json({ message: "Cab number already exists" });
//         }
//         const cabImage = req.files?.cabImage?.[0]?.path || "";

//         const newCab = await CabsDetails.create({
//             cabNumber,
//             insuranceNumber: insuranceNumber || '',
//             insuranceExpiry: insuranceExpiry || null,
//             registrationNumber: registrationNumber || '',
//             cabImage,
//             addedBy: req.admin?.id || null,
//         });
//         // await newCab.save();

//         return res.status(201).json({ message: "New cab created successfully", cab: newCab });

//     } catch (error) {
//         console.error("🚨 Error creating cab:", error); 
//         return res.status(500).json({
//             message: "Error creating cab",
//             error: error?.message || "Internal Server Error"
//         });
//     }
// });
// router.patch('/driver/add', driverAuthMiddleware, upload, async (req, res) => {
//     try {
//         console.log("📝 Request Body:", req.body);
//         console.log("📂 Uploaded Files:", req.files);

//         const { cabNumber, ...updateFields } = req.body;

//         if (!cabNumber) {
//             return res.status(400).json({ message: "Cab number is required" });
//         }

//         let existingCab = await Cab.findOne({ cabNumber });

//         // Safely parse JSON
//         const parseJSONSafely = (data, defaultValue = {}) => {
//             if (!data) return defaultValue;
//             try {
//                 return typeof data === "string" ? JSON.parse(data) : data;
//             } catch (error) {
//                 console.error(`JSON Parsing Error for ${data}:`, error.message);
//                 return defaultValue;
//             }
//         };

//         const calculateKmTravelled = (meterReadings) => {
//             let totalMeters = 0;
//             for (let i = 1; i < meterReadings.length; i++) {
//                 const diff = meterReadings[i] - meterReadings[i - 1];
//                 if (diff > 0) {
//                     totalMeters += diff;
//                 }
//             }
//             return Math.round(totalMeters); // convert to KM
//         };

//         const parsedFuel = parseJSONSafely(updateFields.fuel);
//         const parsedFastTag = parseJSONSafely(updateFields.fastTag);
//         const parsedTyre = parseJSONSafely(updateFields.tyrePuncture);
//         const parsedService = parseJSONSafely(updateFields.vehicleServicing);
//         const parsedOther = parseJSONSafely(updateFields.otherProblems);

//         // Handle Uploaded Images
//         const uploadedImages = {
//             fuel: {
//                 receiptImage: req.files?.receiptImage?.[0]?.path || existingCab?.fuel?.receiptImage,
//                 transactionImage: req.files?.transactionImage?.[0]?.path || existingCab?.fuel?.transactionImage,
//             },
//             tyrePuncture: {
//                 image: req.files?.punctureImage?.[0]?.path || existingCab?.tyrePuncture?.image,
//             },
//             vehicleServicing: {
//                 image: req.files?.vehicleServicingImage?.[0]?.path,
//                 receiptImage: req.files?.vehicleServicingReceiptImage?.[0]?.path,
//             },
//             otherProblems: {
//                 image: req.files?.otherProblemsImage?.[0]?.path || existingCab?.otherProblems?.image,
//             },
//             cabImage: req.files?.cabImage?.[0]?.path || existingCab?.cabImage,
//         };

//         // Update the existing meter readings and calculate kmTravelled if meter is given
//         let updatedMeter = [...(existingCab?.vehicleServicing?.meter || [])];
//         if (parsedService?.meter) {
//             const newMeter = Number(parsedService.meter);
//             if (!isNaN(newMeter)) {
//                 updatedMeter.push(newMeter);
//             }
//         }
//         const kmTravelled = calculateKmTravelled(updatedMeter);

//         // Construct vehicleServicing only if any data or image is passed
//         let vehicleServicingData = existingCab?.vehicleServicing || {};
//         if (
//             parsedService ||
//             uploadedImages.vehicleServicing.image ||
//             uploadedImages.vehicleServicing.receiptImage
//         ) {
//             vehicleServicingData = {
//                 ...vehicleServicingData,
//                 ...parsedService,
//                 meter: updatedMeter,
//                 kmTravelled: kmTravelled,
//                 image: [
//                     ...(existingCab?.vehicleServicing?.image || []),
//                     ...(uploadedImages.vehicleServicing.image ? [uploadedImages.vehicleServicing.image] : [])
//                 ],
//                 receiptImage: [
//                     ...(existingCab?.vehicleServicing?.receiptImage || []),
//                     ...(uploadedImages.vehicleServicing.receiptImage ? [uploadedImages.vehicleServicing.receiptImage] : [])
//                 ],
//                 amount: [
//                     ...(existingCab?.vehicleServicing?.amount || []),
//                     ...(Array.isArray(parsedService?.amount)
//                         ? parsedService.amount
//                         : parsedService?.amount ? [parsedService.amount] : [])
//                 ],
//                 totalKm: parsedService?.totalKm || existingCab?.vehicleServicing?.totalKm,
//             };
//         }

//         const updateData = {
//             cabNumber,
//             insuranceNumber: updateFields.insuranceNumber || existingCab?.insuranceNumber,
//             insuranceExpiry: updateFields.insuranceExpiry || existingCab?.insuranceExpiry,
//             registrationNumber: updateFields.registrationNumber || existingCab?.registrationNumber,
//             location: { ...existingCab?.location, ...parseJSONSafely(updateFields.location) },
//             fuel: { ...existingCab?.fuel, ...parsedFuel, ...uploadedImages.fuel },
//             fastTag: { ...existingCab?.fastTag, ...parsedFastTag },
//             tyrePuncture: { ...existingCab?.tyrePuncture, ...parsedTyre, ...uploadedImages.tyrePuncture },
//             vehicleServicing: vehicleServicingData,
//             otherProblems: { ...existingCab?.otherProblems, ...parsedOther, ...uploadedImages.otherProblems },
//             cabImage: uploadedImages.cabImage,
//             addedBy: req.admin?.id || existingCab?.addedBy,
//         };

//         if (!existingCab) {
//             const newCab = new Cab(updateData);
//             await newCab.save();
//             return res.status(201).json({ message: "New cab created successfully", cab: newCab });
//         } else {
//             const updatedCab = await Cab.findOneAndUpdate(
//                 { cabNumber },
//                 { $set: updateData },
//                 { new: true, runValidators: true }
//             );
//             return res.status(200).json({ message: "Cab data updated successfully", cab: updatedCab });
//         }
//     } catch (error) {
//         console.error("🚨 Error updating/creating cab:", error.message);
//         res.status(500).json({ message: "Error updating/creating cab", error: error.message });
//     }
// });
// // ✅ 2️⃣ Get All Cabs
// router.get("/", authMiddleware, isAdmin, async (req, res) => {
//     try {
//         const cabs = await Cab.find({ addedBy: req.admin.id });
//         res.status(200).json(cabs);
//     } catch (error) {
//         res.status(500).json({ error: "Server error", details: error.message });
//     }
// });

// router.get("/driver", driverAuthMiddleware, async (req, res) => {
//     try {

//         const driver = await Driver.findById(req.driver.id );
//         const adminsCab = await Cab.find({ addedBy: driver.addedBy });
//         res.status(200).json({"Driver Detail":driver,"Cab Admin":adminsCab});
//     } catch (error) {
//         res.status(500).json({ error: "Server error", details: error.message });
//     }
// });
// // ✅ 3️⃣ Get a Single Cab by ID
// router.get("/:id", authMiddleware, isAdmin, async (req, res) => {
//     try {
//         const cab = await Cab.findById(req.params.id).populate("addedBy", "name email");
//         if (!cab) return res.status(404).json({ error: "Cab not found" });

//         res.status(200).json(cab);
//     } catch (error) {
//         res.status(500).json({ error: "Server error", details: error.message });
//     }
// });
// router.delete("/delete/:id", authMiddleware, isAdmin, async (req, res) => {
//     try {
//         const cab = await Cab.findById(req.params.id);
//         if (!cab) return res.status(404).json({ error: "Cab not found" });

//         await cab.deleteOne();
//         res.status(200).json({ message: "Cab deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: "Server error", details: error.message });
//     }
// });
// router.put('/:id', authMiddleware, isAdmin, upload, async (req, res) => {
//     try {
//         const { id } = req.params;

//         const updatedFields = {
//             cabNumber: req.body.cabNumber,
//             insuranceNumber: req.body.insuranceNumber,
//             registrationNumber: req.body.registrationNumber,
//         };

//         // Optional: update cabImage if file is uploaded
//         if (req.files?.cabImage?.[0]) {
//             updatedFields.cabImage = req.files.cabImage[0].path;
//         }

//         const updatedCab = await Cab.findByIdAndUpdate(id, updatedFields, {
//             new: true,
//             runValidators: true,
//         });

//         if (!updatedCab) {
//             return res.status(404).json({ message: "Cab not found" });
//         }

//         res.status(200).json({ message: "Cab updated successfully", cab: updatedCab });
//     } catch (error) {
//         console.error("Update cab failed:", error);
//         res.status(500).json({ message: "Failed to update cab", error: error.message });
//     }
// });
// module.exports = router;





const express = require("express");
const router = express.Router();
const { CabsDetails } = require("../models");
const { Driver } = require("../models");
const Cabassigment = require("../models/CabAssignment");
const upload = require("../middleware/uploadFields");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");
const { Admin } = require("../models");
const { Op } = require("sequelize");

// DONE
// router.patch("/add", authMiddleware, isAdmin, upload, async (req, res) => {
//   // DONE
//   try {
//     console.log("📝 Request Body:", req.body);
//     console.log("📂 Uploaded Files:", req.files);

//     const { cabNumber, insuranceNumber, imei,insuranceExpiry, registrationNumber } =
//       req.body;

//     if (!cabNumber) {
//       return res.status(400).json({ message: "Cab number is required" });
//     }

//     const existingCab = await CabsDetails.findOne({ where: { cabNumber } });

//     if (existingCab) {
//       return res.status(400).json({ message: "Cab number already exists" });
//     }

//     const cabImage = req.files?.cabImage?.[0]?.path || "";

//     const newCab = await CabsDetails.create({
//       cabNumber,
//       insuranceNumber: insuranceNumber || "",
//       insuranceExpiry: insuranceExpiry || null,
//       registrationNumber: registrationNumber || "",
//       cabImage,
//       addedBy: req.admin?.id || null,
//     });

//     // await newCab.save();

//     return res
//       .status(201)
//       .json({ message: "New cab created successfully", cab: newCab });
//   } catch (error) {
//     console.error("🚨 Error creating cab:", error);
//     return res.status(500).json({
//       message: "Error creating cab",
//       error: error?.message || "Internal Server Error",
//     });
//   }
// });


router.patch("/add", authMiddleware, isAdmin, upload ,async (req, res) => {
  try {
    console.log("📝 Request Body:", req.body);
    console.log("📂 Uploaded Files:", req.files);

    const {
      cabNumber,
      insuranceNumber,
      imei,
      insuranceExpiry,
      registrationNumber,
    } = req.body;
     
    console.log(cabNumber)
    // Check required fields
    if (!cabNumber) {
      return res.status(400).json({ message: "Cab number is required" });
    }

    if (!imei) {
      return res.status(400).json({ message: "IMEI number is required" });
    }

    // Check for existing cab by cab number or IMEI
    const existingCab = await CabsDetails.findOne({
      where: {
        [Op.or]: [{ cabNumber }, { imei }],
      },
    });

    if (existingCab) {
      return res.status(400).json({
        message: existingCab.cabNumber === cabNumber
          ? "Cab number already exists"
          : "IMEI already assigned to another cab",
      });
    }

    // Extract cab image if uploaded
    const cabImage = req.files?.cabImage?.[0]?.path || "";

    // Create new cab
    const newCab = await CabsDetails.create({
      cabNumber,
      imei,
      insuranceNumber: insuranceNumber || "",
      insuranceExpiry: insuranceExpiry || null,
      registrationNumber: registrationNumber || "",
      cabImage,
      addedBy: req.admin?.id || null,
    });

    return res
      .status(201)
      .json({ message: "New cab created successfully", cab: newCab });
  } catch (error) {
    console.error("🚨 Error creating cab:", error);
    return res.status(500).json({
      message: "Error creating cab",
      error: error?.message || "Internal Server Error",
    });
  }
});

//Done 
// router.patch("/driver/add", driverAuthMiddleware, upload, async (req, res) => {
//   try {
//     console.log("📝 Request Body:", req.body);
//     console.log("📂 Uploaded Files:", req.files);

//     const { cabNumber, ...updateFields } = req.body;

//     if (!cabNumber) {
//       return res.status(400).json({ message: "Cab number is required" });
//     }

//     let existingCab = await CabsDetails.findOne({ where: { cabNumber } });

//     const parseJSONSafely = (data, defaultValue = {}) => {
//       if (!data) return defaultValue;
//       try {
//         return typeof data === "string" ? JSON.parse(data) : data;
//       } catch (error) {
//         console.error(`JSON Parsing Error for ${data}:`, error.message);
//         return defaultValue;
//       }
//     };

//     const calculateKmTravelled = (meterReadings) => {
//       let totalMeters = 0;
//       for (let i = 1; i < meterReadings.length; i++) {
//         const diff = meterReadings[i] - meterReadings[i - 1];
//         if (diff > 0) {
//           totalMeters += diff;
//         }
//       }
//       return Math.round(totalMeters);
//     };

//     const parsedFuel = parseJSONSafely(updateFields.fuel);
//     const parsedFastTag = parseJSONSafely(updateFields.fastTag);
//     const parsedTyre = parseJSONSafely(updateFields.tyrePuncture);
//     const parsedService = parseJSONSafely(updateFields.vehicleServicing);
//     const parsedOther = parseJSONSafely(updateFields.otherProblems);
//     const parsedLocation = parseJSONSafely(updateFields.location);

//     const uploadedImages = {
//       fuel_receiptImage: req.files?.receiptImage?.map((f) => f.path) || [],
//       fuel_transactionImage:
//         req.files?.transactionImage?.map((f) => f.path) || [],
//       tyrePuncture_image: req.files?.punctureImage?.map((f) => f.path) || [],
//       servicing_image:
//         req.files?.vehicleServicingImage?.map((f) => f.path) || [],
//       servicing_receiptImage:
//         req.files?.vehicleServicingReceiptImage?.map((f) => f.path) || [],
//       otherProblems_image:
//         req.files?.otherProblemsImage?.map((f) => f.path) || [],
//       cabImage: req.files?.cabImage?.[0]?.path || existingCab?.cabImage,
//     };

//     // Meter + Distance
//     const existingMeter = existingCab?.servicing_meter || [];
//     let updatedMeter = [...existingMeter];
//     if (parsedService?.meter) {
//       const newMeter = Number(parsedService.meter);
//       if (!isNaN(newMeter)) {
//         updatedMeter.push(newMeter);
//       }
//     }
//     const kmTravelled = calculateKmTravelled(updatedMeter);

//     const updatedFields = {
//       insuranceNumber:
//         updateFields.insuranceNumber || existingCab?.insuranceNumber,
//       insuranceExpiry:
//         updateFields.insuranceExpiry || existingCab?.insuranceExpiry,
//       registrationNumber:
//         updateFields.registrationNumber || existingCab?.registrationNumber,
//       cabImage: uploadedImages.cabImage,
//       addedBy: req.admin?.id || existingCab?.addedBy,
//       location_from: parsedLocation?.from || existingCab?.location_from,
//       location_to: parsedLocation?.to || existingCab?.location_to,
//       location_totalDistance:
//         updateFields.totalDistance || existingCab?.location_totalDistance,

//       fuel_type: parsedFuel?.type || existingCab?.fuel_type,
//       fuel_receiptImage: [
//         ...(existingCab?.fuel_receiptImage || []),
//         ...uploadedImages.fuel_receiptImage,
//       ],
//       fuel_transactionImage: [
//         ...(existingCab?.fuel_transactionImage || []),
//         ...uploadedImages.fuel_transactionImage,
//       ],
//       fuel_amount: [
//         ...(existingCab?.fuel_amount || []),
//         ...(parsedFuel?.amount ? [parsedFuel.amount] : []),
//       ],

//       fastTag_paymentMode:
//         parsedFastTag?.paymentMode || existingCab?.fastTag_paymentMode,
//       fastTag_amount: [
//         ...(existingCab?.fastTag_amount || []),
//         ...(parsedFastTag?.amount ? [parsedFastTag.amount] : []),
//       ],
//       fastTag_cardDetails:
//         parsedFastTag?.cardDetails || existingCab?.fastTag_cardDetails,

//       tyrePuncture_image: [
//         ...(existingCab?.tyrePuncture_image || []),
//         ...uploadedImages.tyrePuncture_image,
//       ],
//       tyrePuncture_repairAmount: [
//         ...(existingCab?.tyrePuncture_repairAmount || []),
//         ...(parsedTyre?.repairAmount ? [parsedTyre.repairAmount] : []),
//       ],

//       servicing_requiredService:
//         parsedService?.requiredService ??
//         existingCab?.servicing_requiredService,
//       servicing_details:
//         parsedService?.details || existingCab?.servicing_details,
//       servicing_image: [
//         ...(existingCab?.servicing_image || []),
//         ...uploadedImages.servicing_image,
//       ],
//       servicing_receiptImage: [
//         ...(existingCab?.servicing_receiptImage || []),
//         ...uploadedImages.servicing_receiptImage,
//       ],
//       servicing_amount: [
//         ...(existingCab?.servicing_amount || []),
//         ...(parsedService?.amount ? [parsedService.amount] : []),
//       ],
//       servicing_meter: updatedMeter,
//       servicing_kmTravelled: kmTravelled,
//       servicing_totalKm:
//         parsedService?.totalKm || existingCab?.servicing_totalKm,

//       otherProblems_details:
//         parsedOther?.details || existingCab?.otherProblems_details,
//       otherProblems_amount: [
//         ...(existingCab?.otherProblems_amount || []),
//         ...(parsedOther?.amount ? [parsedOther.amount] : []),
//       ],
//       otherProblems_image: [
//         ...(existingCab?.otherProblems_image || []),
//         ...uploadedImages.otherProblems_image,
//       ],
//         driverId: updateFields.driverId || existingCab?.driverId,

//     };

//     let cab;
//     if (!existingCab) {
//       cab = await CabsDetails.create({
//         cabNumber,
//         ...updatedFields,
//       });
//       return res
//         .status(201)
//         .json({ message: "New cab created successfully", cab });
//     } else {
//       await CabsDetails.update(updatedFields, { where: { cabNumber } });
//       cab = await CabsDetails.findOne({ where: { cabNumber } });
//       return res
//         .status(200)
//         .json({ message: "Cab data updated successfully", cab });
//     }
//   } catch (error) {
//     console.error("🚨 Error:", error);
//     return res
//       .status(500)
//       .json({ message: "Error updating/creating cab", error: error.message });
//   }
// });            


//  DONE




router.patch("/driver/add", driverAuthMiddleware, upload, async (req, res) => {
  try {
    console.log("📝 Request Body:", req.body);
    console.log("📂 Uploaded Files:", req.files);

    const { cabNumber, ...updateFields } = req.body;

    if (!cabNumber) {
      return res.status(400).json({ message: "Cab number is required" });
    }

    let existingCab = await CabsDetails.findOne({ where: { cabNumber } });

    const parseJSONSafely = (data, defaultValue = {}) => {
      if (!data) return defaultValue;
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        console.error(`JSON Parsing Error for ${data}:`, error.message);
        return defaultValue;
      }
    };

    const calculateKmTravelled = (meterReadings) => {
      let totalMeters = 0;
      for (let i = 1; i < meterReadings.length; i++) {
        const diff = meterReadings[i] - meterReadings[i - 1];
        if (diff > 0) {
          totalMeters += diff;
        }
      }
      return Math.round(totalMeters);
    };

    const parsedFuel = parseJSONSafely(updateFields.fuel);
    const parsedFastTag = parseJSONSafely(updateFields.fastTag);
    const parsedTyre = parseJSONSafely(updateFields.tyrePuncture);
    const parsedService = parseJSONSafely(updateFields.vehicleServicing);
    const parsedOther = parseJSONSafely(updateFields.otherProblems);
    const parsedLocation = parseJSONSafely(updateFields.location);

    const uploadedImages = {
      fuel_receiptImage: req.files?.receiptImage?.map((f) => f.path) || [],
      fuel_transactionImage:
        req.files?.transactionImage?.map((f) => f.path) || [],
      tyrePuncture_image: req.files?.punctureImage?.map((f) => f.path) || [],
      servicing_image:
        req.files?.vehicleServicingImage?.map((f) => f.path) || [],
      servicing_receiptImage:
        req.files?.vehicleServicingReceiptImage?.map((f) => f.path) || [],
      otherProblems_image:
        req.files?.otherProblemsImage?.map((f) => f.path) || [],
      cabImage: req.files?.cabImage?.[0]?.path || existingCab?.cabImage,
    };

    // Meter + Distance
    const existingMeter = existingCab?.servicing_meter || [];
    let updatedMeter = [...existingMeter];
    if (parsedService?.meter) {
      const newMeter = Number(parsedService.meter);
      if (!isNaN(newMeter)) {
        updatedMeter.push(newMeter);
      }
    }
    const kmTravelled = calculateKmTravelled(updatedMeter);

    const updatedFields = {
      insuranceNumber:
        updateFields.insuranceNumber || existingCab?.insuranceNumber,
      insuranceExpiry:
        updateFields.insuranceExpiry || existingCab?.insuranceExpiry,
      registrationNumber:
        updateFields.registrationNumber || existingCab?.registrationNumber,
      cabImage: uploadedImages.cabImage,
      addedBy: req.admin?.id || existingCab?.addedBy,
      location_from: parsedLocation?.from || existingCab?.location_from,
      location_to: parsedLocation?.to || existingCab?.location_to,
      location_totalDistance:
        updateFields.totalDistance || existingCab?.location_totalDistance,

      fuel_type: parsedFuel?.type || existingCab?.fuel_type,
      fuel_receiptImage: [
        ...(existingCab?.fuel_receiptImage || []),
        ...uploadedImages.fuel_receiptImage,
      ],
      fuel_transactionImage: [
        ...(existingCab?.fuel_transactionImage || []),
        ...uploadedImages.fuel_transactionImage,
      ],
      fuel_amount: [
        ...(existingCab?.fuel_amount || []),
        ...(parsedFuel?.amount ? [parsedFuel.amount] : []),
      ],

      fastTag_paymentMode:
        parsedFastTag?.paymentMode || existingCab?.fastTag_paymentMode,
      fastTag_amount: [
        ...(existingCab?.fastTag_amount || []),
        ...(parsedFastTag?.amount ? [parsedFastTag.amount] : []),
      ],
      fastTag_cardDetails:
        parsedFastTag?.cardDetails || existingCab?.fastTag_cardDetails,

      tyrePuncture_image: [
        ...(existingCab?.tyrePuncture_image || []),
        ...uploadedImages.tyrePuncture_image,
      ],
      tyrePuncture_repairAmount: [
        ...(existingCab?.tyrePuncture_repairAmount || []),
        ...(parsedTyre?.repairAmount ? [parsedTyre.repairAmount] : []),
      ],

      servicing_requiredService:
        parsedService?.requiredService ??
        existingCab?.servicing_requiredService,
      servicing_details:
        parsedService?.details || existingCab?.servicing_details,
      servicing_image: [
        ...(existingCab?.servicing_image || []),
        ...uploadedImages.servicing_image,
      ],
      servicing_receiptImage: [
        ...(existingCab?.servicing_receiptImage || []),
        ...uploadedImages.servicing_receiptImage,
      ],
      servicing_amount: [
        ...(existingCab?.servicing_amount || []),
        ...(parsedService?.amount ? [parsedService.amount] : []),
      ],
      servicing_meter: updatedMeter,
      servicing_kmTravelled: kmTravelled,
      servicing_totalKm:
        parsedService?.totalKm || existingCab?.servicing_totalKm,

      otherProblems_details:
        parsedOther?.details || existingCab?.otherProblems_details,
      otherProblems_amount: [
        ...(existingCab?.otherProblems_amount || []),
        ...(parsedOther?.amount ? [parsedOther.amount] : []),
      ],
      otherProblems_image: [
        ...(existingCab?.otherProblems_image || []),
        ...uploadedImages.otherProblems_image,
      ],
        driverId: updateFields.driverId || existingCab?.driverId,

    };

    let cab;
    if (!existingCab) {
      cab = await CabsDetails.create({
        cabNumber,
        ...updatedFields,
      });
      return res
        .status(201)
        .json({ message: "New cab created successfully", cab });
    } else {
      await CabsDetails.update(updatedFields, { where: { cabNumber } });
      cab = await CabsDetails.findOne({ where: { cabNumber } });
      return res
        .status(200)
        .json({ message: "Cab data updated successfully", cab });
    }
  } catch (error) {
    console.error("🚨 Error:", error);
    return res
      .status(500)
      .json({ message: "Error updating/creating cab", error: error.message });
  }
});   




router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
     const cabs = await CabsDetails.findAll({
      where: { addedBy: req.admin.id },
    });
    res.status(200).json(cabs);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ---PENDING
router.get("/driver", driverAuthMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.driver.id);
    const adminsCab = await CabsDetails.findAll({ where: { addedBy: driver.addedBy } });
    res.status(200).json({ "Driver Detail": driver, "Cab Admin": adminsCab });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// ✅ 3️⃣ Get a Single Cab by ID           ------------- DONE
router.get("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
   const cab = await CabsDetails.findByPk(req.params.id, {
      include: {
        model: Admin, // Assuming `Admin` is the Sequelize model for the addedBy field
        attributes: ["name", "email"]
      }
    });
    if (!cab) return res.status(404).json({ error: "Cab not found" });

    res.status(200).json(cab);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

//  DONE
router.delete("/delete/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const cab = await CabsDetails.findOne({ where: { id: req.params.id } });

    if (!cab) {
      return res.status(404).json({ error: "Cab not found" });
    }

    await cab.destroy();

    res.status(200).json({ message: "Cab deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// router.put("/:id", authMiddleware, isAdmin, upload, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const updatedFields = {
//       cabNumber: req.body.cabNumber,
//       insuranceNumber: req.body.insuranceNumber,
//       registrationNumber: req.body.registrationNumber,
//     };

//     // Optional: update cabImage if file is uploaded
//     if (req.files?.cabImage?.[0]) {
//       updatedFields.cabImage = req.files.cabImage[0].path;
//     }

//     // Check if cab exists
//     const cab = await CabsDetails.findOne({ where: { id } });

//     if (!cab) {
//       return res.status(404).json({ message: "Cab not found" });
//     }

//     // Update cab
//     await cab.update(updatedFields);

//     res.status(200).json({ message: "Cab updated successfully", cab });
//   } catch (error) {
//     console.error("Update cab failed:", error);
//     res.status(500).json({ message: "Failed to update cab", error: error.message });
//   }
// });


router.put("/:id", authMiddleware, isAdmin, upload, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedFields = {
      cabNumber: req.body.cabNumber,
      insuranceNumber: req.body.insuranceNumber,
      registrationNumber: req.body.registrationNumber,
      imei: req.body.imei, // 🆕 Added IMEI field
    };

    // Optional: update cabImage if file is uploaded
    if (req.files?.cabImage?.[0]) {
      updatedFields.cabImage = req.files.cabImage[0].path;
    }

    // 🆕 Validate IMEI if provided
    if (req.body.imei && req.body.imei.trim().length !== 15) {
      return res.status(400).json({ message: "IMEI must be exactly 15 digits" });
    }

    // 🆕 Check for duplicate IMEI (exclude current cab)
    if (req.body.imei) {
      const existingCabWithImei = await CabsDetails.findOne({
        where: {
          imei: req.body.imei,
          id: { [Op.ne]: id } // Exclude current cab from check
        }
      });

      if (existingCabWithImei) {
        return res.status(400).json({ message: "IMEI already assigned to another cab" });
      }
    }

    // Check if cab exists
    const cab = await CabsDetails.findOne({ where: { id } });

    if (!cab) {
      return res.status(404).json({ message: "Cab not found" });
    }

    // Update cab
    await cab.update(updatedFields);

    res.status(200).json({ message: "Cab updated successfully", cab });
  } catch (error) {
    console.error("Update cab failed:", error);
    res.status(500).json({ message: "Failed to update cab", error: error.message });
  }
});


module.exports = router;