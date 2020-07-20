// --INPUTS--
let playerColor = "white";
let utilityType = "smoke"; // image file (.png)
let spawnElement = "player";

document.querySelector(".swatches").addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "BUTTON") {
    playerColor = e.target.classList[1];
    spawnElement = "player"; // stupid temporary test
  }
})

document.querySelector("#utility").addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "BUTTON") {
    utilityType = e.target.classList[1];
    spawnElement = "utility"; // stupid temporary test
  }
})

// --OUTPUTS--

// DOM
let domContainer = document.querySelector("#container");

function updateMap() {
  let overview = document.querySelector("#maps").value;
  domContainer.style.backgroundImage = 'url("images/overviews/' + overview + '.png")';
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
      shape = new Konva.Image({
        image: imageObj,
        x: mouse.x - 24,
        y: mouse.y - 20,
        width: 47,
        height: 40,
      });
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