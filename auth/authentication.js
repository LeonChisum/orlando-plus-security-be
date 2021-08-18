const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const auth = require("../middleware/auth");

// @Route POST /auth/signUp
// @desc Sign up admin
// @acess Public
router.post("/signUp", async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    //validation
    if (!email || !password) {
      return res.status(400).json({ message: "missing required fields" });
    }

    //Check for existing user
    const user = await Admin.findOne({ email });

    if (user)
      return res
        .status(400)
        .json({ message: "User with that email already exists" });

    //Creating new admin
    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      password,
    });

    //Hashing passWord & saving to DB
    newAdmin.password = await bcrypt.hash(password, 12);
    await newAdmin.save();

    //creating an accessToken
    jwt.sign(
      { id: newAdmin._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXP },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          message: `Thanks for signing up!`,
          user: {
            id: newAdmin.id,
            firstName,
            lastName,
            email,
          },
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// @Route POST /auth/login
// @desc Sign in admin
// @acess Public
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //validation
    if (!email || !password) {
      return res.status(400).json({ message: "missing required fields" });
    }

    //Check for existing user
    const user = await Admin.findOne({ email: new RegExp(`^${email}$`, "i") });

    if (!user)
      return res
        .status(400)
        .json({ message: "User with that email does not exists" });

    //validate Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({
        message: "The password associated with that email does not exist",
      });

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    });

    res.json({
      accessToken,
      message: `Thanks for signing in!`,
      user: {
        id: user.id,
        email,
      },
    });
  } catch (error) {
    res.status(400).json({
      messsage: "What Happened?",
    });
    next(error);
  }
});

// @Route GET /auth/admin
// @desc Get logged in admin
// @acess Private
router.get("/admin", auth, (req, res) => {
  Admin.findById(req.user.id)
    .select("-password")
    .then((admin) => res.json({ admin }));
});

module.exports = router;
