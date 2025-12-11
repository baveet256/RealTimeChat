import axios from "axios";
import TryCatch from "../config/trycatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Messages.js";

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

        const unseencount = await Message.countDocuments({
            chatId: chat._id,
            sender: { $ne: userId},
            seen: false,
        } as any); 

        console.log("Fetching user:", `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        try{
            const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);
            return {
                user : data,
                chat:{
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage,
                    unseencount,   
                },
                
            };  
        } catch (error) {
            console.error("Error fetching user data:", error);
            return {
                    user: {_id:otherUserId, name:"Unknown name"},
                    chat:{
                            ...chat.toObject(),
                            latestMessage: chat.latestMessage,
                            unseencount,   
                        },
            };  
        }       
    
    }));

    res.json({ chats: chatWithUserData });
});

export const sendMessage = TryCatch(async (req : AuthenticatedRequest, res) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;

    if (!senderId) {
        res.status(400).json({ message: "Sender ID is required" });
        return;
    }

    if (!chatId || !text) {
        res.status(400).json({ message: "chatId and content are required" });
        return;
    }
    const chat =  await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    const isUserInChat = chat.users.some((id) => id.toString() === senderId?.toString());

    if (!isUserInChat) {
        res.status(403).json({ message: "You are not a participant of this chat" });
        return;
    }
    const otherUserId = chat.users.find((id) => id.toString() !== senderId?.toString());

    if (!otherUserId) {
        res.status(400).json({ message: "Other user not found in chat" });
        return;
    }
    // socket setup

    let messageData: any = {
        chatId,
        sender: senderId,
        seen: false,
        seenAt : undefined,
    };
    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename,
        };
        messageData.messageType = "image";
    } else {
        messageData.text = text || "";
        messageData.messageType = "text";
    }

    const newMessage = new Message(messageData);
    const savedMessage = await newMessage.save();

    // Update latest message in chat
    const latestMessage = imageFile ? "Img":text

    
    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            sender: senderId,
            text: latestMessage,
        },
        updatedAt: new Date(),  
    }, { new: true });

    res.status(201).json({ message: savedMessage, sender: senderId,});
    // emit to socket
});

export const getMessagesOfChat = TryCatch(async (req : AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    if (!chatId) {
        res.status(400).json({ message: "Chat ID is required" });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
    }

    const isUserInChat = chat.users.some((id) => id.toString() === userId?.toString());

    if (!isUserInChat) {
        res.status(403).json({ message: "You are not a participant of this chat" });
        return;
    }
    const messagesToMarkSeen = await Message.find({
        chatId,
        sender: { $ne: userId},
        seen: false,
    } as any);

    await Message.updateMany({
        chatId,
        sender: { $ne: userId},
        seen: false,
    } as any, {
        seen: true,
        seenAt: new Date(),
    });

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => id.toString() !== userId?.toString());

    try{
        const {data} = await axios.get(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
        );
        if(!otherUserId){
            res.status(400).json({ message: "No OTher User" });
            return;
        }
        // Socket Work Here
        res.json({ messages, user: data });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.json({ messages, user:{_id:otherUserId, name: "Unknown USer"} });

    }
});