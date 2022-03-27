const GeneratorRepository = require(`../repositories/generator.repository`);

class GeneratorService {
  async getOutParams(profileId, userId, query) {
    return await GeneratorRepository.getOutParams(profileId, userId, query);
  }
}
module.exports = new GeneratorService();
