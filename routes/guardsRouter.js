const express = require("express");
const router = express.Router();
const Guard = require("../models/employee_guard");
const faker = require("faker");

const auth = require("../middleware/auth");
const { seedGuards } = require('../models/seeds/seeds')

// @Route POST /guards
// @desc create new guard
// @acess Private
router.post("/", auth, async (req, res) => {
  try {
    const { firstName, lastName, ssn } = req.body;

    //validation
    if (!firstName || !lastName)
      return res.status(400).json({ message: "missing required guard data" });

    //check for existing guard
    const guard = await Guard.findOne({ ssn });

    if (guard) return res.status(400).json({ message: "Guard already exists" });

    const guards = await seedGuards(50);

    console.log(guards)

    Guard.insertMany(guards, (err, docs) => {
        if(err) return console.log(err)
        res.status(200).json({ guardsAdded: docs})
    })

    //Creating new guard
    // const newAdmin = new Guard({
    //   firstName,
    //   lastName,
    //   email,
    //   address: {
    //     street,
    //     city,
    //     state: "FL",
    //   },
    //   phone: {
    //     cell,
    //     home,
    //   },
    //   ssn,
    //   birthDate,
    //   startDate,
    //   dLicense: {
    //     blueCard,
    //     number,
    //     exp,
    //   },
    //   gLicense: {
    //     activeLicense,
    //     number,
    //     exp,
    //   },
    //   ccw: {
    //     activeLicense,
    //     number,
    //     exp,
    //   },
    //   uniform: {
    //     polo: {
    //       hasIssued,
    //       size
    //     },
    //     jacket: {
    //         hasIssued,
    //         size
    //       },
    //   },
    //   badge : {
    //       hasIssued,
    //       barcode,
    //   },
    //   position,
    //   rating,
    //   shiftPref: {
    //       startTime,
    //       endTime,
    //   }
    // });
  } catch (error) {
      console.log(error)
  }
});

router.put("/admins/:id", (req, res) => {
  try {
  } catch (error) {}
});

router.put("/guards", (req, res) => {
  try {
  } catch (error) {}
});

router.get("/", (req, res) => {
  try {
  } catch (error) {}
});

router.get("/admins", (req, res) => {});

router.get("/admins/:id", (req, res) => {});

module.exports = router;
