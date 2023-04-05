async function getERViewer(request, reply) {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <script
        type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.3/TweenMax.min.js"
      ></script>
      <script
        type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.3/utils/Draggable.min.js"
      ></script>
      <script
        type="text/javascript"
        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/16327/ThrowPropsPlugin.min.js"
      ></script>
      <script
        type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.min.js"
      ></script>
    </head>
    <body>
      <div class="mermaid-panel" style="height: 1000px">
        <pre id="svg" class="mermaid" style="height: 1000px">
        ---
        title: Order example
        ---
        erDiagram
            CUSTOMER ||--o{ ORDER : places
            ORDER ||--|{ LINE-ITEM : contains
            CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
      </pre
        >
      </div>
      <script src="//d3js.org/d3.v6.min.js"></script>
      <script type="module">
        import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
        mermaid.initialize({ startOnLoad: true });
      </script>

      <script>
        window.addEventListener("load", function () {
          setTimeout(() => {
            document.querySelector("#svg svg").setAttribute("height", "1000px");
            let svgs = d3.selectAll(".mermaid svg");
            svgs.each(function () {
              let svg = d3.select(this);
              svg.html("<g>" + svg.html() + "</g>");
              let inner = svg.select("g");
              let zoom = d3.zoom().on("zoom", function (event) {
                inner.attr("transform", event.transform);
              });
              svg.call(zoom);
            });
          }, 2000);
        });
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
  fastify.get(`/erviewer`, getERViewer);
};
