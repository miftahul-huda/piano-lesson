const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email helper
const sendConfirmationEmail = async (email, token) => {
  console.log(`--- Email Confirmation ---`);
  console.log(`To: ${email}`);
  console.log(`Link: ${process.env.CONFIRMATION_URL}/${token}`);
  console.log(`--------------------------`);
  
  // Real nodemailer logic (optional if user provides credentials)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: true, // true for 465
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Confirm your Piano Lesson Registration',
          text: `Click here to confirm: ${process.env.CONFIRMATION_URL}/${token}`
      });
  }
};

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email,
      password: hashedPassword,
      confirmationToken
    });

    await sendConfirmationEmail(email, confirmationToken);

    res.status(201).json({ message: 'User registered. Please check your email to confirm.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { confirmationToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    user.isConfirmed = true;
    user.confirmationToken = null;
    await user.save();

    res.json({ message: 'Email confirmed successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isConfirmed) return res.status(400).json({ message: 'Please confirm your email first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/google-login', async (req, res) => {
    try {
        const { googleToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        console.log("Google Payload:", payload);
        const { email, sub: googleId, name, picture } = payload;

        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                email,
                name,
                picture,
                googleId,
                isConfirmed: true // Auto confirm Google users
            });
        } else {
            let updated = false;
            if (!user.googleId) {
                user.googleId = googleId;
                user.isConfirmed = true;
                updated = true;
            }
            if (name && user.name !== name) {
                user.name = name;
                updated = true;
            }
            if (picture && user.picture !== picture) {
                user.picture = picture;
                updated = true;
            }
            if (updated) await user.save();
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("Sending user to client:", { id: user.id, email: user.email, name: user.name, picture: user.picture });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
