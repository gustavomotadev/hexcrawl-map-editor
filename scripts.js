import * as honeycomb from "https://esm.sh/honeycomb-grid@4.1.5";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

document.addEventListener("DOMContentLoaded", () => {
  // console.debug("✅ D3.js and Honeycomb loaded successfully as ES Modules.");

  // 1. Configure the grid
  const HexClass = honeycomb.defineHex({ dimensions: 30, orientation: "flat" });
  const grid = new honeycomb.Grid(HexClass, honeycomb.rectangle({ width: 30, height: 20 }));

  const width = 500;
  const height = 500;

  // 2. Setup the SVG Canvas via D3
  const svg = d3.select("#app")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const mapGroup = svg.append("g")
    .attr("id", "map-group")
    .attr("transform", "translate(45, 45)"); // Starting offset

  // ==========================================
  // 3. DEFINE PAN AND ZOOM BEHAVIOR
  // ==========================================
  const zoom = d3.zoom()
    // Restricts how far out (0.25x) and how far in (4x) the user can zoom
    .scaleExtent([0.25, 4])
    // The zoom event updates the transform attribute of our #map-group
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  // Attach the zoom event handler to the top-level SVG
  svg.call(zoom);

  // ==========================================

  // 4. Render initial hexes
  mapGroup.selectAll("polygon.hex-tile")
    .data(Array.from(grid))
    .enter()
    .append("polygon")
    .attr("class", "hex-tile")
    .attr("points", (hex) => hex.corners.map(c => `${c.x},${c.y}`).join(" "))
    .style("fill", "#555555")
    .style("stroke", "#aaaaaa")
    .style("stroke-width", "1px")
    .on("click", function(event, hex) {
      const currentFill = d3.select(this).style("fill");
      const newFill = currentFill === "rgb(232, 245, 233)" ? "#81c784" : "#e8f5e9";
      d3.select(this).style("fill", newFill);
      console.log(`Hex clicked: q=${hex.q}, r=${hex.r}`);
    });

  // console.log(`Grid rendered. Use mouse wheel, click + drag, or pinch gestures to zoom and pan!`);
});