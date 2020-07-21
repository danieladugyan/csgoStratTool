// DOM
let playerColor = "white";
let utilityType = "smoke";
let toolType = "pen";
let spawnElement = "player";

function testFunction() {
  //console.log(route.exportPoints()[0].x);
  testAnimation();
}

// color change
let swatchesDOM = document.querySelector(".swatches");
swatchesDOM.addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "BUTTON") {
    let current = swatchesDOM.querySelector(".active");
    current.className = current.className.replace(" active", "");
    e.target.className += " active";

    playerColor = e.target.classList[1];
  }
});

// activate (and "highlight") tool
let panelDOM = document.querySelector(".panel");
panelDOM.addEventListener("click", (e) => {
  if (e.target) {
    if (e.target.nodeName == "BUTTON") {
      let current = panelDOM.querySelector(".active");
      current.className = current.className.replace(" active", "");
      e.target.className += " active";
    }
    if (e.target.nodeName == "I") {
      let current = panelDOM.querySelector(".active");
      current.className = current.className.replace(" active", "");
      e.target.parentElement.className += " active";
    }
  }
});

// spawn entity
let entityDOM = document.querySelector("#entity");
entityDOM.addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "BUTTON") {
    spawnElement = "player";
  }
});

// spawn utility
let utilityDOM = document.querySelector("#utility");
utilityDOM.addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "BUTTON") {
    utilityType = e.target.id;
    spawnElement = "utility";
  }
});

// draw path
let pathDOM = document.querySelector("#path");
pathDOM.addEventListener("click", (e) => {
  if (e.target && (e.target.nodeName == "BUTTON" || e.target.nodeName == "I")) {
    // utilityType = e.target.classList[1];
    route = new Route();
    route.lineLayer = lineLayer;
    route.ptLayer = pointLayer;
    route.fillColor = playerColor;
    route.strokeColor = "black";
    route.pointOpacity = 0.2;
    route.pointRadius = 7;
    route.color = playerColor;

    spawnElement = "path";
  }
});

let domContainer = document.querySelector("#container");

function updateMap() {
  let overview = document.querySelector("#maps").value;
  domContainer.style.backgroundImage =
    'url("images/overviews/' + overview + '.png")';
}

// KONVA (drawing board canvas)
// first we need to create a stage
let stage = new Konva.Stage({
  container: "container", // id of container <div>
  width: 800,
  height: 800,
});

// then create layer
let layer = new Konva.Layer();

// add the layer to the stage
stage.add(layer);

let largeIcons = ["smoke", "molotov"];

stage.on("click", (e) => {
  let mouse = stage.getPointerPosition();
  let shape;
  let imageObj = new Image();

  switch (spawnElement) {
    case "player":
      shape = new Konva.Circle({
        x: mouse.x,
        y: mouse.y,
        radius: 5,
        fill: playerColor,
        stroke: "black",
        strokeWidth: 2,
      });
      break;
    case "utility":
      imageObj.src = "images/utility/" + utilityType + ".png";
      if (largeIcons.includes(utilityType)) {
        shape = new Konva.Image({
          image: imageObj,
          x: mouse.x - 24,
          y: mouse.y - 20,
          width: 47,
          height: 40,
        });
      } else {
        shape = new Konva.Image({
          image: imageObj,
          x: mouse.x - 14,
          y: mouse.y - 12,
          width: 28,
          height: 24,
        });
      }
      break;
    case "path":
      route.addPt(stage.getPointerPosition(), true);
      break;
    default:
      console.error("Error: Can't spawn unknown element");
  }

  shape.draggable("true");

  shape.on("mouseover", () => {
    document.querySelector("#container").style.cursor = "grab";
  });
  shape.on("mouseout", () => {
    document.querySelector("#container").style.cursor = "crosshair";
  });
  shape.on("dragstart", () => {
    document.querySelector("#container").style.cursor = "grabbing";
  });
  shape.on("dragend", () => {
    document.querySelector("#container").style.cursor = "grab";
  });

  // add the shape to the layer
  layer.add(shape);

  imageObj.onload = () => {
    layer.draw();
  };

  // draw the image
  layer.draw();
});

// draw the image
layer.draw();

updateMap(); // render the map on initial load
