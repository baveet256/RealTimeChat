import express from "express";
import dotenv from 'dotenv';
import isAuth from '../middlewares/isAuth.js';
import { createNewChat } from "../controllers/chat.js";

dotenv.config()

const router = express.Router();

router.post("/chat/new",isAuth, createNewChat);

export default router;