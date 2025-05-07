const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/all-task", taskController.getTasks);
router.get("/dashboard", taskController.getDashboardTasks);
router.get("/search", taskController.searchTasks);
router.post("/create-task", taskController.createTask);
router.put("/update-task/:id", taskController.updateTask);
router.delete("/delete-task/:id", taskController.deleteTask);
router.get("/my-notification", taskController.myNotifications);
router.get("/mark-as-read/:id", taskController.markAsRead);

module.exports = router;
