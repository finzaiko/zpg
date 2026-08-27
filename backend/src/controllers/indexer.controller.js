const IndexerService = require("../services/indexer.service");
const { responseHttp } = require("../utils/http.utils");

class IndexerController {
  // Schema Index Endpoints
  async triggerSchemaIndex(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId } = request.body;

      if (!profileId) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId is required",
        });
      }

      const result = await IndexerService.triggerSchemaIndex(profileId, userId);

      responseHttp(reply, 200, "Ok", result);
    } catch (error) {
      console.error("Error triggering schema index:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async getSchemaIndex(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId, schemaName, tableName } = request.query;

      if (!profileId) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId is required",
        });
      }

      const data = await IndexerService.getSchemaIndex(
        profileId,
        userId,
        schemaName,
        tableName
      );

      responseHttp(reply, 200, "Ok", { data });
    } catch (error) {
      console.error("Error getting schema index:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async getSchemaStats(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId } = request.query;

      if (!profileId) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId is required",
        });
      }

      const stats = await IndexerService.getSchemaStats(profileId, userId);

      responseHttp(reply, 200, "Ok", { stats });
    } catch (error) {
      console.error("Error getting schema stats:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async deleteSchemaIndex(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId } = request.params;

      if (!profileId) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "profileId is required",
        });
      }

      await IndexerService.deleteSchemaIndex(profileId, userId);

      responseHttp(reply, 200, "Ok", {
        message: "Schema index deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schema index:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  // Bookmark Endpoints
  async findAllBookmarks(request, reply) {
    try {
      const userId = request.user.uid;
      const { limit, start, search } = request.query;

      const data = await IndexerService.findAllBookmarks(
        userId,
        limit,
        start,
        search
      );

      const countData = await IndexerService.countBookmarks(userId, search);

      responseHttp(reply, 200, "Ok", {
        data: data,
        pos: parseInt(start) || 0,
        total_count: countData.total_count || 0,
      });
    } catch (error) {
      console.error("Error finding bookmarks:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async getBookmarkById(request, reply) {
    try {
      const userId = request.user.uid;
      const { id } = request.params;

      const data = await IndexerService.getBookmarkById(id, userId);

      if (!data) {
        return responseHttp(reply, 404, "Not Found", {
          error: "Bookmark not found",
        });
      }

      responseHttp(reply, 200, "Ok", { data });
    } catch (error) {
      console.error("Error getting bookmark:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async createBookmark(request, reply) {
    try {
      const userId = request.user.uid;
      const { profileId, description, baseQuery } = request.body;

      if (!description || !baseQuery) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "description and baseQuery are required",
        });
      }

      const result = await IndexerService.createBookmark(
        userId,
        profileId,
        description,
        baseQuery
      );

      responseHttp(reply, 201, "Created", result);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async updateBookmark(request, reply) {
    try {
      const userId = request.user.uid;
      const { id } = request.params;
      const { description, baseQuery } = request.body;

      if (!description || !baseQuery) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "description and baseQuery are required",
        });
      }

      const result = await IndexerService.updateBookmark(
        id,
        userId,
        description,
        baseQuery
      );

      if (result.changes === 0) {
        return responseHttp(reply, 404, "Not Found", {
          error: "Bookmark not found or access denied",
        });
      }

      responseHttp(reply, 200, "Ok", {
        message: "Bookmark updated successfully",
      });
    } catch (error) {
      console.error("Error updating bookmark:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async deleteBookmark(request, reply) {
    try {
      const userId = request.user.uid;
      const { id } = request.params;

      const result = await IndexerService.deleteBookmark(id, userId);

      if (result.changes === 0) {
        return responseHttp(reply, 404, "Not Found", {
          error: "Bookmark not found or access denied",
        });
      }

      responseHttp(reply, 200, "Ok", {
        message: "Bookmark deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async searchBookmarks(request, reply) {
    try {
      const userId = request.user.uid;
      const { query } = request.query;

      if (!query) {
        return responseHttp(reply, 400, "Bad Request", {
          error: "query parameter is required",
        });
      }

      const data = await IndexerService.searchBookmarksByDescription(
        userId,
        query
      );

      responseHttp(reply, 200, "Ok", { data });
    } catch (error) {
      console.error("Error searching bookmarks:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  // Queue Management Endpoints
  async getQueueStatus(request, reply) {
    try {
      const { queueId } = request.params;

      const status = await IndexerService.getQueueStatus(queueId);

      if (!status) {
        return responseHttp(reply, 404, "Not Found", {
          error: "Queue not found",
        });
      }

      responseHttp(reply, 200, "Ok", { status });
    } catch (error) {
      console.error("Error getting queue status:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }

  async getQueueHistory(request, reply) {
    try {
      const userId = request.user.uid;
      const { limit } = request.query;

      const history = await IndexerService.getQueueHistory(
        userId,
        limit ? parseInt(limit) : 20
      );

      responseHttp(reply, 200, "Ok", { history });
    } catch (error) {
      console.error("Error getting queue history:", error);
      responseHttp(reply, 500, "Internal Server Error", {
        error: error.message,
      });
    }
  }
}

module.exports = new IndexerController();
