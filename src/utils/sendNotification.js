const Notification = require('../models/Notification');

const sendNotification = async ({ recipient, sender, task, message }) => {
  try {
    const notification = new Notification({
      recipient,
      sender,
      task,
      message,
    });

    await notification.save();
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

module.exports = sendNotification;
