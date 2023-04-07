const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");

class GeneratorRepository {
  async getOutParams(profileId, userId, query, type=1) {
    const sql = `
        CREATE OR REPLACE FUNCTION pg_temp.generator_out(in_sql text, in_type int)
        RETURNS text
          LANGUAGE 'plpgsql'
          COST 100
          VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
        _sql text; _sql_out text;
        _val text;
        BEGIN

      IF in_type=2 THEN
        _sql_out := 'SELECT string_agg(CHR(10) || column_name || '' '' || data_type, '', '') || CHR(10) AS cols_type';
      ELSEIF in_type=3 THEN
        _sql_out := 'SELECT string_agg(CHR(10) || column_name, '', '') || CHR(10) AS cols_type';
      ELSE
        _sql_out := 'SELECT string_agg(CHR(10) || ''OUT '' || column_name || '' '' || data_type, '', '') || CHR(10) AS cols_type';
      END IF;

          _sql:='
            DROP VIEW IF EXISTS ztmp CASCADE;
            CREATE OR REPLACE TEMP VIEW ztmp AS (
                ' || in_sql || '
              );
        ' || _sql_out || '
            FROM information_schema.columns WHERE table_name = ''ztmp'';
            ';
        EXECUTE _sql INTO _val;
        RETURN _val;
        END;
        $BODY$;

        SELECT * FROM pg_temp.generator_out('${query}', ${type}) AS data
    `;
    const serverCfg = await ProfileRepository.getById(profileId, 2, userId);
    const pgPool = new Pool(serverCfg[0]);
    const r = await pgPool.query(sql);
    return r[1].rows[0].data;
  }
}

module.exports = new GeneratorRepository();
