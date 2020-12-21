const VERTEX_RADIUS = 15;
const ID_COLOR = '#333333';
const TEXT_FONT = 'Sans-Serif';

class Vertex {
    // Vertex constructor, requres id and x/y coordinates.
    constructor(id, x, y) {
        this.degree = 0;
        this.loops = 0;
        this.parallels = 0;
        this.edgeIds = []; // ids of adjacent edges

        this.circle = new fabric.Circle({
            id: id,
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            fill: 'MediumAquaMarine',
            stroke: 'slategrey',
            strokeWidth: 0.15,
            radius: VERTEX_RADIUS,
            hasControls: false,
        });

        let [textX, textY] = this.calcTextPosition();
        this.idText = new fabric.Text(this.circle.id + "", {
            left: textX - 18,
            top: textY + 20,
            originX: 'center',
            originY: 'center',
            fill: ID_COLOR,
            fontFamily: TEXT_FONT,
            fontSize: 15,
            selectable: false,
            hoverCursor: 'default'
        });
        this.degText = new fabric.Text('deg ' + this.degree, {
            left: textX + 28,
            top: textY + 18,
            originX: 'center',
            originY: 'center',
            fill: ID_COLOR,
            fontFamily: TEXT_FONT,
            fontSize: 15,
            selectable: false,
            hoverCursor: 'default'
        });
    }

    // Updates vertex's text postion.
    updateTextPosition() {
        let [x, y] = this.calcTextPosition();

        this.idText.set('left', x - 18);
        this.idText.set('top', y + 18);

        this.degText.set('left', x + 28);
        this.degText.set('top', y + 18);
    }

    // Calculates the coordinates of the vertex's text.
    calcTextPosition() {
        let coords = this.circle.calcOCoords();
        let x = ((coords.tl.x + coords.tr.x) / 2);
        let y = ((coords.tl.y + coords.bl.y) / 2);
        return [x, y];
    }

    // Update value of deg text
    updateDegText() {
        this.degText.set('text', 'deg ' + this.degree);
    }

    // Update the value of id text
    updateIdText() {
        this.idText.set('text', this.circle.id + '');
    }
}

module.exports = Vertex;
