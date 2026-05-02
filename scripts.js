import * as honeycomb from "https://esm.sh/honeycomb-grid@4.1.5";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import pickr from "https://cdn.jsdelivr.net/npm/@simonwep/pickr/+esm";

document.addEventListener("DOMContentLoaded", () => {
  // console.debug("✅ D3.js and Honeycomb loaded successfully as ES Modules.");

  // 1. Configure the grid
  const HexClass = honeycomb.defineHex({ dimensions: 30, orientation: "flat" });
  const grid = new honeycomb.Grid(HexClass, honeycomb.rectangle({ width: 30, height: 20 }));
  // console.debug(grid);

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
    .style("fill", "#000000")
    .style("stroke", "#aaaaaa")
    .style("stroke-width", "1.5px")
    .on("click", function (event, hex) {

      if (tool === 'eyedropper') {

        const currentFill = d3.select(this).style("fill");
        brushColor = currentFill;
        tool = 'brush';
        toggleButton('btn-eyedropper');
        
      } else {

        d3.select(this).style("fill", brushColor);
      }
      
      // console.debug(`Hex clicked: q=${hex.q}, r=${hex.r}`);
    });

  // console.debug(`Grid rendered. Use mouse wheel, click + drag, or pinch gestures to zoom and pan!`);

  // color button

  let brushColor = "#4CAF50";
  const btnColor = document.getElementById("btn-color");
  btnColor.style.color = brushColor;

  // pickr

  const colorPicker = pickr.create({
    el: '#btn-color',
    useAsButton: true,
    theme: 'nano', // or 'classic', or 'monolith'
    default: brushColor, // Default color

    swatches: [
      '#1b5d12', // dark green
      '#7dc745', // green
      '#aaee97', // light green
      '#1618b5', // dark blue
      '#2196F3', // blue
      '#63ddff', // light blue
      '#4a2c22', // dark brown
      '#794930', // brown
      '#af916c', // light brown
      '#444444', // dark gray
      '#888888', // gray
      '#cccccc', // light gray
      '#ca3a21', // red
      '#ffc800', // yellow
    ],

    components: {
      // Main components
      preview: false,
      opacity: false,
      hue: true,

      // Interaction features
      interaction: {
        hex: false,
        input: false,
        clear: false,
        save: false
      }
    }
  });

  // Example of how to use the selected color
  colorPicker.on('change', (color, instance) => {
    brushColor = color.toHEXA().toString();
    btnColor.style.color = brushColor;
    // console.debug('Selected color for painting:', brushColor);
    // You can now set a global variable like 'currentBrushColor' to this value
    // instance.hide();
  });

  // eyedropper

  let tool = 'brush';

  const btnEyedropper = document.getElementById('btn-eyedropper');
  btnEyedropper.addEventListener('click', (e) => {
    
    tool = 'eyedropper';
    toggleButton('btn-eyedropper');

  });

  // eraser

  // const btnEraser = document.getElementById('btn-eraser');
  // btnEraser.addEventListener('click', (e) => {
    
  //   brushColor = '#000000';
    
  // });

});

function toggleButton(buttonId) {

  const button = document.getElementById(buttonId);
  button.classList.toggle("btn-dark");
  button.classList.toggle("btn-secondary");
  button.classList.toggle("border-secondary");
  button.classList.toggle("border-light");
}