const EDGE_COLOR = 'darkgrey';
const LOOP_Y_OFFSET = -33;

class Edge {
    // Edge constructor, requires start and edge vertices.
    constructor(id, v1, v2, isDirected, loopOffset, isParallel, parallelOffset) {
        this.id = id
        this.v1 = v1;
        this.v2 = v2;
        this.isDirected = isDirected;
        this.toggleModeMode = this.isDirected; // signals toggle to/from directed edge
        this.isLoop = (v1 == v2);
        this.loopOffset = loopOffset;
        this.isParallel = isParallel;
        this.parallelOffset = parallelOffset;

        let [x1, y1, x2, y2] = this.calcStraightPosition();
        if (this.isLoop) {
            // Draw loop from one vertex to iteslf for graphics
            let [x1, y1, x2, y2] = this.calcEdgePosition();
            this.line = new fabric.Ellipse({
                id: id,
                left: x1,
                top: y1 + LOOP_Y_OFFSET,
                originX: 'center',
                originY: 'center',
                rx: 20 + this.loopOffset, // horizontal raduis
                ry: 22 + this.loopOffset, // vertical radius
                fill: 'rgba(0,0,0,0)',
                stroke: EDGE_COLOR,
                strokeWidth: 2,
                hasControls: false,
                lockMovement: true,
                hoverCursor: "pointer"
            });
        } else {
            // Draw straight line from one vertex to another for graphics
            this.line = new fabric.Line([x1, y1, x2, y2], {
                id: id,
                originX: 'center',
                originY: 'center',
                stroke: EDGE_COLOR,
                strokeWidth: 2,
                hasControls: false,
                lockMovement: true,
                hoverCursor: "pointer"
            });
        }

        // Directed edge (arc) graphics:
        this.arrow = new fabric.Triangle({
            left: x1 + 27,
            top: y1,
            originX: 'center',
            originY: 'center',
            width: 13,
            height: 13,
            angle: -90,
            fill: EDGE_COLOR,
            selectable: false,
            hoverCursor: 'default',
            visible: this.isDirected
        });
    }

    // Updates the position of the edge graphics
    updatePosition() {
        let [x1, y1, x2, y2] = this.calcStraightPosition();
        if (this.isLoop) {
            let [x1, y1, x2, y2] = this.calcEdgePosition();
            this.line.set('left', x1);
            this.line.set('top', y1 + LOOP_Y_OFFSET);
        } else {
            this.line.set('x1', x1);
            this.line.set('y1', y1);
            this.line.set('x2', x2);
            this.line.set('y2', y2);
        }
        // TODO: Correct Arrow position/angel
        this.arrow.set('left', x1 + 21);
        this.arrow.set('top', y1);

        this.line.setCoords();
        this.arrow.setCoords();
    }

    // Updates arrow graphics.
    updateArrow() {
        this.arrow.set('visible', this.isDirected);
        this.updatePosition();
    }

    // Calculates the coordinates of the edge based on its adjacent vertices
    calcEdgePosition() {
        let v1Coords = this.v1.circle.calcOCoords();
        let v2Coords = this.v2.circle.calcOCoords();

        let x1 = (v1Coords.tl.x + v1Coords.tr.x) / 2;
        let y1 = (v1Coords.tl.y + v1Coords.bl.y) / 2;
        let x2 = (v2Coords.tl.x + v2Coords.tr.x) / 2;
        let y2 = (v2Coords.tl.y + v2Coords.bl.y) / 2;

        return [x1, y1, x2, y2];
    }

    // Calculates the edge position with offsets for parallel edges
    calcStraightPosition() {
        let [x1, y1, x2, y2] = this.calcEdgePosition();

        let slope = Math.abs(y2-y1) / (Math.abs(x2-x1) + 0.0001);
        // TODO: Correct parallel Line Math

        x1 += this.parallelOffset * 2;
        x2 += this.parallelOffset * 2;
        y1 += this.parallelOffset;
        y2 += this.parallelOffset;

        return [x1, y1, x2, y2]
    }

    // Toggles the direction of the edge: v1 to v2, v2 to v1, undirected
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

        this.updateArrow();
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
