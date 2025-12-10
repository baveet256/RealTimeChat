import TryCatch from "../config/trycatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";

export const createNewChat = TryCatch(async (req : AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const {OtherUserId} = req.body;

    if (!OtherUserId) {
        res.status(401).json({ message: "Unauthorized: User not authenticated." });
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
        ,chatId:
     });  
        });