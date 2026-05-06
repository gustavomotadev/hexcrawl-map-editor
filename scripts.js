import * as honeycomb from "https://esm.sh/honeycomb-grid@4.1.5";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import pickr from "https://cdn.jsdelivr.net/npm/@simonwep/pickr/+esm";

const Tool = Object.freeze({
  BRUSH: "BRUSH",
  EYEDROPPER: "EYEDROPPER"
});

const AppState = {
  colorPicker: null,
  grid: null,
  mapGroup: null,
};

document.addEventListener("DOMContentLoaded", () => {

  AppState.grid = createGrid(30, 20, honeycomb.Orientation.FLAT);

  quickLoad();

  AppState.mapGroup = d3Setup();

  renderAllHexes();

  pickrSetup();

  localStorageSetup();

  toolTraySetup();

});

function createGrid(hexWidth, hexHeight, hexOrientation, hexDimension=30, hexFillColor="#000", hexStrokeColor="#aaa") {

  const HexClass = honeycomb.defineHex({ dimensions: hexDimension, orientation: hexOrientation });
  const grid = new honeycomb.Grid(HexClass, honeycomb.rectangle({ width: hexWidth, height: hexHeight }));

  grid.forEach(hex => {
    hex.fillColor = hexFillColor; // Set a default fill color
    // hex.strokeColor = hexStrokeColor; // Set a default stroke color
  });

  return grid
}

function d3Setup() {

  // These establish the internal coordinate system (the logical units) of your drawing
  // They don't represent actual screen pixels yet, but rather the "world size" of your map's design space
  const width = 500;
  const height = 500;

  // Setup the SVG Canvas via D3
  const svg = d3.select("#app") // select html element with app id
    .append("svg") // append an svg inside this element
    .attr("width", "100%") // svg will stretch and fill container
    .attr("height", "100%") // svg will stretch and fill container
    .attr("viewBox", `0 0 ${width} ${height}`) // If you changed the line to .attr("viewBox", "100 100 250 250"), you would effectively be zooming in. You are telling the browser: "Take the area starting at coordinate (100, 100) with a span of 250 units, and stretch that to fill the entire 100% screen
    .attr("preserveAspectRatio", "xMidYMid meet"); // Ensures that even if the browser window is stretched into a weird rectangle, your hexagons stay perfectly equilateral and centered (xMidYMid) rather than getting squashed

  const mapGroup = svg.append("g") // Creates a "Group" element. Think of this like a transparent folder or layer in Photoshop
    .attr("id", "map-group") // Gives it a name so you can easily find it later (useful for applying zoom or CSS filters)
    .attr("transform", "translate(45, 45)"); // Starting Offset. It moves the entire map M units to the right and N units down


  // DEFINE PAN AND ZOOM BEHAVIOR
  const zoom = d3.zoom()
    // Restricts how far out (0.25x) and how far in (4x) the user can zoom
    .scaleExtent([0.25, 4])
    // The zoom event updates the transform attribute of our #map-group
    .on("zoom", (event) => {mapGroup.attr("transform", event.transform);});

  // Attach the zoom event handler to the top-level SVG
  svg.call(zoom);

  return mapGroup;
}

function renderAllHexes() {

  // Render all hexes
  AppState.mapGroup.selectAll("polygon.hex-tile") // D3 looks inside your group (<g>) for any existing polygons with the class hex-tile. Even if there aren't any yet, this creates an "empty selection" that D3 will use as a template for what needs to be created
    .data(Array.from(AppState.grid)) // D3 "joins" your array of Hex objects to the selection above. It calculates: "I have 100 data points, but 0 polygons. Therefore, I need to create 100 new elements."
    .enter() // This targets the "placeholder" spots for all data points that don't have a matching polygon yet.
    .append("polygon") // For every single hex in your grid array, D3 creates a new <polygon> element in the DOM.
    .attr("class", "hex-tile")
    .attr("points", (hex) => hex.corners.map(c => `${c.x},${c.y}`).join(" ")) // This is how SVGs define polygons. It needs a string of coordinates like "x1,y1 x2,y2...". The Function: For each hex, D3 takes its corners (calculated by Honeycomb), grabs the x and y of each corner, and joins them into a long string that tells the browser exactly where to draw the six points of the hexagon.
    .style("fill", (hex) => hex.fillColor)
    .style("stroke", (hex) => "#aaa")
    .style("stroke-width", "1.5px")
    .on("click", hexClickHandler);
}

