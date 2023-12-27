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

const tableSize = (schema) => {
  let whereSchema = "";
  if (schema) {
    whereSchema = `AND nspname='${schema}'`;
  }
  return `SELECT relname as name, pg_size_pretty(pg_relation_size(C.oid)) AS "size", pg_relation_size(C.oid)::text as actual_size
  ,(xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', nspname, relname), FALSE, TRUE, '')))[1]::text::int AS row_count
    FROM pg_class C
    LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE nspname NOT IN ('pg_catalog', 'information_schema') and relkind='r' ${whereSchema}
    ORDER BY pg_relation_size(C.oid) DESC;`;
  // https://wiki.postgresql.org/wiki/Disk_Usage
  // https://stackoverflow.com/questions/21738408/postgresql-list-and-order-tables-by-size
};

const schemaSize = () => {
  return `WITH
    schemas AS (
    SELECT schemaname as name, sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as size FROM pg_tables
    GROUP BY schemaname
  ), db AS (
    SELECT pg_database_size(current_database()) AS size
  )
  SELECT schemas.name, pg_size_pretty(schemas.size) as "size", schemas.size as actual_size
  FROM schemas ORDER BY schemas.size DESC;
  `;
};

const dbSize = () => {
  return `
  SELECT d.datname AS name,
      CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
          THEN pg_catalog.pg_size_pretty(pg_catalog.pg_database_size(d.datname))
          ELSE 'No Access'
      END AS "size",
      pg_catalog.pg_database_size(d.datname) as actual_size
  FROM pg_catalog.pg_database d
  WHERE d.datname NOT IN ('template0','template1','postgres')
      ORDER BY
      CASE WHEN pg_catalog.has_database_privilege(d.datname, 'CONNECT')
          THEN pg_catalog.pg_database_size(d.datname)
          ELSE NULL
      END DESC -- nulls first
      -- LIMIT 20
  `;
};

const runQueries = () => {
  return `
  SELECT pid, age(clock_timestamp(), query_start), usename, query, state
  FROM pg_stat_activity
  WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
  ORDER BY query_start desc;
`;
};

const connOpen = () => {
  return `
  SELECT COUNT(*) as connections, backend_type
  FROM pg_stat_activity
  where state = 'active' OR state = 'idle'
  GROUP BY backend_type
  ORDER BY connections DESC;
`;
};

module.exports = {
  activeSession,
  killSessionID,
  tableRowCount,
  dbHitTransaction,
  pgConfigSetting,
  pgFileSetting,
  tempFileSize,
  tableSize,
  schemaSize,
  dbSize,
  runQueries,
  connOpen,
};

// REFERENCES: https://dataedo.com/kb/query/postgresql
