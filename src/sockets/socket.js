const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role !== 'admin') return next(new Error('unauthorized'));
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('admin-room');
  });

  return io;
}

function emitNewOrder(io, payload) {
  if (!io) return;
  try {
    io.to('admin-room').emit('newOrder', payload);
  } catch (err) {
    console.error('[socket] Failed to emit newOrder event:', err.message);
  }
}

module.exports = { initSocket, emitNewOrder };
