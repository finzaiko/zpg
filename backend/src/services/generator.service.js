const GeneratorRepository = require(`../repositories/generator.repository`);

class GeneratorService {
  async getOutParams(profileId, userId, query, type) {
    query = query.replace(/;*$/, '');
    return await GeneratorRepository.getOutParams(profileId, userId, query, type);
  }
}
module.exports = new GeneratorService();
