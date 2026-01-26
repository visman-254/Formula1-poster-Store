// authController.js
import { authenticateUser, createUser,getAllUsers,requestPasswordReset , resetPassword  } from '../services/auth.js';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ message: 'Username and password are required' });
    }

    const result = await authenticateUser(username, password);

    if (result.token) {
      // set token in cookie
      res.cookie('jwt', result.token, { httpOnly: true, secure: false }); 
      
      // return token + user
      res.send({ 
        message: 'Login successful', 
        token: result.token, 
        user: result.user   // ✅ add user here
      });
    } else {
      res.status(401).send({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error authenticating user:', err);
    res.status(500).send({ message: 'Error authenticating user' });
  }
};

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).send({ message: 'Username, password, and email are required' });
    }

    const result = await createUser(username, password, email);

    if (result.token) {
      // set token in cookie
      res.cookie('jwt', result.token, { httpOnly: true, secure: false }); 

      // return token + user
      res.send({ 
        message: 'Signup successful', 
        token: result.token,
        user: result.user   //  add user here
      });
    } else {
      res.status(401).send({ message: 'Signup failed' });
    }
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.message === 'Username already exists') {
      return res.status(409).send({ message: 'Username already exists' });
    }
    if (err.message === 'Email already exists') {
      return res.status(409).send({ message: 'Email already exists' });
    }
    res.status(500).send({ message: 'Error creating user' });
  }
};

export { login, signup };


export const fetchAllUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error( error);
    res.status(500).json({ message: "Server error" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    const result = await requestPasswordReset(email);
    res.status(200).send({ message: result.message });
  } catch (err) {
    console.error('Error in forgot password controller:', err);
    res.status(500).send({ message: 'Failed to process password reset request.' });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).send({ message: 'Token and new password are required' });
    }

    // Correcting the variable name to 'newPassword'
    const result = await resetPassword(token, newPassword);

    if (result.message === 'Password reset successfully!') {
      res.status(200).send({ message: result.message });
    } else {
      res.status(400).send({ message: result.message });
    }
  } catch(err) {
    console.error('Error in reset password controller:', err);
    res.status(500).send({ message: 'Failed to reset password.' });
  }
}
