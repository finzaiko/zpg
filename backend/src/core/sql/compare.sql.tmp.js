/*
create table tbl_dif_a(
	id int,
	z_schema text,
	z_name text,
	z_return text,
	z_type text,
	z_tasktype int,
	z_params_in int,
	z_content int
)


select 
COALESCE(id_a,id_b) id,
id_a,
id_b,
COALESCE(schema_a,schema_b) z_schema,
COALESCE(z_name_a,z_name_b) z_name,
COALESCE(z_return_a,z_return_b) z_return,
COALESCE(z_params_in_a,z_params_in_b) z_params_in,
z_content_a,
z_content_b,
case 
	when id_a is null then 'src' 
	when id_b is null then 'trg'
	when id_a is not null and id_b is not null and z_content_a<>z_content_b then 'dif'
	else '' end as status
from (
	SELECT 
		a.id as id_a,
		b.id id_b,
		a.z_schema schema_a,
		b.z_schema schema_b,
		a.z_name z_name_a,
		b.z_name z_name_b,
		a.z_return z_return_a,
		b.z_return z_return_b,
		a.z_params_in z_params_in_a,
		b.z_params_in z_params_in_b,
		a.z_content z_content_a,
		b.z_content z_content_b
	FROM tbl_dif_a a LEFT JOIN tbl_dif_b b 
		ON a.z_schema=b.z_schema 
		AND a.z_name=b.z_name
		AND a.z_return=b.z_return
		AND a.z_params_in=b.z_params_in
		AND a.z_content=b.z_content
	UNION
	SELECT 
		a.id as id_a,
		b.id id_b,
		a.z_schema schema_a,
		b.z_schema schema_b,
		a.z_name z_name_a,
		b.z_name z_name_b,
		a.z_return z_return_a,
		b.z_return z_return_b,
		a.z_params_in z_params_in_a,
		b.z_params_in z_params_in_b,
		a.z_content z_content_a,
		b.z_content z_content_b
	FROM tbl_dif_a a RIGHT JOIN tbl_dif_b b 
		ON a.z_schema=b.z_schema 
		AND a.z_name=b.z_name
		AND a.z_return=b.z_return
		AND a.z_params_in=b.z_params_in
		AND a.z_content=b.z_content
	WHERE a.id IS NULL
) t




*/


/*

select 
COALESCE(id_a,id_b) id,
id_a,
id_b,
COALESCE(schema_a,schema_b) z_schema,
COALESCE(z_name_a,z_name_b) z_name,
COALESCE(z_return_a,z_return_b) z_return,
COALESCE(z_params_in_a,z_params_in_b) z_params_in,
z_content_a,
z_content_b,
case 
	when id_a is null then 'src' 
	when id_b is null then 'trg'
	when id_a is not null and id_b is not null and z_content_a<>z_content_b then 'dif'
	else '' end as status
from (
	SELECT 
		a.id as id_a,
		b.id id_b,
		a.z_schema schema_a,
		b.z_schema schema_b,
		a.z_name z_name_a,
		b.z_name z_name_b,
		a.z_return z_return_a,
		b.z_return z_return_b,
		a.z_params_in z_params_in_a,
		b.z_params_in z_params_in_b,
		a.z_content z_content_a,
		b.z_content z_content_b
	FROM tbl_dif_a a LEFT JOIN tbl_dif_b b 
		ON a.z_schema=b.z_schema 
		AND a.z_name=b.z_name
		AND a.z_return=b.z_return
		AND a.z_params_in=b.z_params_in
		AND a.z_content=b.z_content
	where a.z_name ilike '%address_del_test%'
	UNION
	SELECT 
		a.id as id_a,
		b.id id_b,
		a.z_schema schema_a,
		b.z_schema schema_b,
		a.z_name z_name_a,
		b.z_name z_name_b,
		a.z_return z_return_a,
		b.z_return z_return_b,
		a.z_params_in z_params_in_a,
		b.z_params_in z_params_in_b,
		a.z_content z_content_a,
		b.z_content z_content_b
	FROM tbl_dif_a a RIGHT JOIN tbl_dif_b b 
		ON a.z_schema=b.z_schema 
		AND a.z_name=b.z_name
		AND a.z_return=b.z_return
		AND a.z_params_in=b.z_params_in
		AND a.z_content=b.z_content
	
	WHERE a.id IS NULL
	and b.z_name  ilike '%address_del_test%'
) t



*/