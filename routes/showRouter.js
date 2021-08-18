const express = require("express");
const router = express.Router();
const Show = require("../models/shows/show");
// const faker = require("faker");

const auth = require("../middleware/auth");
const { seedShows } = require("../models/seeds/seeds");

// @Route POST /shows
// @desc create new show
// @acess Private
router.post("/", auth, async (req, res) => {
  try {
    const { name, location, moveIn, moveOut, showDays } = req.body;

    //validation
    if (!name || !location || !moveIn || !moveOut || !showDays)
      return res.status(400).json({ message: "missing required show data" });

    //check for existing show
    const show = await Show.findOne({ name });

    if (show) return res.status(400).json({ message: "Show already exists" });

    //Creating new show
    const newShow = new Show(req.body);

    await newShow.save();

    res.status(201).json(newShow);
  } catch (error) {
    console.log(error);
  }
});

// @Route GET /shows
// @desc getting all shows
// @acess Private
router.get("/", async (req, res) => {
  try {
    const shows = await Show.find({});

    if (!shows)
      return res.status(400).json({ message: "Could not return any shows" });

    res.status(200).json(shows);
  } catch (error) {
    console.log(error);
  }
});

// @Route GET /shows/:id
// @desc getting a specific show
// @acess Private
router.get("/:id", auth, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show)
      return res
        .status(400)
        .json({ message: "Show with that ID does not exist" });

    res.status(200).json(show);
  } catch (error) {
    console.log(error);
  }
});

// @Route PUT /shows/:id
// @desc updating a specific show
// @acess Private
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedShow = await Show.updateOne({ _id: req.params.id }, req.body);

    if (!updatedShow)
      return res
        .status(400)
        .json({ message: "Show with that ID does not exist" });

    res
      .status(202)
      .json({ message: "Success, Your changes have been made!", ...req.body });
  } catch (error) {
    console.log(error);
  }
});

// @Route DEL /shows/:id
// @desc deleting a specific guard
// @acess Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedShow = await Show.deleteOne({ _id: req.params.id });

    if (!deletedShow) {
      return res
        .status(400)
        .json({ message: "Show with that ID does not exist" });
    }

    res
      .status(200)
      .json({ message: `Success, You have deleted show ${req.params.id}!` });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