function setTool(tool) {
  localStorage.setItem('currentTool', tool);
}

function getTool() {
  return localStorage.getItem('currentTool');
}

function pickrSetup() {

  AppState.colorPicker = pickr.create({
    el: '#btn-color',
    useAsButton: true,
    theme: 'nano', // or 'classic', or 'monolith'
    default: getBrushColor(), // Default color

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

  AppState.colorPicker.on('change', (color, instance) => {
    setBrushColor(color.toHEXA().toString());
    // brushColor = color.toHEXA().toString();
    // btnColor.style.color = brushColor;
    // console.debug('Selected color for painting:', brushColor);
    // You can now set a global variable like 'currentBrushColor' to this value
    // instance.hide();
  });
}

function setBrushColor(color) {
  localStorage.setItem('brushColor', color);
  const btnColor = document.getElementById("btn-color");
  btnColor.style.color = color;
  AppState.colorPicker.setColor(color);
}

function getBrushColor() {
  return localStorage.getItem('brushColor');
}

function hexClickHandler(event, hex) {

  if (getTool() === Tool.EYEDROPPER) {

    // const currentFill = d3.select(this).style("fill");
    setBrushColor(hex.fillColor);
    setTool(Tool.BRUSH);
    toggleButton('btn-eyedropper');
    // colorPicker.setColor(brushColor);
    // btnColor.style.color = brushColor;

  } else {

    hex.fillColor = getBrushColor();
    d3.select(this).style("fill", getBrushColor());

    quickSave();
  }

  console.debug(`Hex clicked: q=${hex.q}, r=${hex.r}`);
}

function localStorageSetup() {

  if (!getBrushColor()) {
    setBrushColor("#4CAF50");
  } else {
    setBrushColor(getBrushColor());
  }

  if (!getTool()) {
    setTool(Tool.BRUSH);
  }
}

function toolTraySetup() {

  // eyedropper

  const btnEyedropper = document.getElementById('btn-eyedropper');
  btnEyedropper.addEventListener('click', (e) => {

    setTool(Tool.EYEDROPPER);
    toggleButton('btn-eyedropper');

  });

  // eraser

  // const btnEraser = document.getElementById('btn-eraser');
  // btnEraser.addEventListener('click', (e) => {

  //   brushColor = '#000000';

  // });
}

function toggleButton(buttonId) {

  const button = document.getElementById(buttonId);
  button.classList.toggle("btn-dark");
  button.classList.toggle("btn-secondary");
  button.classList.toggle("border-secondary");
  button.classList.toggle("border-light");
}

function compareColor(color1, color2) {

  const c1 = d3.color(color1);
  const c2 = d3.color(color2);
    
  // If the string is invalid, d3.color returns null
  if (!c1 || !c2) throw new Error("Invalid color comparison."); 
  
  // Check if all channels are equal
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
}

function quickSave() {

  const fullMapData = Array.from(AppState.grid).map(hex => ({ q: hex.q, r: hex.r, color: hex.fillColor }));

  const filteredMapData = fullMapData.filter((hex) => (!compareColor(hex.color, "#000")));

  const gridOrientation = Array.from(AppState.grid)[0].orientation;

  let saveData = { orientation: gridOrientation, palette: [], hexes: {} };

  filteredMapData.forEach(hex => {

    if (!saveData.palette.includes(hex.color)) {
      saveData.palette.push(hex.color);
    }

    saveData.hexes[`${hex.q},${hex.r}`] = saveData.palette.indexOf(hex.color);
  });

  const saveDataString = JSON.stringify(saveData);

  localStorage.setItem('quickSaveData', saveDataString);
}

function quickLoad() {

  const quickSaveJSON = localStorage.getItem('quickSaveData'); 

  if (!quickSaveJSON) {
    return false;
  }

  const quickSaveObject = JSON.parse(quickSaveJSON);

  const currentOrientation = Array.from(AppState.grid)[0].orientation;
  if (currentOrientation !== quickSaveObject.orientation) {
    return false;
  }

  for (const [qr, colorIndex] of Object.entries(quickSaveObject.hexes)) {

    const qrArray = qr.split(',');
    // console.debug(qrArray);
    const q = Number(qrArray[0]);
    const r = Number(qrArray[1]);
    const color = quickSaveObject.palette[colorIndex];

    // console.debug(q, r);
    const targetHex = AppState.grid.getHex([q, r]);

    // console.debug(color);
    targetHex.fillColor = color;
  }

  return true;
}