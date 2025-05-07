const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { use } = require("../routes/authRoutes");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("All fields are required");
    }
    const emailReq = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: emailReq, isActive: true, isDeleted: false });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }
    const user = await User.create({ name, email: emailReq, password });
    if (user) {
      const formResp = { userId: user._id, name: user.name, email: user.email, isActive: user.isActive, isDeleted: user.isDeleted };
      res.status(201).json(formResp);
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }
    const emailReq = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailReq, isActive: true, isDeleted: false }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }
    const token = generateToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { token } });

    const formResp = { userId: user._id, name: user.name, email: user.email, token, isActive: user.isActive, isDeleted: user.isDeleted };
    res.status(200).json(formResp);
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const myProfile = async (req, res) => {
  res.status(200).json(req.user);
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true, isDeleted: false });
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No active users found' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};
module.exports = { registerUser, loginUser, myProfile, generateToken, getAllUsers };
