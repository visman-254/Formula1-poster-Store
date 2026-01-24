// authApi.js
import express from 'express';
import { login, signup,fetchAllUsers,forgotPassword, resetPasswordController } from '../controllers/authController.js'; // import named exports
import cors from 'cors';
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(cors());
router.get("/user", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// directly use controller functions
router.post('/login', login);

router.post('/signup', signup);
router.get('/users', verifyToken, verifyAdmin, fetchAllUsers);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password', resetPasswordController);
export default router;
