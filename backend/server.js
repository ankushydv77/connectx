const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const prisma = new PrismaClient();

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, avatar } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: { name, email, password, phone, avatar }
    });

    res.json({
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- API Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CONNECTX Backend Engine' });
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, avatar, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        phone: phone ?? existingUser.phone,
        avatar: avatar ?? existingUser.avatar,
        password: password || existingUser.password,
      },
    });

    res.json({ user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, avatar: updatedUser.avatar } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Room & Participant Management ---
const rooms = new Map(); // roomId -> { participants: Map, host, createdAt }

function createRoom(roomId, userId, userName, userEmail) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      host: userId,
      createdAt: new Date(),
      waitingList: new Map(),
    });
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, socketId, userId, userName, userEmail) {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.set(socketId, {
      userId,
      userName,
      userEmail,
      socketId,
      joinedAt: new Date(),
      isMuted: false,
      isVideoOff: false,
    });
  }
}

function addToWaitingList(roomId, socketId, userId, userName, userEmail) {
  const room = rooms.get(roomId);
  if (room) {
    room.waitingList.set(socketId, {
      userId,
      userName,
      userEmail,
      socketId,
      requestedAt: new Date(),
    });
  }
}

function removeParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) {
    room.participants.delete(socketId);
    room.waitingList.delete(socketId);
    if (room.participants.size === 0 && room.waitingList.size === 0) {
      rooms.delete(roomId);
    }
  }
}

function getRoomParticipants(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.participants.values());
}

function getWaitingList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.waitingList.values());
}

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing');
  });

  // Meeting room functionality
  socket.on('join_room', (data) => {
    const { roomId, userId, userName, userEmail, requiresApproval } = data;

    const room = createRoom(roomId, userId, userName, userEmail);

    if (requiresApproval && userId !== room.host) {
      // Add to waiting list if approval required
      addToWaitingList(roomId, socket.id, userId, userName, userEmail);
      io.to(roomId).emit('waiting_participant', {
        socketId: socket.id,
        userName,
        userEmail,
      });
      socket.emit('waiting_for_approval', {
        roomId,
        message: 'Waiting for host approval',
      });
    } else {
      // Direct join
      addParticipant(roomId, socket.id, userId, userName, userEmail);
      socket.join(roomId);

      // Notify others in room
      socket.to(roomId).emit('participant_joined', {
        socketId: socket.id,
        userName,
        participants: getRoomParticipants(roomId),
      });

      // Send current room state to new participant
      socket.emit('room_state', {
        participants: getRoomParticipants(roomId),
        roomId,
      });
    }
  });

  socket.on('approve_participant', (data) => {
    const { roomId, socketId } = data;
    const room = rooms.get(roomId);

    if (room && room.waitingList.has(socketId)) {
      const participant = room.waitingList.get(socketId);
      room.waitingList.delete(socketId);
      room.participants.set(socketId, {
        ...participant,
        joinedAt: new Date(),
        isMuted: false,
        isVideoOff: false,
      });

      // Join the approved guest to the socket.io room channel
      const guestSocket = io.sockets.sockets.get(socketId);
      if (guestSocket) {
        guestSocket.join(roomId);
      }

      io.to(socketId).emit('approval_granted', {
        roomId,
        participants: getRoomParticipants(roomId),
      });

      io.to(roomId).emit('participant_joined', {
        socketId,
        userName: participant.userName,
        participants: getRoomParticipants(roomId),
      });
    }
  });

  socket.on('reject_participant', (data) => {
    const { roomId, socketId } = data;
    const room = rooms.get(roomId);

    if (room && room.waitingList.has(socketId)) {
      room.waitingList.delete(socketId);
      io.to(socketId).emit('approval_rejected', {
        roomId,
        message: 'Host rejected your meeting request',
      });
    }
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', data);
  });

  socket.on('ice_candidate', (data) => {
    socket.to(data.target).emit('ice_candidate', data);
  });

  socket.on('update_participant_state', (data) => {
    const { roomId, isMuted, isVideoOff } = data;
    const room = rooms.get(roomId);

    if (room && room.participants.has(socket.id)) {
      const participant = room.participants.get(socket.id);
      participant.isMuted = isMuted;
      participant.isVideoOff = isVideoOff;

      io.to(roomId).emit('participant_state_changed', {
        socketId: socket.id,
        isMuted,
        isVideoOff,
      });
    }
  });

  // Caption broadcasting for live translation
  socket.on('send_caption', (data) => {
    const { roomId, captionId, speakerId, senderName, originalText, originalLanguage, translations, timestamp } = data;

    const room = rooms.get(roomId);
    if (!room) return;

    // Broadcast caption to all participants in room
    io.to(roomId).emit('receive_caption', {
      captionId,
      speakerId,
      senderName,
      originalText,
      originalLanguage,
      translations,
      timestamp,
    });
  });

  // Chat messaging
  socket.on('send_room_message', (data) => {
    const { roomId, messageId, text, senderId, senderName, timestamp } = data;

    const room = rooms.get(roomId);
    if (!room) return;

    // Broadcast message to all participants in room
    io.to(roomId).emit('receive_room_message', {
      messageId,
      senderId,
      senderName,
      text,
      timestamp,
      isSystemMessage: false,
    });
  });

  // Hand raise feature
  socket.on('raise_hand', (data) => {
    const { roomId, userId, userName } = data;
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit('participant_hand_raised', {
      socketId: socket.id,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('lower_hand', (data) => {
    const { roomId, userId } = data;
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit('participant_hand_lowered', {
      socketId: socket.id,
      userId,
    });
  });

  // Reaction emojis
  socket.on('send_reaction', (data) => {
    const { roomId, emoji, senderName } = data;
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit('receive_reaction', {
      emoji,
      senderName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('leave_room', (data) => {
    const { roomId } = data;
    removeParticipant(roomId, socket.id);
    socket.leave(roomId);

    io.to(roomId).emit('participant_left', {
      socketId: socket.id,
      participants: getRoomParticipants(roomId),
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove from all rooms
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id) || room.waitingList.has(socket.id)) {
        removeParticipant(roomId, socket.id);
        io.to(roomId).emit('participant_left', {
          socketId: socket.id,
          participants: getRoomParticipants(roomId),
        });
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CONNECTX Backend Server running on port ${PORT}`);
});
