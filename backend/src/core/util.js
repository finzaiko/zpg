let sortBy = (p, a) => a.sort((i, j) => p.map(v => i[v] - j[v]).find(r => r))

const compareArrayAll = (a, b) => {
  function comparer(otherArray) {
    return function (current) {
      return (
        otherArray.filter(function (other) {
          return (
            // other.proname == current.proname &&
            // other.params_length == current.params_length &&
            other.z_content == current.z_content
          );
        }).length == 0
      );
    };
  }
  // const onlyInA = a.filter(comparer(b));
  // const onlyInB = b.filter(comparer(a));
  // result = onlyInA.concat(onlyInB);
  // result.map((v) => Object.assign(v, { diff: true }, { err: "params diff" }));

  // a.filter(comparer(b))
  //   .concat(b.filter(comparer(a)))
  //   .map((v) => Object.assign(v, { diff: true }, { err: "dif" }));

  // console.log('diff: ',a);

  // const m = result.filter((v, i, a) => {
  //   return a.findIndex((t) => t.id === v.id) === i;
  // });
  // console.log("merge: ", m);

  a.filter((e) => !b.find((a) => e.z_name == a.z_name && e.z_params_in == a.z_params_in)).map((v) => {
    return Object.assign(v, { diff: true }, { err: "trg" })

  });
    
  b.filter((e) => !a.find((b) => e.z_name == b.z_name && e.z_params_in == b.z_params_in)).map((v) =>
    Object.assign(v, { diff: true }, { err: "src" })
  );

  a.filter(comparer(b))
    .concat(b.filter(comparer(a)))
    .map((v) => Object.assign(v, { diff: true }, { err: "dif" }));


  let hasil = b.reduce(
    (acc, el2) => {
      // specific_schema: "master",
      // proname: "address_del",
      // type_udt_name: "void",
      // params_in: 2,

      if (a.findIndex((el1) => {
        return el1.z_schema === el2.z_schema 
          && el1.z_name === el2.z_name
          && el1.z_return === el2.z_return
          && el1.z_params_in === el2.z_params_in
      }) === -1) {
        acc.push(el2);
      }
      return acc;
    },
    [...a]
  ); 


  // hasil.map((vv)=>{
  //   console.log('vv.err', vv.err);
  //   console.log('vv.z_content', vv.z_content);
  //   if((vv.err!="src" && vv.err!="trg") && vv.z_content!=vv.z_content){
  //     // Object.assign(vv, { diff: true }, { err: "dif" })
  //     console.log('ada>>>>>>>>>>>>>')
  //   }
  // })
  // console.log('hasil', hasil[0])
  // console.log('hasil', hasil)
  // hasil.sort(function (a, b) {
  //   return a.specific_schema - b.specific_schema || a.proname - b.proname;
  // });
  
  // sortBy(['specific_schema', 'proname'], hasil)
  // sortBy(['proname'], hasil)

  // console.log("concat: ", array3);
  return hasil;
};

exports.compareArray = (x, y) => {
  // https://stackoverflow.com/a/14286864

  // const compareArr = require('./util.js');
  // compareArray(arrA, arrB);

  // If both x and y are null or undefined and exactly the same
  if (x === y) {
    return true;
  }

  // If they are not strictly equal, they both need to be Objects
  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  // They must have the exact same prototype chain, the closest we can do is
  // test the constructor.
  if (x.constructor !== y.constructor) {
    return false;
  }

  for (var p in x) {
    // Inherited properties were tested using x.constructor === y.constructor
    if (x.hasOwnProperty(p)) {
      // Allows comparing x[ p ] and y[ p ] when set to undefined
      if (!y.hasOwnProperty(p)) {
        return false;
      }

      // If they have the same strict value or identity then they are equal
      if (x[p] === y[p]) {
        continue;
      }

      // Numbers, Strings, Functions, Booleans must be strictly equal
      if (typeof x[p] !== "object") {
        return false;
      }

      // Objects and Arrays must be tested recursively
      if (!equals(x[p], y[p])) {
        return false;
      }
    }
  }

  for (p in y) {
    // allows x[ p ] to be set to undefined
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false;
    }
  }
  return true;
};



module.exports = compareArrayAll ;


// https://stackoverflow.com/questions/54090245/how-to-concat-two-arrays-and-remove-duplicates-in-javascript
// https://snippet.webix.com/q2s99ecn