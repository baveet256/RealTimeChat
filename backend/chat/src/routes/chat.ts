import express from "express";
import dotenv from 'dotenv';
import isAuth from '../middlewares/isAuth.js';
import { createNewChat, getAllChats, getMessagesOfChat, sendMessage } from "../controllers/chat.js";

import { upload } from '../middlewares/multer.js';
dotenv.config()

const router = express.Router();

router.post("/chat/new",isAuth, createNewChat);
router.get("/chat/all",isAuth, getAllChats);
router.post("/message",isAuth,upload.single("file"), sendMessage);
router.get("/message/:chatId",isAuth, getMessagesOfChat);

export default router;