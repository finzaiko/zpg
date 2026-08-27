const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { FastifyAdapter } = require('@bull-board/fastify');
const { schemaIndexQueue, bookmarkIndexQueue } = require('../config/queue');

async function bullBoardRoutes(fastify, options) {
  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: [
      new BullMQAdapter(schemaIndexQueue),
      new BullMQAdapter(bookmarkIndexQueue),
    ],
    serverAdapter,
  });

  serverAdapter.setBasePath('/admin/queues');

  // JWT Authentication Hook - verify token and set cookie for subsequent requests
  fastify.addHook('onRequest', async (request, reply) => {
    // Only apply to /admin/queues routes
    if (!request.url.startsWith('/admin/queues')) {
      return;
    }

    // Check if user is already authenticated via cookie
    const authCookie = request.cookies?.bull_board_auth;
    if (authCookie) {
      try {
        const decoded = fastify.jwt.verify(authCookie);
        request.user = decoded;
        console.log(`[Bull Board] Authenticated via cookie: ${decoded.uid || decoded.username}`);
        return;
      } catch (err) {
        // Cookie invalid, continue to token check
        reply.clearCookie('bull_board_auth');
      }
    }

    // Check for token in query string (first-time access)
    const token = request.query.token;
    if (token) {
      try {
        const decoded = fastify.jwt.verify(token);
        request.user = decoded;

        // Set a secure cookie for subsequent requests
        reply.cookie('bull_board_auth', token, {
          path: '/admin/queues',
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          maxAge: 3600, // 1 hour (in seconds)
          sameSite: 'lax'
        });

        console.log(`[Bull Board] Authenticated via token: ${decoded.uid || decoded.username}`);
        return;
      } catch (err) {
        console.error('[Bull Board] JWT verification failed:', err.message);
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired JWT token'
        });
      }
    }

    // No valid authentication found
    console.log(`[Bull Board] No authentication found for: ${request.url}`);
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'JWT token required in query string. Example: ?token=YOUR_JWT_TOKEN'
    });
  });

  fastify.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
    basePath: '/admin/queues',
  });
}

module.exports = bullBoardRoutes;
