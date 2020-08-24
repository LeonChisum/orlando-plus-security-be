const express = require("express");
const router = express.Router();
const Guard = require("../models/employee_guard");
// const faker = require("faker");

const auth = require("../middleware/auth");
const { seedGuards } = require("../models/seeds/seeds");

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

    //Creating new guard
    const newGuard = new Guard(req.body);

    await newGuard.save();

    res.status(201).json(newGuard);
  } catch (error) {
    console.log(error);
  }
});

// @Route GET /guards
// @desc getting all guards
// @acess Private
router.get("/", auth, async (req, res) => {
  try {
    const guards = await Guard.find({});

    if (!guards)
      return res.status(400).json({ message: "Could not return guards" });

    res.status(200).json(guards);
  } catch (error) {
    console.log(error);
  }
});

// @Route GET /guards/:id
// @desc getting a specific guard
// @acess Private
router.get("/:id", auth, async (req, res) => {
  try {
    const guard = await Guard.findById(req.params.id);

    if (!guard)
      return res
        .status(400)
        .json({ message: "Guard with that ID does not exist" });

    res.status(200).json(guard);
  } catch (error) {
    console.log(error);
  }
});

// @Route PUT /guards/:id
// @desc updating a specific guard
// @acess Private
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedGuard = await Guard.updateOne(
      { _id: req.params.id },
      req.body
    );

    if (!updatedGuard)
      return res
        .status(400)
        .json({ message: "Guard with that ID does not exist" });

    res
      .status(202)
      .json({ message: "Success, Your changes have been made!", ...req.body });
  } catch (error) {
    console.log(error);
  }
});

// @Route DEL /guards/:id
// @desc deleting a specific guard
// @acess Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedGuard = await Guard.deleteOne({ _id: req.params.id })

    if(!deletedGuard) {
      return res
        .status(400)
        .json({ message: "Guard with that ID does not exist" });
    }

    res
    .status(200)
    .json({ message: `Success, You have deleted guard ${ req.params.id }!`});
  } catch (error) {
    console.log(error);
  }
});

router.get("/admins/:id", (req, res) => {
  try {
    
  } catch (error) {
    
  }
});

module.exports = router;
