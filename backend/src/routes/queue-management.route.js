const { schemaIndexQueue, bookmarkIndexQueue } = require('../config/queue');

module.exports = function(fastify, opts, done) {

  // Get queue stats
  fastify.get('/queue-stats', async (request, reply) => {
    try {
      const schemaStats = await schemaIndexQueue.getJobCounts();
      const bookmarkStats = await bookmarkIndexQueue.getJobCounts();

      reply.send({
        schemaIndexQueue: schemaStats,
        bookmarkIndexQueue: bookmarkStats,
      });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Pause a queue
  fastify.post('/queue/:queueName/pause', async (request, reply) => {
    try {
      const { queueName } = request.params;
      const queue = queueName === 'schema' ? schemaIndexQueue : bookmarkIndexQueue;

      await queue.pause();
      reply.send({ message: `${queueName} queue paused` });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Resume a queue
  fastify.post('/queue/:queueName/resume', async (request, reply) => {
    try {
      const { queueName } = request.params;
      const queue = queueName === 'schema' ? schemaIndexQueue : bookmarkIndexQueue;

      await queue.resume();
      reply.send({ message: `${queueName} queue resumed` });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Clear all jobs from a queue (waiting, delayed, failed, completed)
  fastify.post('/queue/:queueName/clear', async (request, reply) => {
    try {
      const { queueName } = request.params;
      const queue = queueName === 'schema' ? schemaIndexQueue : bookmarkIndexQueue;

      // Clean different job states
      await queue.drain(); // Remove all waiting jobs
      await queue.clean(0, 1000, 'completed'); // Remove completed jobs
      await queue.clean(0, 1000, 'failed'); // Remove failed jobs
      await queue.clean(0, 1000, 'delayed'); // Remove delayed jobs

      reply.send({ message: `${queueName} queue cleared` });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Remove a specific job
  fastify.delete('/queue/:queueName/job/:jobId', async (request, reply) => {
    try {
      const { queueName, jobId } = request.params;
      const queue = queueName === 'schema' ? schemaIndexQueue : bookmarkIndexQueue;

      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        reply.send({ message: `Job ${jobId} removed` });
      } else {
        reply.code(404).send({ error: 'Job not found' });
      }
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Obliterate - completely remove queue and all data
  fastify.post('/queue/:queueName/obliterate', async (request, reply) => {
    try {
      const { queueName } = request.params;
      const queue = queueName === 'schema' ? schemaIndexQueue : bookmarkIndexQueue;

      await queue.obliterate({ force: true });
      reply.send({ message: `${queueName} queue obliterated` });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  done();
};
