const schemaList = `
        SELECT
            schema_name AS id,
            schema_name AS value
        FROM
            information_schema.schemata
        WHERE
            schema_name NOT IN ('information_schema')
            AND schema_name NOT LIKE ALL (ARRAY['pg%', 'log%']) ORDER BY schema_name;
    `;

const schemaInfo = (schema, oidArr, isShowTable, aliasId) => {
  let sql = `
    SELECT
        *
    FROM (
            (
              SELECT 
                  prc.oid AS id, 
                  isr.specific_schema AS z_schema, 
                  prc.proname AS z_name, 
                  isr.type_udt_name AS z_return,
                  'f'::text AS z_type,
                  1::int AS z_tasktype,
                  COUNT(*) FILTER(WHERE isp.parameter_mode='IN')::int AS z_params_in,
                  LENGTH(regexp_replace(pg_get_functiondef(prc.oid), E'[\n\r]+', '', 'g')) AS z_content
                  --prc.oid AS ${aliasId}
              FROM information_schema.routines isr
              INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
              INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
              WHERE isr.specific_schema NOT IN ('pg_catalog', 'information_schema')
        `;
  if (oidArr !== undefined) {
    sql += ` AND prc.oid IN (${oidArr})`;
  }
  if (schema !== undefined && schema != "") {
    sql += ` AND isr.specific_schema='${schema}'`;
  }
  sql += ` GROUP BY 1, 2, 3, 4 
            )
          `;
  if (isShowTable && isShowTable == "true") {
    sql += `
          UNION 
          (
              SELECT
                  (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_schema) || '.' || quote_ident(table_name)) AS id,
                  table_schema AS z_schema,
                  table_name AS z_name,
                  null::text As z_return,
                  't'::text AS z_type,
                  null::int AS z_params_in,
                  2::int AS z_tasktype,
                  COUNT(*) FILTER (WHERE column_name IS NOT NULL)::int AS z_content
                FROM information_schema.columns 
                WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                `;
    if (schema !== undefined && schema != "") {
      sql += ` AND table_schema='${schema}'`;
    }
    sql += ` GROUP BY 1, 2, 3 
            )  
            `;
  }
  sql += `) tt ORDER BY z_type, z_schema, z_name`;
  return sql;
};

const diffDetail = (schema, oid, funcName, retType, paramsIn) => {
  let sql = `
  WITH t AS (
  SELECT 
      prc.oid AS id, 
      isr.specific_schema, 
      prc.proname, 
      isr.type_udt_name,
      COUNT(*) FILTER(WHERE isp.parameter_mode='IN') AS params_in,
      COUNT(*) FILTER(WHERE isp.parameter_mode='OUT') AS params_out,
      COUNT(*) FILTER(WHERE isp.parameter_mode='INOUT') AS params_inout,
      (COUNT(*) FILTER(WHERE isp.parameter_mode='IN')
      +COUNT(*) FILTER(WHERE isp.parameter_mode='OUT')
      +COUNT(*) FILTER(WHERE isp.parameter_mode='INOUT')
      ) as params_length,
      LENGTH(regexp_replace(pg_get_functiondef(prc.oid), E'[\n\r]+', '', 'g')) AS sql_length
      FROM information_schema.routines isr
      INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
      INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
      WHERE isr.specific_schema NOT IN ('pg_catalog', 'information_schema')
    GROUP BY 1, 2, 3, 4) 
    -- SELECT params_in, params_out, params_inout, params_length, sql_length FROM t
    SELECT * FROM t
`;
  if (oid) {
    sql += ` WHERE id=${oid}`;
  } else {
    sql += ` WHERE 
              specific_schema='${schema}' AND
              proname='${funcName}' AND
              type_udt_name = '${retType}' AND
              params_in=${paramsIn}
            `;
  }
  return sql;
};

