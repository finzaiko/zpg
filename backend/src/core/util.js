let sortBy = (p, a) =>
  a.sort((i, j) => p.map((v) => i[v] - j[v]).find((r) => r));

const compareArrayAll = (a, b) => {
  function comparer(otherArray) {
    return function (current) {
      return (
        otherArray.filter(function (other) {
          return other.z_content == current.z_content;
        }).length == 0
      );
    };
  }

  a.filter((e) => !b.find((a) => e.compare_name == a.compare_name)).map((v) => {
    return Object.assign(v, { diff: true }, { err: "trg" });
  });

  b.filter((e) => !a.find((b) => e.compare_name == b.compare_name)).map((v) => {
    return Object.assign(v, { diff: true }, { err: "src" });
  });

  a.filter(comparer(b))
    .concat(b.filter(comparer(a)))
    .map((v) => Object.assign(v, { diff: true }, { err: "dif" }));

  let hasil = b.reduce(
    (acc, el2) => {
      if (
        a.findIndex((el1) => {
          // return el1.compare_name === el2.compare_name;
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

const compareArraySchemaV1 = (sourceData, targetData) => {
  let aaFilter1 = [];
  arr1.forEach((element) => {
    let bb = arr2.find((a) => a.compare_name == element.compare_name);
    if (typeof bb == "undefined") {
      // console.log("UNDEFINED-1---!!!");

      const cc = Object.assign(
        element,
        { diff: true },
        { err: "trg" },
        { src_id: element.id },
        { trg_id: null }
      );
      aaFilter1.push(cc);
    } else {
      // console.log("OK-1---!!!");
      let mm = arr2.find((a) => a.compare_name == element.compare_name);
      if (mm.z_content != element.z_content) {
        const cc = Object.assign(
          element,
          { diff: true },
          { err: "dif" },
          { src_id: element.id },
          { trg_id: bb.id }
        );
        aaFilter1.push(cc);
      } else {
        const cc2 = Object.assign(
          element,
          { src_id: element.id },
          { trg_id: bb.id }
        );
        aaFilter1.push(cc2);
      }
    }
  });

  let aaFilter2 = [];
  arr2.forEach((element) => {
    let bb = arr1.find((a) => a.compare_name == element.compare_name);
    if (typeof bb == "undefined") {
      // console.log("UNDEFINED-2---!!!");
      const cc = Object.assign(
        element,
        { diff: true },
        { err: "src" },
        { trg_id: element.id },
        { src_id: null }
      );
      aaFilter2.push(cc);
    } else {
      // console.log("OK-2---!!!");
      let mm = arr1.find((a) => a.compare_name == element.compare_name);
      if (mm.z_content != element.z_content) {
        const cc = Object.assign(
          element,
          { diff: true },
          { err: "dif" },
          { trg_id: element.id },
          { src_id: bb.id }
        );
        aaFilter2.push(cc);
      } else {
        const cc2 = Object.assign(
          element,
          { trg_id: element.id },
          { src_id: bb.id }
        );
        aaFilter2.push(cc2);
      }
    }
  });

  const finalArr = aaFilter1.concat(aaFilter2);

  let mergedif = new Map();
  for (const o of finalArr) {
    mergedif.set(o.compare_name, o);
  }
  let data = [...mergedif.values()];
  return data;
};

const compareArraySchemaV2 = (sourceData, targetData) => {
  let result = [];

  // Create maps for faster lookup
  const targetMap = new Map(
    targetData.map((item) => [`${item.z_schema}_${item.z_name}`, item])
  );
  const processedPairs = new Set();

  // First, process source data
  sourceData.forEach((src) => {
    const key = `${src.z_schema}_${src.z_name}`;
    const target = targetMap.get(key);

    if (target) {
      // Found matching schema and name
      processedPairs.add(key);

      let compareResult = {
        id: `${src.id}__${target.id}`,
        z_schema: src.z_schema,
        z_name: src.z_name,
        z_return: src.z_return,
        z_type: src.z_type,
        z_params_in: parseInt(src.z_params_in),
        z_params_out: parseInt(src.z_params_out),
        z_content: "",
        params_in_type: "",
        params_out_type: "",
        diff: true,
        err: "",
        src_id: parseInt(src.id),
        trg_id: parseInt(target.id),
      };

      // Check if all values match
      if (
        src.z_schema === target.z_schema &&
        src.z_name === target.z_name &&
        src.z_return === target.z_return &&
        src.z_params_in === target.z_params_in &&
        src.z_content === target.z_content
      ) {
        compareResult.err = "";
        compareResult.diff = false; // Set diff to false when no error
      }
      // Check if content is different
      else if (
        src.z_schema === target.z_schema &&
        src.z_name === target.z_name &&
        src.z_content !== target.z_content
      ) {
        compareResult.err = "dif";
      }
      // Check if params_in is different
      else if (
        src.z_schema === target.z_schema &&
        src.z_name === target.z_name &&
        src.z_params_in !== target.z_params_in
      ) {
        compareResult.err = "src";
      }

      result.push(compareResult);
    } else {
      // No matching target found
      result.push({
        id: src.id,
        z_schema: src.z_schema,
        z_name: src.z_name,
        z_return: src.z_return,
        z_type: src.z_type,
        z_params_in: parseInt(src.z_params_in),
        z_params_out: parseInt(src.z_params_out),
        z_content: "",
        params_in_type: "",
        params_out_type: "",
        diff: true,
        err: "trg",
        src_id: parseInt(src.id),
        trg_id: null,
      });
    }
  });

  // Process remaining unmatched target items
  targetData.forEach((trg) => {
    const key = `${trg.z_schema}_${trg.z_name}`;
    if (!processedPairs.has(key)) {
      result.push({
        id: trg.id,
        z_schema: trg.z_schema,
        z_name: trg.z_name,
        z_return: trg.z_return,
        z_type: trg.z_type,
        z_params_in: parseInt(trg.z_params_in),
        z_params_out: parseInt(trg.z_params_out),
        z_content: "",
        params_in_type: "",
        params_out_type: "",
        diff: true,
        err: "src",
        src_id: null,
        trg_id: parseInt(trg.id),
      });
    }
  });

  return result;
};

module.exports = {
  compareArrayAll,
  compareArraySchemaV1,
  compareArraySchemaV2,
};
