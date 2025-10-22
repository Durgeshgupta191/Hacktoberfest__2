import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import User from '../models/user.model.js';
import Message from '../models/message.model.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId:socketId}

// used to store typing users
const typingUsers = {}; // {userId: receiverId}

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  let userId = socket.handshake.query.userId;
  if (typeof userId === 'string') {
    const u = userId.trim();
    if (u === '' || u === 'undefined' || u === 'null') userId = undefined;
  }
  if (userId) userSocketMap[userId] = socket.id;

  io.emit('getOnlineUsers', Object.keys(userSocketMap));
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group room: ${groupId}`);
  });

  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
    console.log(`User ${userId} left group room: ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });

  // io.emit() is used to send events to all the connected clients
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  // Handle typing events
  socket.on('startTyping', ({ receiverId }) => {
    if (userId && receiverId) {
      (async () => {
        typingUsers[userId] = receiverId;
        // Don't notify receiver if they blocked the typer or typer blocked receiver
        try {
          const receiver = await User.findById(receiverId).select('blockedUsers');
          const typer = await User.findById(userId).select('blockedUsers');
          if (!receiver || !typer) return;
          if (receiver.blockedUsers && receiver.blockedUsers.map(String).includes(userId)) return;
          if (typer.blockedUsers && typer.blockedUsers.map(String).includes(receiverId)) return;
          const receiverSocketId = getReceiverSocketId(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', { userId });
          }
        } catch (err) {
          console.warn('Error handling startTyping block checks', err.message);
        }
      })();
    }
  });

  socket.on('stopTyping', ({ receiverId }) => {
    if (userId && typingUsers[userId] === receiverId) {
      (async () => {
        delete typingUsers[userId];
        try {
          const receiver = await User.findById(receiverId).select('blockedUsers');
          const typer = await User.findById(userId).select('blockedUsers');
          if (!receiver || !typer) return;
          if (receiver.blockedUsers && receiver.blockedUsers.map(String).includes(userId)) return;
          if (typer.blockedUsers && typer.blockedUsers.map(String).includes(receiverId)) return;
          const receiverSocketId = getReceiverSocketId(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('userStopTyping', { userId });
          }
        } catch (err) {
          console.warn('Error handling stopTyping block checks', err.message);
        }
      })();
    }
  });

  socket.on('disconnect', async () => {
    console.log('A user disconnected', socket.id);
    delete userSocketMap[userId];
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // Update last seen
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {
        console.warn('Failed to update lastSeen for user:', userId, err.message);
      }
    }

    // Clean up typing status
    if (typingUsers[userId]) {
      const receiverId = typingUsers[userId];
      delete typingUsers[userId];
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userStopTyping', { userId });
      }
    }
  });

  // Message receipt events from clients
  // Client emits 'messageDelivered' when it receives a new message (socket connected)
  // payload: { messageId }
  socket.on('messageDelivered', async ({ messageId }) => {
    try {
      if (!messageId) return;
      const msg = await Message.findById(messageId);
      if (!msg) return;
      // only update if not already delivered
      if (!msg.delivered) {
        msg.delivered = true;
        msg.deliveredAt = new Date();
        await msg.save();

        // notify sender
        const senderSocketId = getReceiverSocketId(msg.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageDelivered', { _id: messageId, delivered: true, deliveredAt: msg.deliveredAt });
        }
      }
    } catch (err) {
      console.warn('Error handling messageDelivered:', err.message);
    }
  });

  // Client emits 'messageRead' when the user opens/reads a message
  // payload: { messageId }
  socket.on('messageRead', async ({ messageId }) => {
    try {
      if (!messageId) return;
      const msg = await Message.findById(messageId);
      if (!msg) return;
      // update read status
      if (!msg.read) {
        msg.read = true;
        msg.readAt = new Date();
        await msg.save();

        // notify sender
        const senderSocketId = getReceiverSocketId(msg.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageRead', { _id: messageId, read: true, readAt: msg.readAt });
        }
      }
    } catch (err) {
      console.warn('Error handling messageRead:', err.message);
    }
  });
});

export { io, app, server };
