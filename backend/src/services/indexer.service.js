const IndexerRepository = require("../repositories/indexer.repository");
const ProfileRepository = require("../repositories/profile.repository");
const { schemaIndexQueue, bookmarkIndexQueue } = require("../config/queue");
const { decrypt } = require("../utils/webcrypto.util");
const { ENCRYPT_PASSWORD } = require("../config/contant");

class IndexerService {
  // Schema Indexing
  async triggerSchemaIndex(profileId, userId) {
    // Get profile connection details
    const profile = await ProfileRepository.getById(profileId, 2, userId);

    if (!profile || profile.length === 0) {
      throw new Error("Profile not found");
    }

    const conn = profile[0];

    // Decrypt password
    let password = conn.password;
    if (ENCRYPT_PASSWORD === 1) {
      password = await decrypt(conn.password);
    }

    // Prepare connection config
    const connectionConfig = {
      host: conn.host,
      port: conn.port || 5432,
      database: conn.database,
      user: conn.user,
      password: password,
      ssl: conn.ssl === 1,
    };

    // Create queue record
    const queueRecord = await IndexerRepository.createIndexQueue(
      "schema-index",
      profileId,
      null,
      userId
    );

    // Add job to BullMQ queue
    await schemaIndexQueue.add(
      `schema-index-${profileId}`,
      {
        profileId,
        userId,
        connectionConfig,
      },
      {
        jobId: queueRecord.id.toString(),
      }
    );

    return {
      success: true,
      queueId: queueRecord.id,
      message: "Schema indexing job queued successfully",
    };
  }

  async getSchemaIndex(profileId, userId, schemaName, tableName) {
    // Use profileId as db_id for schema_embedding table
    return await IndexerRepository.getSchemaEmbedding(
      profileId,
      schemaName,
      tableName
    );
  }

  async getSchemaStats(profileId, userId) {
    // Use profileId as db_id for schema_embedding table
    return await IndexerRepository.getSchemaStats(profileId);
  }

  async deleteSchemaIndex(profileId, userId) {
    // Verify user owns this profile
    const profile = await ProfileRepository.getById(profileId, 2, userId);
    if (!profile || profile.length === 0) {
      throw new Error("Profile not found or access denied");
    }

    return await IndexerRepository.deleteSchemaEmbedding(profileId);
  }

  // Bookmark Management
  async findAllBookmarks(userId, limit, offset, search) {
    if (typeof limit === "undefined") {
      limit = 100;
    }
    if (typeof offset === "undefined") {
      offset = 0;
    }

    return await IndexerRepository.findAllBookmarks(userId, limit, offset, search);
  }

  async countBookmarks(userId, search) {
    return await IndexerRepository.countBookmarks(userId, search);
  }

  async getBookmarkById(id, userId) {
    return await IndexerRepository.getBookmarkById(id, userId);
  }

  async createBookmark(userId, profileId, description, baseQuery, autoIndex = true) {
    const result = await IndexerRepository.createBookmark(
      userId,
      profileId,
      description,
      baseQuery
    );

    // Trigger background indexing for embedding
    if (autoIndex && result.id) {
      await this.triggerBookmarkIndex(result.id, userId, description, baseQuery);
    }

    return result;
  }

  async updateBookmark(id, userId, description, baseQuery, autoIndex = true) {
    const result = await IndexerRepository.updateBookmark(
      id,
      userId,
      description,
      baseQuery
    );

    // Trigger background re-indexing
    if (autoIndex && result.changes > 0) {
      await this.triggerBookmarkIndex(id, userId, description, baseQuery);
    }

    return result;
  }

  async deleteBookmark(id, userId) {
    return await IndexerRepository.deleteBookmark(id, userId);
  }

  async searchBookmarksByDescription(userId, query) {
    return await IndexerRepository.searchBookmarksByDescription(userId, query);
  }

  // Bookmark Indexing (for vector embeddings)
  async triggerBookmarkIndex(bookmarkId, userId, description, baseQuery) {
    // Create queue record
    const queueRecord = await IndexerRepository.createIndexQueue(
      "bookmark-index",
      null,
      bookmarkId,
      userId
    );

    // Add job to BullMQ queue
    await bookmarkIndexQueue.add(
      `bookmark-index-${bookmarkId}`,
      {
        bookmarkId,
        userId,
        description,
        baseQuery,
      },
      {
        jobId: queueRecord.id.toString(),
      }
    );

    return {
      success: true,
      queueId: queueRecord.id,
      message: "Bookmark indexing job queued successfully",
    };
  }

  // Queue Management
  async getQueueStatus(queueId) {
    return await IndexerRepository.getQueueStatus(queueId);
  }

  async getQueueHistory(userId, limit) {
    return await IndexerRepository.getQueueHistory(userId, limit);
  }
}

module.exports = new IndexerService();
