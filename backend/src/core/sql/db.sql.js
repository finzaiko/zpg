const dbAll = `select oid || '_d' as id, datname as value, true::boolean as webix_kids from pg_database
where datname not in ('postgres','template0','template1') order by datname`;

const dbSchemaAll = `select oid || '_s' as id, nspname as value,true::boolean as webix_kids  from pg_catalog.pg_namespace
where  nspname not in ('information_schema') and nspname not like 'pg\_%' order by nspname`;

const _getAllFunc = `
    SELECT
      prc.oid AS id,
      isr.specific_schema AS schema,
      prc.proname AS name,
      isr.type_udt_name AS return_type,
      COUNT(*) FILTER(WHERE isp.parameter_mode='IN') AS params_in,
      COUNT(*) FILTER(WHERE isp.parameter_mode='OUT') AS params_out,
      COUNT(*) FILTER(WHERE isp.parameter_mode='INOUT') AS params_inout,
      COUNT(*) FILTER(WHERE isp.parameter_mode='INOUT') AS params_inout,
      (COUNT(*) FILTER(WHERE isp.parameter_mode='IN')
      +COUNT(*) FILTER(WHERE isp.parameter_mode='OUT')
      +COUNT(*) FILTER(WHERE isp.parameter_mode='INOUT')
      ) as params_length,
      LENGTH(regexp_replace(pg_get_functiondef(prc.oid), E'[
      ]+', '', 'g')) AS sql_length,
      'f'::text AS type,
      1::int AS task_type
      FROM information_schema.routines isr
      LEFT JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
      LEFT JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
      WHERE isr.specific_schema NOT IN ('pg_catalog', 'information_schema')
`;

const dbAllByOid = (rootOid) => {
  return `select datname from pg_database where oid=${rootOid}`;
};

const dbSchemaAllByOid = (oidId) => {
  return `select nspname from pg_catalog.pg_namespace where oid=${oidId}`;
};

const dbAllFunc = (schema, oidArr) => {
  let _schema = "",
    _oidArr = "";
  if (oidArr != "undefined" && oidArr) {
    _oidArr = ` AND prc.oid IN (${oidArr})`;
  }
  if (schema != "undefined" && schema) {
    _schema = ` AND isr.specific_schema='${schema}'`;
  }

  return `SELECT * FROM
          (${_getAllFunc} ${_schema} ${_oidArr}
        GROUP BY 1, 2, 3, 4 order by prc.proname )t
    `;
};

const dbAllFuncBySchema = (schemaName) => {
  return `SELECT id || '_g' as id, name || '(r:'|| return_type ||', i:'|| params_in || ')' AS value FROM
          (${_getAllFunc} AND isr.specific_schema='${schemaName}'
        GROUP BY 1, 2, 3, 4 order by prc.proname )t
    `;
};

const dbAllTableBySchema = (schemaName) => {
  return `SELECT
      CASE WHEN table_schema<>'public' THEN
        (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_schema) || '.' || quote_ident(table_name)) || '_u'
      ELSE
        (SELECT oid FROM pg_class WHERE oid::regclass::text = quote_ident(table_name)) || '_u'
      END AS id,
      table_name AS value
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    and table_schema='${schemaName}'
    GROUP BY 1, 2  order by table_name
    `;
};

const dbAllFuncTriggerBySchema = (schemaOid) => {
  return `SELECT p.oid || '_w' as id, proname as value
    FROM  pg_proc p
    JOIN  pg_user u ON u.usesysid = p.proowner
    WHERE usename <> 'postgres' AND prorettype = 2279
    and pronamespace=${schemaOid}
    `;
};

const dbAllViewsBySchema = (schemaOid) => {
  return `SELECT
    c.oid || '_y' as id,
    -- n.oid as schema_oid
    c.relname AS value
    FROM pg_catalog.pg_class c
    LEFT JOIN pg_catalog.pg_namespace n ON (n.oid = c.relnamespace)
    WHERE c.relkind  = 'v' and n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.oid=${schemaOid}
    GROUP BY 1,2
    ORDER BY c.relname
    `;
};

