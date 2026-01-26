import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const saltRounds = 10;

const hashPassword = (password) => bcrypt.hash(password, saltRounds);
const verifyPassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword);
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '35m' }
  );


export const authenticateUser = async (username, password) => {
  try {
    const [results] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (results.length === 0) {
      return { message: 'Invalid username or password' };
    }

    const user = results[0];
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return { message: 'Invalid username or password' };
    }

    const token = generateToken(user);
    const loggedInUser = { id: user.id, username: user.username, role: user.role, email: user.email };

    return { message: 'Login successful', token, user: loggedInUser };
  } catch (err) {
    console.error('Error authenticating user:', err);
    return { message: 'Error authenticating user' };
  }
};

// Signup
export const createUser = async (username, password, email) => {
  try {
    const [existingUser] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }

    const [existingEmail] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      throw new Error('Email already exists');
    }

    
    const hashedPassword = await hashPassword(password);
    const [result] = await db.execute(
      'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, 'customer']
    );

    const user = { id: result.insertId, username, email, role: 'customer' };
    const token = generateToken(user);

    return { message: 'User created successfully', token, user };
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

export const getAllUsers = async () => {
  try {
    const [results] = await db.execute('SELECT * FROM users');
    return results;
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const requestPasswordReset = async (email) => {
  try {
    console.log(`[requestPasswordReset] email: ${email}`);

    
    const [results] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) {
  
      console.log(`[requestPasswordReset] email not found: ${email}`);
      return { message: 'If a matching account was found, a password reset link has been sent to your email.' };
    }

    const user = results[0];

    
    const token = generateResetToken();
    const expires = new Date(Date.now() + 3600000); 
    console.log(`[Password Reset] Generated token and expiry date for user: ${user.id}`);

   
    const [dbResult] = await db.execute(
      'INSERT INTO password_resets (user_id, token, expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires = ?',
      [user.id, token, expires, token, expires]
    );
    console.log(`[Password Reset] Token saved to database. Result: ${JSON.stringify(dbResult)}`);


    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      `,
    };

    
    console.log(`[Password Reset] Attempting to send email to: ${user.email}`);
    await transporter.sendMail(mailOptions);
    console.log(`[Password Reset] Email successfully sent to: ${user.email}`);

    
    return { message: 'Password reset link sent to your email.' };

  } catch (err) {
    console.error('Error requesting password reset:', err);
    
    throw new Error('Failed to send password reset link. Please try again later.');
  }
};


export const resetPassword = async (token, newPassword) => {
  try {
    const [tokens] = await db.execute('SELECT * FROM password_resets WHERE token = ?', [token]);

   
    if (tokens.length === 0) {
      return { message: 'Invalid or expired token' };
    }

    const resetToken = tokens[0];

    if (new Date() > new Date(resetToken.expires)) {
      await db.execute('DELETE FROM password_resets WHERE token = ?', [token]);
      return { message: 'Invalid or expired password reset token.' };
    }

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [resetToken.user_id]);

    if (users.length === 0) {
      return { message: 'User not found' };
    }

    const user = users[0];

    
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);

    await db.execute('DELETE FROM password_resets WHERE token = ?', [token]);

    return { message: 'Password reset successfully!' };

  } catch (err) {
    console.error('Error resetting password:', err);
    return { message: 'Error resetting password' };
  }
}
