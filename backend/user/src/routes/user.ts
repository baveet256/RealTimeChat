import express from 'express';
import { loginUser, verifyOtp } from '../controllers/user.js';
import {isauth} from '../middleware/isAuth.js';
import { myprofile } from '../controllers/user.js';

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.get("/me", isauth, myprofile);

export default router;