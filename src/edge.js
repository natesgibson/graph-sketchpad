const EDGE_DEFAULT_COLOR = 'darkgrey';
const EDGE_SELECTED_COLOR = 'red';
const LOOP_Y_OFFSET = -33;

class Edge {
    // Edge constructor, requires start and edge vertices.
    constructor(id, v1, v2, isDirected, loopOffset, isParallel, parallelOffset) {
        this.v1 = v1;
        this.v2 = v2;
        this.isDirected = isDirected;
        this.toggleModeMode = this.isDirected; // signals toggle to/from directed edge
        this.isLoop = (v1 == v2);
        this.loopOffset = loopOffset;
        this.isParallel = isParallel;
        this.parallelOffset = parallelOffset;

        let [x1, y1, x2, y2] = this.calcEdgePosition();
        if (this.isLoop) {
            // Draw loop from one vertex to iteslf for graphics
            this.line = new fabric.Ellipse({
                id: id,
                left: x1,
                top: y1 + LOOP_Y_OFFSET,
                originX: 'center',
                originY: 'center',
                rx: 20 + this.loopOffset, // horizontal raduis
                ry: 22 + this.loopOffset, // vertical radius
                fill: 'rgba(0,0,0,0)',
                stroke: EDGE_DEFAULT_COLOR,
                strokeWidth: 2,
                hasControls: false,
                lockMovement: true,
                hoverCursor: "pointer",
                hasBorders: false
            });
        } else {
            this.line = new fabric.Line([x1, y1, x2, y2], {
                id: id,
                originX: 'center',
                originY: 'center',
                stroke: EDGE_DEFAULT_COLOR,
                strokeWidth: 2,
                hasControls: false,
                lockMovement: true,
                hoverCursor: "pointer",
                hasBorders: false
            });

            // Directed edge (arc) graphics:
            this.arrow = new fabric.Triangle({
                left: x1 + 27,
                top: y1,
                originX: 'center',
                originY: 'center',
                width: 13,
                height: 13,
                angle: -90,
                fill: EDGE_DEFAULT_COLOR,
                selectable: false,
                hoverCursor: 'default',
                visible: this.isDirected
            });
        }

        // Selection graphics update:
        let edge = this;
        this.line.on('selected', function () {
            this.set('stroke', EDGE_SELECTED_COLOR);
            if (!edge.isLoop) { edge.arrow.set('fill', EDGE_SELECTED_COLOR); }
        });
        this.line.on('deselected', function () {
            this.set('stroke', EDGE_DEFAULT_COLOR);
            if (!edge.isLoop) { edge.arrow.set('fill', EDGE_DEFAULT_COLOR); }
        });
    }

    // Updates the position of the edge graphics.
    updatePosition() {
        let [x1, y1, x2, y2] = this.calcEdgePosition();
        if (this.isLoop) {
            this.line.set('left', x1);
            this.line.set('top', y1 + LOOP_Y_OFFSET);
        } else {
            this.line.set('x1', x1);
            this.line.set('y1', y1);
            this.line.set('x2', x2);
            this.line.set('y2', y2);

            this.updateArrow(x1, y1, x2, y2);
        }

        this.line.setCoords();
    }

    // Calculates the coordinates of the edge based on its adjacent vertices.
    calcEdgePosition() {
        let v1Coords = this.v1.circle.calcOCoords();
        let v2Coords = this.v2.circle.calcOCoords();

        let x1 = (v1Coords.tl.x + v1Coords.tr.x) / 2;
        let y1 = (v1Coords.tl.y + v1Coords.bl.y) / 2;
        let x2 = (v2Coords.tl.x + v2Coords.tr.x) / 2;
        let y2 = (v2Coords.tl.y + v2Coords.bl.y) / 2;

        if (!this.isLoop) {
            [x1, y1, x2, y2] = this.addParallelOffset(x1, y1, x2, y2);
        }

        [x1, y1, x2, y2] = this.addGroupOffset(x1, y1, x2, y2);

        return [x1, y1, x2, y2];
    }

