const ProfileRepository = require(`./profile.repository`);
const { Pool } = require("pg");

class GeneratorRepository {
  async getOutParams(profileId, userId, query, type=1, dtype=0) {
    const sql = `
        CREATE OR REPLACE FUNCTION pg_temp.generator_out(in_sql text, in_type int, in_defined_type int default 0)
        RETURNS text
          LANGUAGE 'plpgsql'
          COST 100
          -- VOLATILE PARALLEL UNSAFE
        AS $BODY$
        DECLARE
        _sql text; _sql_out text;
        _val text;
        _type text := 'data_type';
        BEGIN

      IF in_defined_type=1 THEN
        _type := 'concat_ws(''.'', udt_schema, udt_name)';
      END IF;

      IF in_type=2 THEN
        _sql_out := FORMAT('SELECT string_agg(CHR(10) || column_name || '' '' || %s, '', '') || CHR(10) AS cols_type', _type);
      ELSEIF in_type=3 THEN
        _sql_out := 'SELECT string_agg(CHR(10) || column_name, '', '') || CHR(10) AS cols_type';
      ELSE
        _sql_out := FORMAT('SELECT string_agg(CHR(10) || ''OUT '' || column_name || '' '' || %s, '', '') || CHR(10) AS cols_type', _type);
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

        SELECT * FROM pg_temp.generator_out('${query}', ${type}, ${dtype}) AS data
    `;
    const serverCfg = await ProfileRepository.getById(profileId, 2, userId);
    const pgPool = new Pool(serverCfg[0]);
    const r = await pgPool.query(sql);
    return r[1].rows[0].data;
  }

  async getInsertQuery(profileId, userId, query) {
    const sql = query;
    const serverCfg = await ProfileRepository.getById(profileId, 2, userId);
    const pgPool = new Pool(serverCfg[0]);
    const result = await pgPool.query(sql);
    return result;

  }

}

module.exports = new GeneratorRepository();
