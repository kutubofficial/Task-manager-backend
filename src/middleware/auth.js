const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  let token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
module.exports = authMiddleware;


// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const authMiddleware = async (req, res, next) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).json({ error: 'Access denied, no token provided' });
//   }

//   try {
//     let decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = await User.findById(decoded.id).select('-password');

//     next();
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// module.exports = authMiddleware;
