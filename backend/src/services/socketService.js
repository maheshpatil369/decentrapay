/**
 * Socket.IO Service
 * Handles real-time transaction updates and notifications
 *
 * Rooms:
 *   wallet:<address>  — per-wallet updates (tx status, balance changes)
 *   admin             — admin dashboard feed
 *   network:<name>    — network-wide feed
 */
exports.setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins their wallet room
    socket.on("joinWallet", (address) => {
      if (!address) return;
      const room = `wallet:${address.toLowerCase()}`;
      socket.join(room);
      socket.emit("joined", { room, message: `Listening for updates on ${address}` });
      console.log(`   → joined room: ${room}`);
    });

    socket.on("leaveWallet", (address) => {
      socket.leave(`wallet:${address.toLowerCase()}`);
    });

    socket.on("joinAdmin", () => {
      socket.join("admin");
    });

    socket.on("joinNetwork", (network) => {
      socket.join(`network:${network}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