const dbFuncContentByOid = (oid) => {

    const commentBase = `
      WITH a AS (
        SELECT prc.oid, isp.data_type, isp.parameter_name, isr.specific_schema, isr.routine_name, isp.parameter_mode
        FROM information_schema.routines isr
        LEFT JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
        LEFT JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
        where prc.oid=${oid}
      ), b AS (
        SELECT
          coalesce(string_agg(a.data_type::text,','),'') AS in_params_type,
          coalesce(string_agg(a.parameter_name::text,','),'') AS in_params_name
        FROM a
        WHERE parameter_mode='IN'
      ), c AS (
        SELECT DISTINCT ON (oid) * FROM a, b
      )
    `;

    let commentDefinition = `
      (${commentBase}
      SELECT
      CONCAT(
        '-- FUNCTION: ', specific_schema|| '.' ||  routine_name,'(',in_params_type,');',
        e'\n\n',
              '-- DROP FUNCTION IF EXISTS ',specific_schema|| '.' ||  routine_name,'(',in_params_type,');',
        e'\n')
        as func_def
      FROM c)
    `;

    let commentSample = `
      (${commentBase}
        SELECT CONCAT(
        '-- PARAMS NAME: ', in_params_type , e'\n',
        '-- PARAMS TYPE: ', in_params_name , e'\n',
        '-- SELECT * FROM ', specific_schema|| '.' ||  routine_name,'()') as func_def
      FROM c)
  `;

  let sql = `
        SELECT CONCAT_WS('',
        ${commentDefinition},
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
            )),
            ';',
            e'\n\n',
            ${commentSample}
        ) AS data;
        `;
  return sql;
};

