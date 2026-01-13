const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); 
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    const user = await User.upsertUser(email, name, picture);

    const serverToken = jwt.sign(
      { email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } 
    );

    res.status(200).json({ 
      success: true, 
      user, 
      token: serverToken 
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};