const contentDiff = (schemaTableName, oid, type) => {
  let sql = `
  WITH attrdef AS (
    SELECT
        n.nspname,
        c.relname,
        pg_catalog.array_to_string(c.reloptions || array(select 'toast.' || x from pg_catalog.unnest(tc.reloptions) x), ', ') as relopts,
        c.relpersistence,
        a.attnum,
        a.attname,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as atttype,
        (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid, true) for 128) FROM pg_catalog.pg_attrdef d
            WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef) as attdefault,
        a.attnotnull,
        (SELECT c.collname FROM pg_catalog.pg_collation c, pg_catalog.pg_type t
            WHERE c.oid = a.attcollation AND t.oid = a.atttypid AND a.attcollation <> t.typcollation) as attcollation,
        a.attidentity,
        a.attgenerated
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_catalog.pg_class tc ON (c.reltoastrelid = tc.oid)
    WHERE a.attrelid = '${schemaTableName}'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
    ORDER BY a.attnum
),
coldef AS (
    SELECT
        attrdef.nspname,
        attrdef.relname,
        attrdef.relopts,
        attrdef.relpersistence,
        pg_catalog.format(
            '%I %s%s%s%s%s',
            attrdef.attname,
            attrdef.atttype,
            case when attrdef.attcollation is null then '' else pg_catalog.format(' COLLATE %I', attrdef.attcollation) end,
            case when attrdef.attnotnull then ' NOT NULL' else '' end,
            case when attrdef.attdefault is null then ''
                else case when attrdef.attgenerated = 's' then pg_catalog.format(' GENERATED ALWAYS AS (%s) STORED', attrdef.attdefault)
                    when attrdef.attgenerated <> '' then ' GENERATED AS NOT_IMPLEMENTED'
                    else pg_catalog.format(' DEFAULT %s', attrdef.attdefault)
                end
            end,
            case when attrdef.attidentity<>'' then pg_catalog.format(' GENERATED %s AS IDENTITY',
                    case attrdef.attidentity when 'd' then 'BY DEFAULT' when 'a' then 'ALWAYS' else 'NOT_IMPLEMENTED' end)
                else '' end
        ) as col_create_sql
    FROM attrdef
    ORDER BY attrdef.attnum
),
tabdef AS (
    SELECT
        coldef.nspname,
        coldef.relname,
        coldef.relopts,
        coldef.relpersistence,
        string_agg(coldef.col_create_sql, E',\n    ') as cols_create_sql
    FROM coldef
    GROUP BY
        coldef.nspname, coldef.relname, coldef.relopts, coldef.relpersistence
)
SELECT
    format(
        'CREATE%s TABLE %I.%I%s%s%s;',
        case tabdef.relpersistence when 't' then ' TEMP' when 'u' then ' UNLOGGED' else '' end,
        tabdef.nspname,
        tabdef.relname,
        coalesce(
            (SELECT format(E'\n    PARTITION OF %I.%I %s\n', pn.nspname, pc.relname,
                pg_get_expr(c.relpartbound, c.oid))
                FROM pg_class c JOIN pg_inherits i ON c.oid = i.inhrelid
                JOIN pg_class pc ON pc.oid = i.inhparent
                JOIN pg_namespace pn ON pn.oid = pc.relnamespace
                WHERE c.oid = '${schemaTableName}'::regclass),
            format(E' (\n    %s\n)', tabdef.cols_create_sql)
        ),
        case when tabdef.relopts <> '' then format(' WITH (%s)', tabdef.relopts) else '' end,
        coalesce(E'\nPARTITION BY '||pg_get_partkeydef('${schemaTableName}'::regclass), '')
    ) as value
FROM tabdef
`;

  if (type == "f") {
    //sql = `SELECT pg_get_functiondef(${oid}) AS value`;
    sql = `
    SELECT CONCAT_WS('',
        '\n',
        (
        REPLACE(
        REPLACE(
            SPLIT_PART(
            pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')),
            E'\n', 1)
        ,',',E',\n\t')
        ,'(',E'(\n\t')
        )
        ,
        (REPLACE(
            pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')),
            split_part(pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = '${oid}')), E'\n', 1),
            ''
        ))
    ) AS value;
    `;
  }

  return sql;
};

module.exports = {
  schemaList,
  schemaInfo,
  diffDetail,
  contentDiff,
};
