const GeneratorRepository = require(`../repositories/generator.repository`);

class GeneratorService {
  async getOutParams(profileId, userId, query) {
    query = query.replace(/;*$/, '');
    return await GeneratorRepository.getOutParams(profileId, userId, query);
  }
}
module.exports = new GeneratorService();
