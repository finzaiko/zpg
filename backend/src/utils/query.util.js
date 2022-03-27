const queryFilterSort = (filter, isLeadingAnd, sort) => { // isBefore if available where before this query
  const mode = 1; // 1=where query, 2. key value query
  let strKey = [],
    strVal = [],
    strWhere = [];
    if(filter){
        Object.keys(filter).map(function (k) {
          if (filter[k]) {
            if (mode == 1) {
              strWhere.push(
                ` ${k.toLocaleLowerCase()} LIKE '%${filter[k].toLocaleLowerCase()}%' `
              );
            } else {
              strKey.push(k);
              strVal.push(filter[k]);
            }
          }
        });
    }

  return mode == 1
    ? ` ${isLeadingAnd ? 'AND': ''}` + strWhere.join(" AND ")
    : { key: strKey.join(","), val: strVal.join(",") };
};

module.exports = queryFilterSort;
