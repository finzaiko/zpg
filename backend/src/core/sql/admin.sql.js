const activeSession = () => {
  return `
    select pid as process_id,
        usename as username,
        datname as database_name,
        client_addr as client_address,
        application_name,
        backend_start,
        state,
        state_change,
        wait_event,
        query
    from pg_stat_activity
    where query not ilike '%from pg_stat_activity%'
    order by backend_start
`;
};

const killSessionID = (pid) => {
  return `
    select pg_terminate_backend(pid)
    from pg_stat_activity
    where pid = '18765';
    `;
};

const tableRowCount = (oid) => {
  return `
        select n.nspname as table_schema,
            c.relname as table_name,
            c.reltuples as rows
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where c.relkind = 'r'
        and n.nspname not in ('information_schema','pg_catalog')
        order by c.reltuples desc;
    `;
};

const dbHitTransaction = () => {
  return `
    SELECT current_setting('port')::INTEGER as port, datname AS dbname, SUM(xact_commit)+SUM(xact_rollback) AS transactions
    FROM pg_stat_database
    WHERE datname NOT IN ('template0','template1')
    GROUP BY datname
    ORDER BY datname
    `;
};

const pgConfigSetting = () => {
  return `SELECT * FROM pg_settings`;
};

const pgFileSetting = () => {
  return `SELECT * FROM pg_file_settings`;
};

const tempFileSize = () => {
  return `select
    stats_reset,
    datname,
    temp_files,
    pg_size_pretty(temp_bytes) as temp_file_size
  from
    pg_stat_database
  order by
    temp_bytes desc;`;
};

const tableSize = () => {
  return `SELECT nspname as schema, relname as table, pg_relation_size(C.oid)::text as "size", pg_size_pretty(pg_relation_size(C.oid)) AS "size_pretty"
    FROM pg_class C
    LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE nspname NOT IN ('pg_catalog', 'information_schema') and relkind='r'
    ORDER BY pg_relation_size(C.oid) DESC;`;
    // https://wiki.postgresql.org/wiki/Disk_Usage
};

module.exports = {
  activeSession,
  killSessionID,
  tableRowCount,
  dbHitTransaction,
  pgConfigSetting,
  pgFileSetting,
  tempFileSize,
  tableSize
};

// REFERENCES: https://dataedo.com/kb/query/postgresql