    // Adds parallel line offset to positions.
    addParallelOffset(x1, y1, x2, y2) {
        // TODO: Correct parallel Line Math

        let slope = (y2-y1) / (x2-x1);
        let invSlope = -(1 / slope);

        x1 += 1 * this.parallelOffset;
        x2 += 1 * this.parallelOffset;
        y1 += invSlope * this.parallelOffset;
        y2 += invSlope * this.parallelOffset;

        return [x1, y1, x2, y2];
    }

    // Adds group offset to positions.
    addGroupOffset(x1, y1, x2, y2) {
        if (!(this.line != null && this.line.group != null)) {
            if (this.v1.circle.group != null) {
                x1 = x1 + this.v1.circle.group.left + (this.v1.circle.group.width / 2);
                y1 = y1 + this.v1.circle.group.top + (this.v1.circle.group.height / 2);
            }
            if (this.v2.circle.group != null) {
                x2 = x2 + this.v2.circle.group.left + (this.v2.circle.group.width / 2);
                y2 = y2 + this.v2.circle.group.top + (this.v2.circle.group.height / 2);
            }
        } else if (this.line != null && this.line.group != null) {
            if (this.v1.circle.group == null) {
                x1 = x1 - this.line.group.left - (this.line.group.width / 2);
                y1 = y1 - this.line.group.top - (this.line.group.height / 2);
            }
            if (this.v2.circle.group == null) {
                x2 = x2 - this.line.group.left - (this.line.group.width / 2);
                y2 = y2 - this.line.group.top - (this.line.group.height / 2);
            }
        }
        return [x1, y1, x2, y2];
    }

    // Updates arrow graphics.
    updateArrow(x1, y1, x2, y2) {
        // visibility:
        this.arrow.set('visible', this.isDirected);

        // angle:
        let angle = this.calcArrowAngle(x1, y1, x2, y2);
        this.arrow.set('angle', angle);

        // position:
        let [x, y] = this.calcArrowPosition(x1, y1, angle)
        this.arrow.set('left', x);
        this.arrow.set('top', y);

        this.arrow.setCoords();
    }

    // Calculates the angle of the arrow.
    calcArrowAngle(x1, y1, x2, y2) {
        let x = x2 - x1;
        let y = y2 - y1;

        let angle = -(Math.atan(x / y) * 180) / Math.PI;
        if (y < 0) {
           angle += -180;
        }

        return(angle);
    }

    // Calculates the position of the arrow.
    calcArrowPosition(x1, y1, angle) {
        let h = 20; // hypotenuse = distance of arrow from center of vertex
        let angle1 = -(angle * Math.PI) / 180; // convert back to radians

        let o = h * Math.sin(angle1); // opposite = x offset
        let a = h * Math.cos(angle1); // adjacent = y offset

        let x = x1 + o;
        let y = y1 + a;

        return [x, y];
    }

    // Toggles the direction of the edge: v1 to v2, v2 to v1, undirected.
    toggleDirection() {
        let result = -1;
        if (!this.isDirected) {
            // toggle to: v1 to v2
            this.isDirected = true;
            this.toggleMode = true;
            result = 1;
        } else if (this.isDirected && this.toggleMode) {
            // toggle to: v2 to v1
            this.flipVertices();
            this.isDirected = true;
            this.toggleMode = false;
            result = 2;
        } else if (this.isDirected && !this.toggleMode) {
            // toggle to: undirected
            this.flipVertices();
            this.isDirected = false;
            this.toggleMode = false;
            result = 3;
        }

        this.updatePosition();
        return result;
    }

    // Swaps v1 and v2.
    flipVertices() {
        let vOne = this.v1;
        this.v1 = this.v2;
        this.v2 = vOne;
    }
}

module.exports = Edge;
