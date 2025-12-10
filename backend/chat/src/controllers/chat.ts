import TryCatch from "../config/trycatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";

export const createNewChat = TryCatch(async (req : AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const {OtherUserId} = req.body;

    if (!OtherUserId) {
        res.status(400).json({ message: "Other User is required" });
        return;
    }
    
    const existingChat = await Chat.findOne({
        users : {$all: [userId, OtherUserId], $size: 2},
});
    if (existingChat) {
        res.json({
            message: "Chat already exists",
            chatId: existingChat._id,
        });
        return;
    }
    const newChat = await Chat.create({
        users: [userId, OtherUserId],
    });
    await newChat.save();
    res.status(201).json({ message: "Create New Chat Endpoint"
        ,chatId:newChat._id
     });  
});

export const getAllChats = TryCatch(async (req : AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    const chats = await Chat.find({ users: userId?.toString()}).sort({updatedAt:-1});

    const chatWithUserData = await Promise.all(chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id.toString() !== userId?.toString());
        
        return {
            chatId: chat._id,
            users: chat.users,
            otherUserId,
            updatedAt: chat.updatedAt,
        };
    }));

    res.json({ chats: chatWithUserData });
});