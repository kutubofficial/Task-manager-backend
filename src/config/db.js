const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
let MONGODB_URI = process.env.MONGODB_URI;
let MONGODB_ATLAS = process.env.MONGODB_ATLAS;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_ATLAS);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
module.exports = connectDB;
