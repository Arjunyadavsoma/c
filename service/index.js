// service/index.js
module.exports = {
  start(ctx) {
    // Register remote-key listener
    ctx.on('key', (key) => {
      try {
        // Forward key event to every connected web client (inject script listens)
        ctx.broadcast('tizen_remote_key', { key });
      } catch (e) {
        console.warn('[cineby] broadcast failed:', e);
      }
    });
  },

  stop() {
    // Nothing required for now
  }
};
