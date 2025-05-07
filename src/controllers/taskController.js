const Task = require("../models/Task");
const User = require("../models/User");
const sendNotification = require("../utils/sendNotification");
const Notification = require('../models/Notification');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to get tasks" });
  }
};

const getDashboardTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const [assignedTasks, createdTasks, overdueTasks, completedTask] = await Promise.all([
      Task.find({ assignedTo: userId })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email"),
      Task.find({ createdBy: userId })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email"),
      Task.find({
        assignedTo: userId,
        dueDate: { $lt: new Date() },
        status: { $ne: "completed" },
      })
        .populate("createdBy", "name email")
        .populate("assignedTo", "name email"),
    ]);
    res.status(200).json({ assignedTasks, createdTasks, overdueTasks, completedTask });
  } catch (err) {
    res.status(500).json({ error: "Failed to get dashboard tasks" });
  }
};

const createTask = async (req, res) => {
  const { title, description, dueDate, priority, assignedTo } = req.body;

  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return res.status(404).json({ message: "Assigned user not found" });
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    priority,
    createdBy: req.user._id,
    assignedTo,
  });

  await sendNotification({
    recipient: assignedTo,
    sender: req.user._id,
    task: task._id,
    message: `You have been assigned a new task: "${title}"`,
  });

  const populatedTask = await Task.findById(task._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email");

  res.status(201).json(populatedTask);
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const userId = req.user._id.toString();
    const isOwner = task.createdBy.toString() === userId;
    const isAssignee = task.assignedTo.toString() === userId;

    if (!isOwner && !isAssignee) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { assignedTo } = req.body;

    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      const newAssignee = await User.findById(assignedTo);
      if (!newAssignee) {
        return res.status(404).json({ error: "New assigned user not found" });
      }
      await sendNotification({
        recipient: assignedTo,
        sender: req.user._id,
        task: task._id,
        message: `You have been assigned a task: "${task.title}"`,
      });
    }
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update Task Error:', error.message);
    res.status(500).json({ error: "Failed to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const isOwner = task.createdBy.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: "Unauthorized" });

    await task.deleteOne();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
};

const searchTasks = async (req, res) => {
  try {
    const { search, status, priority, dueDateFrom, dueDateTo } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }

    const tasks = await Task.find(query)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

const myNotifications = async (req, res) => {
  try {
    const noti = await Notification.find();
    if (!noti || noti.length === 0) {
      return res.status(404).json({ message: 'No active notifications found' });
    }
    res.status(200).json(noti || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const isNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    // console.log(notificationId);

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true, runValidators: true }
    );

    // await Notification.updateOne({
    //   notificationId,
    //   $set: {
    //     isRead: true
    //   }
    // })

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: "Marked as read", updatedNotification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

module.exports = {
  getTasks,
  getDashboardTasks,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
  myNotifications,
  isNotificationRead
};


