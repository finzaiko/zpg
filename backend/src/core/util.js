let sortBy = (p, a) =>
  a.sort((i, j) => p.map((v) => i[v] - j[v]).find((r) => r));

const compareArrayAll = (a, b) => {
  function comparer(otherArray) {
    return function (current) {
      return (
        otherArray.filter(function (other) {
          return (
            other.z_content == current.z_content
          );
        }).length == 0
      );
    };
  }

  a.filter(
    (e) =>
      !b.find((a) => e.z_name == a.z_name && e.z_params_in == a.z_params_in)
  ).map((v) => {
    return Object.assign(v, { diff: true }, { err: "trg" });
  });

  b.filter(
    (e) =>
      !a.find((b) => e.z_name == b.z_name && e.z_params_in == b.z_params_in)
  ).map((v) => Object.assign(v, { diff: true }, { err: "src" }));

  a.filter(comparer(b))
    .concat(b.filter(comparer(a)))
    .map((v) => Object.assign(v, { diff: true }, { err: "dif" }));

  let hasil = b.reduce(
    (acc, el2) => {
      if (
        a.findIndex((el1) => {
          return (
            el1.z_schema === el2.z_schema &&
            el1.z_name === el2.z_name &&
            el1.z_return === el2.z_return &&
            el1.z_params_in === el2.z_params_in
          );
        }) === -1
      ) {
        acc.push(el2);
      }
      return acc;
    },
    [...a]
  );

  return hasil;
};

exports.compareArray = (x, y) => {
  if (x === y) {
    return true;
  }

  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  if (x.constructor !== y.constructor) {
    return false;
  }

  for (var p in x) {
    if (x.hasOwnProperty(p)) {
      if (!y.hasOwnProperty(p)) {
        return false;
      }

      if (x[p] === y[p]) {
        continue;
      }

      if (typeof x[p] !== "object") {
        return false;
      }

      if (!equals(x[p], y[p])) {
        return false;
      }
    }
  }

  for (p in y) {
    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
      return false;
    }
  }
  return true;
};

module.exports = compareArrayAll;
