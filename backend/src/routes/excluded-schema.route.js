const { db } = require("../core/database");
const { Pool } = require('pg');

module.exports = function (fastify, opts, done) {
  // Get all excluded schemas for a profile
  fastify.get("/", async (request, reply) => {
    const { profileId } = request.query;

    let sql = "SELECT * FROM excluded_schema";
    const params = [];

    if (profileId) {
      sql += " WHERE profile_id = ?";
      params.push(profileId);
    }

    sql += " ORDER BY schema_name";

    db.all(sql, params, (err, rows) => {
      if (err) {
        return reply.send({
          meta: { code: 500, message: err.message },
          data: null,
        });
      }
      reply.send({
        meta: { code: 200, message: "Success" },
        data: rows || [],
      });
    });
  });

  // Get schemas for a specific profile (to show in dropdown)
  fastify.get("/available-schemas/:profileId", async (request, reply) => {
    const { profileId } = request.params;

    try {
      // Get profile connection details
      const profileSql = "SELECT * FROM profile WHERE id = ? AND type = 2";
      db.get(profileSql, [profileId], async (err, profile) => {
        if (err || !profile) {
          return reply.send({
            meta: { code: 404, message: "Profile not found" },
            data: null,
          });
        }

        // Connect to PostgreSQL and get schemas
        const pool = new Pool({
          host: profile.host,
          port: profile.port,
          database: profile.database,
          user: profile.user,
          password: profile.password,
          ssl: profile.ssl ? { rejectUnauthorized: false } : false,
        });

        try {
          const result = await pool.query(`
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            ORDER BY schema_name
          `);

          await pool.end();

          reply.send({
            meta: { code: 200, message: "Success" },
            data: result.rows.map(r => r.schema_name),
          });
        } catch (error) {
          await pool.end();
          reply.send({
            meta: { code: 500, message: error.message },
            data: null,
          });
        }
      });
    } catch (error) {
      reply.send({
        meta: { code: 500, message: error.message },
        data: null,
      });
    }
  });

  // Add excluded schema
  fastify.post("/", async (request, reply) => {
    const { profileId, schemaName, note, userId } = request.body;

    if (!profileId || !schemaName || !userId) {
      return reply.send({
        meta: { code: 400, message: "Missing required fields" },
        data: null,
      });
    }

    const sql = `
      INSERT INTO excluded_schema (profile_id, schema_name, note, user_id)
      VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [profileId, schemaName, note, userId], function(err) {
      if (err) {
        return reply.send({
          meta: { code: 500, message: err.message },
          data: null,
        });
      }
      reply.send({
        meta: { code: 200, message: "Excluded schema added successfully" },
        data: { id: this.lastID },
      });
    });
  });

  // Delete excluded schema
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params;

    const sql = "DELETE FROM excluded_schema WHERE id = ?";

    db.run(sql, [id], function(err) {
      if (err) {
        return reply.send({
          meta: { code: 500, message: err.message },
          data: null,
        });
      }
      reply.send({
        meta: { code: 200, message: "Excluded schema deleted successfully" },
        data: { changes: this.changes },
      });
    });
  });

  done();
};
