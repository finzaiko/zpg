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

const schemaInfo = (schema, oidArr, filter, aliasId) => {
  let sql = "";

  let sqlFunc = `
      SELECT
      prc.oid AS id,
      isr.specific_schema AS z_schema,
      prc.proname AS z_name,
      isr.type_udt_name AS z_return,
      'f'::text AS z_type,
      -- 1::int AS z_tasktype,
      COUNT(*) FILTER(WHERE isp.parameter_mode='IN')::int AS z_params_in,
      COUNT(*) FILTER(WHERE isp.parameter_mode='OUT')::int AS z_params_out,
      LENGTH(regexp_replace(pg_get_functiondef(prc.oid), E'[\n\r]+', '', 'g')) AS z_content,
      STRING_AGG(isp.data_type, ',' order by isp.dtd_identifier) FILTER(WHERE isp.parameter_mode='IN') as params_in_type
    FROM information_schema.routines isr
    INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
    INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
    WHERE isr.specific_schema NOT IN ('pg_catalog', 'information_schema')
  `;

  if (oidArr !== undefined) {
    sqlFunc += ` AND prc.oid IN (${oidArr})`;
  }
  if (schema !== undefined && schema != "") {
    sqlFunc += ` AND isr.specific_schema='${schema}'`;
  }

  sqlFunc += ` GROUP BY 1, 2, 3, 4`;

  let sqlTable = `
  SELECT
    COALESCE(
      (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_schema) || '.' || quote_ident(table_name))
      ,(SELECT oid FROM pg_class WHERE relname = quote_ident(table_name) AND relkind = 'r' LIMIT 1)
    )AS id,
    table_schema AS z_schema,
    table_name AS z_name,
    null::text As z_return,
    't'::text AS z_type,
    null::int AS z_params_in,
    null::int AS z_params_out,
    -- 2::int AS z_tasktype,
    COUNT(*) FILTER (WHERE column_name IS NOT NULL)::int AS z_content
  FROM information_schema.columns
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  `;

  if (schema !== undefined && schema != "") {
    sqlTable += ` AND table_schema='${schema}'`;
  }

  sqlTable += ` GROUP BY 1, 2, 3 `;


  let sqlTableFunc = `
    SELECT * FROM ((
        ${sqlFunc}
      )UNION (
        ${sqlTable}
      )) t ORDER BY z_type, z_schema, z_name;
  `;

  if(filter==1){
    sql = sqlTable;
  }else if(filter==2){
    sql = sqlFunc;
  }else if(filter==3){
    sql = sqlTableFunc;
  }

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
      LENGTH(regexp_replace(pg_get_functiondef(prc.oid), E'[\n\r]+', '', 'g')) AS sql_length,
      STRING_AGG(isp.data_type, ',' order by isp.dtd_identifier) FILTER(WHERE isp.parameter_mode='IN') as params_in_type
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
  // console.log(`sql`, sql);
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
  // console.log('sql>>>>>>>>>>>>>> ',sql);

  if(oid==0){
    sql = "SELECT '' AS value";
  }
  return sql;
};

const compareDefenition = () => {
  let sql = `
    SELECT
        ROW_NUMBER () OVER (
              ORDER BY z_name
      ) as id,
      *,
      CASE WHEN val_a!=val_b OR z_params_in_type_a!=z_params_in_type_b OR val_a is null OR val_b is null THEN true ELSE false END as diff,
      CASE
        WHEN val_a!=val_b OR z_params_in_type_a!=z_params_in_type_b THEN 'dif'
        WHEN val_a is null THEN 'src'
        WHEN val_b is null THEN 'trg'
        ELSE null END as err
      FROM
      (
        SELECT
          a.z_schema,
          a.z_name,
          a.z_return,
          a.z_params_in,
          a.z_params_in_type as z_params_in_type_a,
		      b.z_params_in_type as z_params_in_type_b,
          a.z_params_out,
          a.z_type,
          1 as z_tasktype,
          COALESCE(a.oid,0) as id_a,
          a.z_content val_a,
          COALESCE(b.oid,0) id_b,
          b.z_content val_b
        FROM tbl_a a LEFT JOIN tbl_b b ON a.z_name=b.z_name AND a.z_schema=b.z_schema AND a.z_params_in=b.z_params_in
        UNION
        SELECT
          b.z_schema,
          b.z_name,
          b.z_return,
          b.z_params_in,
          a.z_params_in_type as z_params_in_type_a,
		      b.z_params_in_type as z_params_in_type_b,
          b.z_params_out,
          b.z_type,
          1 as z_tasktype,
          COALESCE(a.oid,0) as id_a,
          a.z_content val_a,
          COALESCE(b.oid,0) id_b,
          b.z_content val_b
        FROM tbl_b b LEFT JOIN tbl_a a ON a.z_name=b.z_name AND a.z_schema=b.z_schema AND a.z_params_in=b.z_params_in
        WHERE a.z_name IS NULL
      ) t ORDER BY z_schema, z_name
    `;
    // console.log('sql##############',sql);

    return sql;
}
const countRowTable = (exludeShema, schema) => {
  if(typeof exludeShema=="undefined"){
    exludeShema = "";
  }
  // oid, z_schema, z_name, z_return, z_type, z_params_in, z_params_out, z_content
  let sql = `
  create or replace function
    pg_temp.count_rows(schema text, tablename text) returns integer
    as
    $body$
    declare
      result integer;
      query varchar;
    begin
      query := 'SELECT count(1) FROM "' || schema || '"."' || tablename || '"';
      execute query into result;
      return result;
    end;
    $body$
    language plpgsql;

    select
      null::text as oid,
      table_schema as z_schema,
      table_name as z_name,
      null::text as z_return,
      null::text as z_type,
      null::text as z_params_in,
      null::text as z_params_out,
      pg_temp.count_rows(table_schema, table_name) as z_content
    from information_schema.tables
    where
      table_schema not in ('pg_catalog', 'information_schema')
      and table_type='BASE TABLE'
  `;

  // if (schema !== undefined && schema != "") {
  //   sql += ` and table_schema='${schema}'`;
  // }

  sql += ` and table_schema like any('{${exludeShema}}'::text[]) is not true order by 1,2`;

  // console.log('sql>>>>>>>>>>>',sql);

  return sql;
}

const dropSqlDefenition = (type, oid) => {
  let sql = `SELECT '' as value`;
  let sqlFDrop = `
    select
      CONCAT('DROP FUNCTION IF EXISTS ',isr.specific_schema|| '.' ||  routine_name,'(',string_agg(isp.data_type::text,','),');')
    as value
    FROM information_schema.routines isr
    INNER JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
    INNER JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
    where prc.oid=${oid} AND parameter_mode='IN'
    group by routine_name, isr.specific_schema
    `;

    let sqlTDrop = `
    select value from (
      SELECT
          CASE WHEN table_schema<>'public' THEN
          (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_schema) || '.' || quote_ident(table_name))
          ELSE
          (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_name))
          END AS oid,
          concat('DROP TABLE IF EXIST ', table_schema,'.', table_name) as value
          FROM information_schema.columns
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY 1,2
    ) t where oid=${oid}
    `;

    if(type=='t'){
      sql= sqlTDrop;
    }else if(type='f'){
      sql= sqlFDrop;
    }
    // console.log('sql+++++++++',sql);

    return sql;
}

module.exports = {
  schemaList,
  schemaInfo,
  diffDetail,
  contentDiff,
  countRowTable,
  compareDefenition,
  dropSqlDefenition,
};

