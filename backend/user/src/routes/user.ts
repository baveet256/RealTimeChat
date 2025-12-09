import express from 'express';
import { getAllUsers, getAUser, loginUser, myprofile, updateName, verifyOtp } from '../controllers/user.js';
import {isAuth} from '../middleware/isAuth.js';
import { get } from 'http';

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyOtp);
router.get("/me", isAuth ,  myprofile);
router.get("/user/all", isAuth, getAllUsers);
router.get("/user/:id", getAUser);
router.post("/update/user", isAuth, updateName);

export default router;