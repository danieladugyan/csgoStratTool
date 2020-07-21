// from https://stackoverflow.com/a/53103962 (modified slightly)

// Add a layer for line
var lineLayer = new Konva.Layer();
stage.add(lineLayer);

// Add a layer for drag points
var pointLayer = new Konva.Layer();
stage.add(pointLayer);

// Everything is ready so draw the canvas objects set up so far.
stage.draw();

// generic canvas end
// Class for the draggable point
// Params: route = the parent object, opts = position info, doPush = should we just make it or make it AND store it
class DragPoint {
  constructor(route, opts, doPush) {
    var route = route;

    this.x = opts.x;
    this.y = opts.y;
    this.fixed = opts.fixed;
    this.id = randId(); // random id.

    if (doPush) {
      // in some cases we want to create the pt then insert it in the run of the array and not always at the end
      route.pts.push(this);
    }

    // random id generator
    function randId() {
      return Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(2, 10);
    }

    // mark the pt as fixed - important state, shown by filled point
    this.makeFixed = function () {
      this.fixed = true;
      stage.find("#" + this.id).fill(route.fillColor);
    };

    this.kill = function () {
      stage.find("#" + this.id).remove();
    };

    this.draw = function () {
      // Add point & pt

      var pt = new Konva.Circle({
        id: this.id,
        x: this.x,
        y: this.y,
        radius: route.pointRadius,
        opacity: route.pointOpacity,
        strokeWidth: 2,
        stroke: route.strokeColor,
        fill: "transparent",
        draggable: "true",
      });
      pt.on("dragstart", function () {
        route.drawState = "dragging";
      });
      pt.on("dragmove", function () {
        var pos = this.getPosition();
        route.updatePt(this.id(), pos);
        route.calc(this.id());
        route.draw();
      });
      pt.on("dragend", function () {
        route.drawState = "drawing";
        var pos = this.getPosition();

        route.updatePt(this.getId(), pos);

        route.splitPts(this.getId());

        route.draw();
      });

      if (this.fixed) {
        this.makeFixed();
      }

      route.ptLayer.add(pt);
      route.draw();
    };
  }
}

