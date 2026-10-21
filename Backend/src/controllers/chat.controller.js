import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import mongoose from "mongoose";
import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js";

export async function sendMessage(req, res) {

    const { message, chat: chatId } = req.body || {};


    if (typeof message !== "string" || !message.trim() || message.length > 20000) return res.status(400).json({ message: "Message must contain 1-20000 characters" });
    if (chatId && !mongoose.isObjectIdOrHexString(chatId)) return res.status(400).json({ message: "Invalid chat ID" });
    let title = null, chat = null;
    if (chatId) {
        chat = await chatModel.findOne({ _id: chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ message: "Chat not found" });
    }

    const messages = chatId
        ? await messageModel.find({ chat: chatId }).sort({ createdAt: 1, _id: 1 })
        : [];
    // Provider failures must not persist duplicate user messages on retry.
    const result = await generateResponse([...messages, { role: "user", content: message.trim() }]);
    if (!chatId) {
        try { title = await generateChatTitle(message); }
        catch { title = message.trim().slice(0, 60); }
        chat = await chatModel.create({ user: req.user.id, title });
    }
    const [, aiMessage] = await messageModel.insertMany([
        { chat: chat._id, content: message.trim(), role: "user" },
        { chat: chat._id, content: result, role: "ai" }
    ]);

    await chatModel.updateOne({ _id: chat._id }, { $set: { updatedAt: new Date() } });
    res.status(201).json({
        title,
        chat,
        aiMessage
    })

}

export async function getChats(req, res) {
    const user = req.user

    const chats = await chatModel.find({ user: user.id }).sort({ updatedAt: -1 })

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats
    })
}

export async function getMessages(req, res) {
    const { chatId } = req.params;
    if (!mongoose.isObjectIdOrHexString(chatId)) return res.status(400).json({ message: "Invalid chat ID" });

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    }).sort({ createdAt: 1, _id: 1 })

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages
    })
}

export async function deleteChat(req, res) {

    const { chatId } = req.params;
    if (!mongoose.isObjectIdOrHexString(chatId)) return res.status(400).json({ message: "Invalid chat ID" });

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({ chat: chatId });
    res.status(200).json({
        message: "Chat deleted successfully"
    })
}