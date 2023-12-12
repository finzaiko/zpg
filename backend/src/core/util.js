let sortBy = (p, a) =>
  a.sort((i, j) => p.map((v) => i[v] - j[v]).find((r) => r));

const compareArrayAll = (a, b) => {
  function comparer(otherArray) {
    return function (current) {
      return (
        otherArray.filter(function (other) {
          return other.compare_name == current.compare_name;
        }).length == 0
      );
    };
  }

  a.filter((e) => !b.find((a) => e.compare_name == a.compare_name)).map((v) => {
    return Object.assign(v, { diff: true }, { err: "trg" });
  });

  b.filter((e) => !a.find((b) => e.compare_name == b.compare_name)).map((v) =>
    Object.assign(v, { diff: true }, { err: "src" })
  );

  a.filter(comparer(b))
    .concat(b.filter(comparer(a)))
    .map((v) => Object.assign(v, { diff: true }, { err: "dif" }));

  let hasil = b.reduce(
    (acc, el2) => {
      if (
        a.findIndex((el1) => {
          return el1.compare_name === el2.compare_name;
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

module.exports = compareArrayAll;
