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

module.exports = {
  activeSession,
  killSessionID,
  tableRowCount,
  dbHitTransaction,
  pgConfigSetting,
  pgFileSetting
};

// REFERENCES: https://dataedo.com/kb/query/postgresql
