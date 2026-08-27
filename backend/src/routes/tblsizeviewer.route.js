async function getTblSizeViewer(request, reply) {
  const html = `
  <!DOCTYPE html>
<html>
  <head>
    <title>PostgreSQL Schema Size Distribution</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
  </head>
<body style="width: 100%; height: 100vh; margin: 0; padding: 0; overflow: hidden;">
  <div id="chart" style="width: 100%; height: 100vh;">
    <script>
      /*
      -- SELECT json_agg(t) FROM (
    SELECT
        schemaname as "name",
        SUM(pg_total_relation_size(schemaname||'.'||tablename)) as "value",
        jsonb_agg(jsonb_build_object(
            'name', tablename,
            'value', pg_total_relation_size(schemaname||'.'||tablename)
        )) as children
    FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'acc_drop','logdata','logdata2024','logdata2025')
    GROUP BY schemaname
    ORDER BY value DESC
-- )t

      */
      function formatSize(bytes) {
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 B";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2)+ " "+sizes[i];
      }
      const schemaData = {
        name: "Database",
        children: [
          {
            name: "test1",
            value: 3901431808,
            children: [
              {
                name: "test2",
                value: 122880,
              },
        ],
      };

      const chart = echarts.init(document.getElementById("chart"));

      const option = {
        tooltip: {
          formatter: function (info) {
            const value = info.value;
            const sizeInMB = (value / (1024 * 1024)).toFixed(2);
            return [
              '<div style="font-weight: bold;">'+info.name+'</div>Size: sizeInMB MB',
            ].join("");
          },
        },
        series: [
          {
            name: "Schemas",
            type: "treemap",
            visibleMin: 100,
            data: schemaData.children,
            roam: true, // Enable zooming
            nodeClick: "zoomToNode", // Zoom on click
            levels: [
              {
                itemStyle: {
                  borderWidth: 3,
                  borderColor: "#fff",
                  gapWidth: 3,
                },
              },
              {
                itemStyle: {
                  borderWidth: 1,
                  borderColor: "#fff",
                  gapWidth: 1,
                },
              },
            ],
            breadcrumb: {
              show: true,
              height: 30,
              bottom: 20,

              formatter: function (params) {
                const item = params[params.length - 1];
                console.log(params);
                return item.name +" "+ formatSize(item.value);
              },
            },
            /*
                breadcrumb: {
                    show: true,
                    height: 30,
                    top: 'bottom',
                    emptyItemWidth: 25,
                    textStyle: {
                        fontSize: 14
                    }
                },
                */
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: "bold",
              },
            },
            animationDurationUpdate: 500,
          },
        ],
      };

      // Add zoom controls
      chart.setOption(option);

      // Add double click to zoom out
      chart.on("dblclick", function () {
        chart.dispatchAction({
          type: "treemapRootToNode",
          targetNode: null,
        });
      });

      // Responsive resize
      window.addEventListener("resize", () => chart.resize());
    </script>
  </body>
</html>

  `;
  return (
    reply
      // .send({status:"Ok"});
      .header(`Content-Type`, `text/html`)
      .send(html)
  );
}

module.exports = async (fastify) => {
  fastify.get(`/tblsizeviewer`, getTblSizeViewer);
};