const dbTableContentByOid = (oid) => {
  let regClass = `
    (select nsp.nspname || '.' || tbl.relname
    from pg_namespace nsp join pg_class tbl on nsp.oid = tbl.relnamespace
    where tbl.oid = ${oid})
  `;

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
        WHERE a.attrelid = ${regClass}::regclass
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
                    WHERE c.oid = ${regClass}::regclass),
                format(E' (\n    %s\n)', tabdef.cols_create_sql)
            ),
            case when tabdef.relopts <> '' then format(' WITH (%s)', tabdef.relopts) else '' end,
            coalesce(E'\nPARTITION BY '||pg_get_partkeydef(${regClass}::regclass), '')
        ) as data
    FROM tabdef
  `;
  return sql;
};

const dbTableContentByOid2 = (oid) => {
  let sql = `
  create or replace function pg_temp.table_def(oid_id int)
  returns text as $$
  declare res text := '--Table not found';
  declare table_check integer;
  declare rec record;
  declare idx_str text := '';
  declare owr_str text := '';
  declare usename text := '';
  declare grt_str text := '';
  declare com_str text := '';
  declare comma_flg boolean := false;
  declare _schema_name text;
  declare _table_name text;
  begin
  -- SOURCE: https://github.com/ester41/pg_scripts/blob/master/pg_get_tabledef.sql

  select nsp.nspname, tbl.relname into _schema_name, _table_name
  from pg_namespace nsp join pg_class tbl on nsp.oid = tbl.relnamespace
  where tbl.oid=oid_id;

  --Schema null check
    if _schema_name is null then
      select current_schema() into _schema_name;
    end if;

  --Convert arguments to lowercase
  --(Because PostgreSQL manages definitions in lowercase)
    _schema_name := lower(_schema_name);
    _table_name := lower(_table_name);

    --Check for table presence
    select
      1 into table_check
    from pg_class pc
    inner join pg_namespace pn
      on pn.oid = pc.relnamespace
    where
      pn.nspname = _schema_name
      and pc.relname = _table_name;

    if table_check is not null then

  --Definition creation
      res := '-- DROP TABLE IF EXISTS ' || _schema_name || '.' || _table_name || ' CASCADE;' || chr(10) || chr(10);
      res := res || 'CREATE TABLE ' || _schema_name || '.' || _table_name || ' (' || chr(10);

      for rec in
        select
          pa.attnum
          , concat(e'\t',pa.attname) as attname
          , pg_catalog.format_type(pa.atttypid, pa.atttypmod) || case
            when pa.attnotnull
              then ' not null'
              else ''
            end || ' ' || coalesce(  -- check default
            (
              select 'default ' ||
                substring(
                  pg_catalog.pg_get_expr(pd.adbin, pd.adrelid) for 128
                )
              from
                pg_catalog.pg_attrdef pd
              where
                pd.adrelid = pa.attrelid
                and pd.adnum = pa.attnum
                and pa.atthasdef
            )
            , ''
          ) as format
        from pg_catalog.pg_attribute pa
        inner join pg_catalog.pg_class pc
          on pa.attrelid = pc.oid
        inner join pg_catalog.pg_namespace pn
          on pn.oid = pc.relnamespace
        where
          pn.nspname = _schema_name
          and pc.relname = _table_name
          and pa.attnum > 0
        order by attnum
 loop

    --Create column part
		  res := res || rec.attname || ' ' || rec.format|| ',' || chr(10)  ;
      end loop;

      for rec in
        select
          concat(e'\t',pg_catalog.pg_get_constraintdef(pco.oid, true)) as ct_str
          , pg_catalog.pg_get_indexdef(pi.indexrelid, 0, true) as ci_str
        from pg_catalog.pg_class pc
        inner join pg_catalog.pg_namespace pn
          on pn.oid = pc.relnamespace
        inner join pg_catalog.pg_index pi
          on pc.oid = pi.indrelid
        inner join pg_catalog.pg_class pc2
          on pi.indexrelid = pc2.oid
        left join pg_catalog.pg_constraint pco
          on (
            pco.conrelid = pi.indrelid
            and pco.conindid = pi.indexrelid
            and pco.contype in ('p', 'u', 'x')
          )
        where
          pn.nspname = _schema_name
          and pc.relname = _table_name
        order by
          pi.indisprimary desc
          , pi.indisunique desc
          , pc.relname
      loop

    --Create index part
        if rec.ct_str is not null then

          --Definition in CREATE TABLE
          res := res || rec.ct_str || ',' || chr(10);
        else

          --CREATE TABLE External definition
          idx_str := idx_str || rec.ci_str || ';' || chr(10);
        end if;
      end loop;

      for rec in
        select
          pg_catalog.pg_get_constraintdef(pr.oid, true) as condef
        from pg_catalog.pg_constraint pr
        inner join pg_catalog.pg_class pc
          on pr.conrelid = pc.oid
        inner join pg_catalog.pg_namespace pn
          on pn.oid = pc.relnamespace
        where
          pn.nspname = _schema_name
          and pc.relname = _table_name
          and pr.contype = 'c'
      loop

        --Create check constraint part
        res := res || ',' || rec.condef || chr(10);
      end loop;
  comma_flg := false;
      for rec in
        select
          pg_catalog.pg_get_constraintdef(pr.oid, true) as condef
        from pg_catalog.pg_constraint pr
        inner join pg_catalog.pg_class pc
          on pr.conrelid = pc.oid
        inner join pg_catalog.pg_namespace pn
          on pn.oid = pc.relnamespace
        where
          pn.nspname = _schema_name
          and pc.relname = _table_name
          and pr.contype = 'f'
      loop

   if comma_flg then
          res := res || ','|| chr(10);
        else
          res := res || '';
        end if;
        comma_flg := true;

        --Creating a foreign key constraint part
        res := res || e'\t ' ||rec.condef || '' ;
      end loop;

      --Add index part
      res := res || chr(10) || ');' || chr(10) || idx_str || chr(10);

      --Create owner change part
      select
          'ALTER TABLE ' ||  pn.nspname || '.' || pc.relname || ' OWNER TO ' || pu.usename || ';' || chr(10)
          , pu.usename into owr_str, usename
      from
          pg_catalog.pg_class pc
          inner join pg_catalog.pg_namespace pn
              on pn.oid = pc.relnamespace
          inner join pg_catalog.pg_user pu
              on pc.relowner = pu.usesysid
      where
          pn.nspname = _schema_name
          and pc.relname = _table_name;
      res := res || owr_str;

      --Create comment part
      with check_data(_schema_name, _table_name) as (
        select
          _schema_name as _schema_name
          , _table_name as _table_name
      )
      , table_data(_schema_name, _table_name, table_comment, positon) as (
        select
          pn.nspname as _schema_name
          , pc.relname as _table_name
          , pg_catalog.obj_description(pc.oid) as table_comment
          , 0 as positon
        from
          pg_catalog.pg_class pc
          inner join pg_catalog.pg_namespace pn
            on pn.oid = pc.relnamespace
          inner join check_data cd
            on pn.nspname = cd._schema_name
            and pc.relname = cd._table_name
        where
          pg_catalog.obj_description(pc.oid) is not null
      )
      , column_data(
        _schema_name
        , _table_name
        , column_name
        , column_comment
        , positon
      ) as (
        select
          cd._schema_name
          , cd._table_name
          , pa.attname as column_name
          , pg_catalog.col_description(pc.oid, pa.attnum) as column_comment
          , pa.attnum as positon
        from
          pg_catalog.pg_attribute pa
          inner join pg_catalog.pg_class pc
            on pc.oid = pa.attrelid
          inner join pg_catalog.pg_namespace pn
            on pn.oid = pc.relnamespace
          inner join check_data cd
            on pn.nspname = cd._schema_name
            and pc.relname = cd._table_name
        where
          pa.attnum > 0
          and pg_catalog.col_description(pc.oid, pa.attnum) is not null
        order by
          pa.attnum
      )
      select
        array_to_string(
          array (
            select
              str
            from
              (
                select
                  'COMMENT ON TABLE ' || td._schema_name || '.' || td._table_name || ' IS ''' || td.table_comment || ''';' as str
                  , td.positon
                from
                  table_data td
                union
                select
                  'COMMENT ON COLUMN ' || cd._schema_name || '.' || cd._table_name || '.' || cd.column_name || ' IS ''' || cd.column_comment || ''';'
                   as str
                  , cd.positon
                from
                  column_data cd
              ) base
            order by
              positon
          )
          , chr(10)
        ) into com_str;
      res := res || com_str;
    end if;
    return res;
  end;
  $$  language plpgsql;

  select * from pg_temp.table_def(${oid}) as data;
  `;
  return sql;
}

const dbFuncTriggerContentByOid = (oid) => {
  let sql = `
      WITH trg AS (
        SELECT
        nspname,
        proname,
        pg_get_functiondef(p.oid) as def
        FROM  pg_proc p
        JOIN pg_namespace nsp on nsp.oid=p.pronamespace
        WHERE p.oid=${oid}
    )
    SELECT CONCAT(
    FORMAT(E'-- FUNCTION: %1$s.%2$s()\n\n-- DROP FUNCTION IF EXISTS %1$s.%2$s();\n\n',nspname,proname),
    def) AS data
    FROM trg
  `;
  // sql = `SELECT '-- NOTICE: Not implement yet!' as data`; // under test trial
  return sql;
}

const dbViewContentByOid = (oid) => {
  let sql = `WITH vw  AS (
    SELECT
        c.relname,
        n.nspname,
        CASE c.relkind WHEN 'v' THEN pg_catalog.pg_get_viewdef(c.oid, true) ELSE null END AS def
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON (n.oid = c.relnamespace)
    AND c.oid=${oid}
    )
    SELECT CONCAT(
    FORMAT(E'-- View: %1$s.%2$s \n\n-- DROP VIEW %1$s.%2$s;\n\n', nspname, relname),
    FORMAT(E'CREATE OR REPLACE VIEW %1$s.%2$s \n AS \n',nspname, relname),
    def) AS data
    FROM vw
  `;
  // sql = `SELECT '-- NOTICE: Not implement yet!' as data`; // under test trial
  return sql;
}

const dbFuncTableSearch = (search, type, view) => {
  let sql = "";
  let fields = "";
  let fieldFunc = "";
  let fieldTbl = "";
  let limit = "50";
  let where = ` value ILIKE '%${search}%' OR value ILIKE REPLACE('%${search}%', ' ', '_')`;

  if(search.includes(".")){
    let spl = search.split(".")
    where = `schema ILIKE '%${spl[0]}%' AND name ILIKE '%${spl.pop()}%'`;
  }

  if (type == "content") {
    fieldFunc = `,pg_get_functiondef((SELECT oid FROM pg_proc WHERE oid = prc.oid)) AS content_val, prc.proname AS content_name, isr.specific_schema AS content_schema, 'f'::text AS ttype `;
    fieldTbl = `,(SELECT string_agg(column_name,', ') FROM pg_namespace nsp
          JOIN pg_class tbl on nsp.oid = tbl.relnamespace
          JOIN information_schema.columns scm on scm.table_schema=nsp.nspname and scm.table_name=tbl.relname
        WHERE tbl.oid = c.relfilenode
      ) AS content_val, c.relname AS content_name, n.nspname AS content_schema, 't'::text AS ttype`;
  }

  if (type == "content") {
    where = ` content_val ILIKE '%${search}%'`;
  }

  if (type == "content") {
    fields = ` ,content_schema, content_name, ttype `;
  }

  if (type == "content") {
    limit = `200`;
  }

  let sqlFunc = `SELECT prc.oid || '_g' AS id, prc.proname || '(f:' || isr.specific_schema || ')' AS value, 'z_combo_item_f' AS css,
      prc.proname as name, isr.specific_schema as schema, 'Function' as type
      ${fieldFunc}
      FROM information_schema.routines isr
      LEFT JOIN pg_proc prc ON prc.oid = reverse(split_part(reverse(isr.specific_name), '_', 1))::int
      LEFT JOIN information_schema.parameters isp ON isp.specific_name = isr.specific_name
      WHERE isr.specific_schema NOT LIKE ALL (ARRAY['pg_%', 'log%', 'information_schema'])
      GROUP BY  prc.oid, prc.proname,isr.specific_schema`;

  let sqlTbl = `SELECT c.oid || '_u' AS id, relname || '(t:' || n.nspname || ')' as value, 'z_combo_item_t' AS css,
      relname as name, n.nspname as schema, 'Table' as type
      ${fieldTbl}
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r' AND nspname NOT LIKE ALL (ARRAY['pg_%', 'log%', 'information_schema'])`;

  if (view == "func") {
    sql = `SELECT id, value, css, name, schema, type ${fields} FROM (${sqlFunc}) t WHERE ${where} ORDER BY value LIMIT ${limit}`;
  } else if (view == "tbl") {
    sql = `SELECT id, value, css, name, schema, type ${fields} FROM (${sqlTbl}) t WHERE ${where} ORDER BY value LIMIT ${limit}`;
  } else {
    sql = `SELECT id, value, css, name, schema, type ${fields} FROM ((${sqlFunc}) UNION (${sqlTbl})) t WHERE ${where} ORDER BY value LIMIT ${limit}`;
  }
  return sql;
};

module.exports = {
  dbAll,
  dbSchemaAll,
  dbAllByOid,
  dbSchemaAllByOid,
  dbAllFunc,
  dbAllFuncBySchema,
  dbAllTableBySchema,
  dbFuncContentByOid,
  dbTableContentByOid,
  dbTableContentByOid2,
  dbFuncTableSearch,
  dbAllFuncTriggerBySchema,
  dbAllViewsBySchema,
  dbFuncTriggerContentByOid,
  dbViewContentByOid
};
