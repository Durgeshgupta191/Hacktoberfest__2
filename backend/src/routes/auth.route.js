import express from 'express';
import { signup, verifyOTP, resendOTP, googleLogin, login, logout, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js"
const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google-login', googleLogin);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, updateProfile);
router.get('/check', protectRoute, checkAuth);

export default router;