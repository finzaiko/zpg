const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");

class GeneratorRepository {
  async getOutParams(profileId, userId, query) {
    const sql = `
        CREATE OR REPLACE FUNCTION pg_temp.generator_out(in_sql text)
        RETURNS text 
          LANGUAGE 'plpgsql'
          COST 100
          VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
        _sql text;
        _val text;
        BEGIN
          _sql:='
            DROP VIEW IF EXISTS ztmp CASCADE;
            CREATE OR REPLACE TEMP VIEW ztmp AS (
                ' || in_sql || '
              );
              SELECT string_agg(CHR(10) || ''OUT '' || column_name || '' '' || data_type, '', '') || CHR(10) AS cols_type 
              FROM information_schema.columns WHERE table_name = ''ztmp'';
            ';
        EXECUTE _sql INTO _val; 
        RETURN _val;
        END;
        $BODY$;

        SELECT * FROM pg_temp.generator_out('${query}') AS data
    `;
    const serverCfg = await ProfileRepository.getById(profileId, 2, userId);
    const pgPool = new Pool(serverCfg[0]);
    const r = await pgPool.query(sql);
    return r[1].rows[0].data;
  }
}

module.exports = new GeneratorRepository();