class Route {
  constructor() {
    this.lineLayer = null;
    this.ptLayer = null;
    this.drawState = "";

    this.fillColor = "Gold";
    this.strokeColor = "Gold";
    this.pointOpacity = 0.5;
    this.pointRadius = 10;
    this.color = "LimeGreen";
    this.width = 3;

    this.pts = []; // array of dragging points.

    this.startPt = null;
    this.endPt = null;

    // reset the points
    this.reset = function () {
      for (var i = 0; i < this.pts.length; i = i + 1) {
        this.pts[i].kill();
      }
      this.pts.length = 0;
      this.draw();
    };

    // Add a point to the route.
    this.addPt = function (pos, isFixed) {
      if (this.drawState === "dragging") {
        // do not add a new point because we were just dragging another
        return null;
      }

      this.startPt = this.startPt || pos;
      this.endPt = pos;

      // create this new pt
      var pt = new DragPoint(
        this,
        { x: this.endPt.x, y: this.endPt.y, fixed: isFixed },
        true,
        "A"
      );
      pt.draw();
      pt.makeFixed(); // always fixed for manual points

      // if first point ignore the splitter process
      if (this.pts.length > 0) {
        this.splitPts(pt.id, true);
      }

      this.startPt = this.endPt; // remember the last point

      this.calc(); // calculate the line points from the array
      this.draw(); // draw the line
    };

    // Position the points.
    this.calc = function (draggingId) {
      draggingId = typeof draggingId === "undefined" ? "---" : draggingId; // when dragging an unfilled point we have to override its automatic positioning.

      for (var i = 1; i < this.pts.length - 1; i = i + 1) {
        var d2 = this.pts[i];
        if (!d2.fixed && d2.id !== draggingId) {
          // points that have been split are fixed, points that have not been split are repositioned mid way along their line segment.
          var d1 = this.pts[i - 1];
          var d3 = this.pts[i + 1];
          var pos = this.getHalfwayPt(d1, d3);

          d2.x = pos.x;
          d2.y = pos.y;
        }
        stage.find("#" + d2.id).position({ x: d2.x, y: d2.y }); // tell the shape where to go
      }
    };

    // draw the line
    this.draw = function () {
      if (this.drawingLine) {
        this.drawingLine.remove();
      }
      this.drawingLine = this.newLine(); // initial line point

      for (var i = 0; i < this.pts.length; i = i + 1) {
        this.drawingLine.points(
          this.drawingLine.points().concat([this.pts[i].x, this.pts[i].y])
        );
      }

      this.ptLayer.draw();
      this.lineLayer.draw();
    };

    // When dragging we need to update the position of the point
    this.updatePt = function (id, pos) {
      for (var i = 0; i < this.pts.length; i = i + 1) {
        if (this.pts[i].id === id) {
          this.pts[i].x = pos.x;
          this.pts[i].y = pos.y;

          break;
        }
      }
    };

    // Function to add and return a line object. We will extend this line to give the appearance of drawing.
    this.newLine = function () {
      var line = new Konva.Line({
        stroke: this.color,
        strokeWidth: this.width,
        lineCap: "round",
        lineJoin: "round",
        tension: 0.1,
      });

      this.lineLayer.add(line);
      return line;
    };

    // make pts either side of the split
    this.splitPts = function (id, force) {
      var idx = -1;

      // find the pt in the array
      for (var i = 0; i < this.pts.length; i = i + 1) {
        if (this.pts[i].id === id) {
          idx = i;

          if (this.pts[i].fixed && !force) {
            return null; // we only split once.
          }

          //break;
        }
      }

      // If idx is -1 we did not find the pt id !
      if (idx === -1) {
        return null;
      } else if (idx === 0) {
        return null;
      } else {
        // pt not = 0 or max
        // We are now going to insert a new pt either side of the one we just dragged
        var d1 = this.pts[idx - 1]; // previous pt to the dragged pt
        var d2 = this.pts[idx]; // the pt pt
        var d3 = this.pts[idx + 1]; // the next pt after the dragged pt

        d2.makeFixed(); // flag this pt as no longer splittable

        // get point midway from prev pt and dragged pt
        var pos = this.getHalfwayPt(d1, d2);
        var pt = new DragPoint(
          this,
          { x: pos.x, y: pos.y, foxed: false },
          false,
          "C"
        );
        pt.draw();
        this.pts.splice(idx, 0, pt);

        if (d3) {
          // get point midway from dragged pt to next
          pos = this.getHalfwayPt(d2, d3);
          var pt = new DragPoint(
            this,
            { x: pos.x, y: pos.y, foxed: false },
            false,
            "D"
          );
          pt.draw();
          this.pts.splice(idx + 2, 0, pt); // note idx + 2 !
        }
      }
    };

    // convert last point array entry to handy x,y object.
    this.getPoint = function (pts) {
      return { x: pts[pts.length - 2], y: pts[pts.length - 1] };
    };

    this.getHalfwayPt = function (d1, d2) {
      var pos = {
        x: d1.x + (d2.x - d1.x) / 2,
        y: d1.y + (d2.y - d1.y) / 2,
      };
      return pos;
    };

    this.exportPoints = function () {
      var list = [],
        pt;
      //console.log("pts=" + this.pts.length);
      for (var i = 0; i < this.pts.length; i = i + 1) {
        pt = this.pts[i];
        if (pt.fixed) {
          //console.log("push " + i);
          list.push({ x: pt.x, y: pt.y });
        }
      }
      return list;
    };
  }
}

// path animation

function testAnimation() {
  let path = new Konva.Path({
    x: 0,
    y: 0,
    strokeWidth: 0,
  });
  lineLayer.add(path);

  let data = route.exportPoints();

  let p = "M" + data[0].x + " " + data[0].y;
  for (let i = 1; i < data.length; i++) {
    p = p + " L" + data[i].x + " " + data[i].y;
  }
  path.setData(p);

  let animatedCircle = layer.find("Circle")[0];

  // Now animate a circle along the path
  var steps = 1000; // number of steps in animation
  var pathLen = path.getLength();
  var step = pathLen / steps;
  var frameCnt = 0, pos = 0, pt;

  anim = new Konva.Animation(function (frame) {
    pos = pos + 1;
    pt = path.getPointAtLength(pos * step);
    animatedCircle.position({ x: pt.x, y: pt.y });
  }, layer);

  anim.start();
}
