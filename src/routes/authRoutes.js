const express = require("express");
const router = express.Router();
const { registerUser, loginUser, myProfile, getAllUsers } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, myProfile);
router.get("/users", authMiddleware, getAllUsers);

module.exports = router;
