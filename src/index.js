"use strict"
import {fabric} from 'fabric';
var MinHeap = require('mnemonist/heap').MinHeap;

const VERTEX_RADIUS = 15; // vertex fontSize
const LOOP_Y_OFFSET = -33; // y-offset for loops

const VERTEX_COLOR_1 = 'MediumAquaMarine';
const VERTEX_COLOR_2 = 'CornflowerBlue';
const VERTEX_COLOR_3 = 'Plum';
const VERTEX_COLOR_4 = 'LightSalmon';
const VERTEX_COLOR_5 = 'DimGrey';
const VERTEX_COLOR_6 = 'Khaki';

const EDGE_COLOR = 'darkgrey';
const ID_COLOR = '#333333';


(function() {
    window.addEventListener("load", init);

    var canvas; // Canvas to draw in.
    var inCanvas; // Mouse is in canvas.
    var mousePos; // Mouse position in canvas
    var graph; // the graph

    // Initialize function.
    function init() {
        // Set up Fabric.js canvas:
        canvas = new fabric.Canvas('canvas1');
        canvas.setWidth(window.innerWidth * 0.9);
        canvas.setHeight(window.innerHeight * 0.8);
        fabric.Group.prototype.hasControls = false;
        canvas.preserveObjectStacking = true;

        // Tracks mouse position in canvas:
        mousePos = { x: 0, y: 0 };
        document.addEventListener('mousemove', calcMousePos);

        // Tracks if mouse in canvas:
        inCanvas = false;
        let upperCanvas = document.getElementsByClassName("upper-canvas")[0];
        upperCanvas.addEventListener('mouseenter', function () { inCanvas = true; });
        upperCanvas.addEventListener('mouseleave', function () { inCanvas = false; });

        // Set up graph:
        graph = new Graph();
        updateUI();

        // Other Events:
        document.addEventListener('keydown', keyDownSwitch);
        canvas.on('object:moving', function () {
            updateEdges();
            updateVertexIDs();
        });
        canvas.on('object:moving', function () {
            updateEdges();
            updateVertexIDs();
        });
    }

    // Updates UI
    function updateUI(e) {
        let numVertices = graph.adjList.size;
        let numEdges = graph.edges.length;

        let vertexText = " vertices";
        let edgeText = " edges"
        if (numVertices == 1) {
            vertexText = " vertex";
        }
        if (numEdges == 1) {
            edgeText = " edge"
        }

        document.getElementById('vertices').innerText = numVertices + vertexText;
        document.getElementById('edges').innerText = numEdges + edgeText;
    }

    // Calls functions on key down event based on which key was pressed.
    function keyDownSwitch(e) {
        if (e.keyCode === 86) {
            addVertex(e); // v
        } else if (e.keyCode === 69) {
            addEdge(); // e
        } else if (e.keyCode === 46 || e.keyCode === 8 || e.keyCode === 68) {
            deleteSelected(); // Delete or backspace or d
        } else if (e.keyCode == 49 || e.keyCode == 97) {
            changeColor(VERTEX_COLOR_1); // 1 or numpad 1
        } else if (e.keyCode == 50 || e.keyCode == 98) {
            changeColor(VERTEX_COLOR_2); // 2 or numpad 2
        } else if (e.keyCode == 51 || e.keyCode == 99) {
            changeColor(VERTEX_COLOR_3); // 3 or numpad 3
        } else if (e.keyCode == 52 || e.keyCode == 100) {
            changeColor(VERTEX_COLOR_4); // 4 or numpad 4
        } else if (e.keyCode == 53 || e.keyCode == 101) {
            changeColor(VERTEX_COLOR_5); // 5 or numpad 5
        } else if (e.keyCode == 54 || e.keyCode == 102) {
            changeColor(VERTEX_COLOR_6); // 6 or numpad 6
        }
    }



    // Add a new vertex to graph at mouse position.
    function addVertex(e) {
        // If mouse in canvas and nothing selected:
        if (inCanvas && !canvas.getActiveObject()) {
            let posX = mousePos.x;
            let posY = mousePos.y;

            let vertex = graph.addVertex(posX, posY);
            canvas.add(vertex.circle);
            canvas.add(vertex.idText);
            canvas.bringToFront(vertex.idText);

            canvas.renderAll();
            updateUI();
        }
    }

    // Add a new edge to graph.
    function addEdge(e) {
        let active = canvas.getActiveObjects();
        let oneVertexActive = active.length == 1 && active[0].get('type') == 'circle';
        let twoVerticesActive = active.length == 2 && active[0].get('type') == 'circle' && active[0].get('type') == 'circle';

        if (oneVertexActive || twoVerticesActive) {
            let v1 = active[0].id;
            let v2 = active[0].id;
            if (twoVerticesActive) {
                v2 = active[1].id;
            }

            let edge = graph.addEdge(v1, v2);

            canvas.add(edge.line);
            canvas.sendToBack(edge.line);
            canvas.renderAll();
            updateUI();
        }
    }

    // Deletes all selected objects from graph and canvas.
    function deleteSelected(e) {
        // First delete edges:
        let active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'line' || object.get('type') == 'ellipse') {
                graph.deleteEdge(object.id); // delete edge
                canvas.remove(object); // remove from canvas
            }
        }

        // Second delete vertices:
        active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'circle') {
                canvas.remove(graph.getVertex(object.id).idText); // delete text from canvas
                let deleteEdgesList = graph.deleteVertex(object.id); // delete vertex
                deleteEdgesList.forEach(function (edge) {
                    canvas.remove(edge.line); // Delete appropriate edges from canvas
                });
                canvas.remove(object); // remove from canvas
            }
        }

        canvas.discardActiveObject(); // remove all selected in canvas
        canvas.renderAll();
        updateUI();
        graph.printGraph();
    }

    // changes the color of the selected vertices
    function changeColor(color) {
        let active = canvas.getActiveObjects();

        active.forEach(function(object) {
            if (object.get('type') == "circle") {
                object.set('fill', color);
            }
        });
        canvas.renderAll();
    }

    // Updates the graphics of all edges.
    function updateEdges() {
        for (var edge of graph.edges) {
            edge.updatePosition();
            canvas.renderAll();
        }
    }

    // Updates the graphics of all vertex ids.
    function updateVertexIDs() {
        for (var vertex of graph.adjList.keys()) {
            vertex.updateTextPosition();
            canvas.renderAll();
        }
    }

    // Calculates the mouse position in the canvas and updates mousePos.
    function calcMousePos(e) {
        let pointer = canvas.getPointer(e);
        mousePos.x = pointer.x;
        mousePos.y = pointer.y;
    }
})();


// Graph object, stored as an adjacency list.
class Graph {
    // Graph constructor.
    constructor() {
        this.adjList = new Map();
        this.edges = [];

        this.idIncrement = 0; // keeps track of next unique vertex id
        this.reclaimedIds = new MinHeap(); // keeps track of ids we can reuse from deleted vertices
        this.edgeIdIncrement = 0; // keeps track of next unique edge id
    }

    // Adds a new vertex to the graph.
    addVertex(x, y) {
        let vertex = new Vertex(this.getNewId(), x, y);
        this.adjList.set(vertex, []);
        this.printGraph();
        return vertex;
    }

    // Adds an undirected edge from v1 to v2.
    addEdge(v1, v2) {
        let vertex1 = this.getVertex(v1);
        let vertex2 = this.getVertex(v2);

        // offset for parallel edges:
        let parallelOffset = 0;
        if (this.adjList.get(vertex1).includes(vertex2)) {
            vertex1.parallels += 1;
            vertex2.parallels += 1;
            if (vertex1.parallels % 2 == 1) {
                parallelOffset = vertex1.parallels * 4;
            } else {
                parallelOffset = -(vertex1.parallels - 1) * 4;
            }
        }

        this.adjList.get(vertex1).push(vertex2);
        this.adjList.get(vertex2).push(vertex1);

        // offset for multiple loops graphics:
        let loopOffset = 0;
        if (vertex1 == vertex2) {
            vertex1.loops += 1;
            loopOffset = vertex1.loops * 5; // *SCALAR MUST BE ODD*
        }

        // get id for edge and add to edgeid lists
        let id = this.edgeIdIncrement;
        this.edgeIdIncrement += 1;
        vertex1.edgeIds.push(id);
        if (vertex1 != vertex2) {
            vertex2.edgeIds.push(id); // not loop, second vertex needs id
        }

        let edge = new Edge(id, vertex1, vertex2, loopOffset, parallelOffset);
        this.edges.push(edge);
        this.printGraph();
        return edge;
    }

    // Deletes vertex with id. Returns the list of edges to be deleted in the canvas.
    deleteVertex(id) {
        let vertex = this.getVertex(id);

        // Delete vertex from adjList entries of adjacent vertices
        let graph = this;
        let adjacentVertices = this.adjList.get(vertex);
        adjacentVertices.forEach(function (adjVertex) {
            let adjVertexAdjList = graph.adjList.get(adjVertex);
            adjVertexAdjList.forEach(function (adjAdjVert, index, object) {
                if (adjAdjVert == vertex) {
                    object.splice(index, 1); // remove from adjList
                }
            });
        });

        // Delete all adjacent edges
        let deleteEdgesList = [];
        vertex.edgeIds.forEach(function (edgeId) {
            let edge = graph.getEdge(edgeId);
            graph.removeByValue(graph.edges, edge); // remove from graph edges
            deleteEdgesList.push(edge); // to delete graphics
            // (don't have to worry about adjList)
        });

        this.adjList.delete(vertex); // delete this vertex's adjList entry
        this.reclaimedIds.push(vertex.id); // RECLAIM THIS ID
        // TODO: Shift IDs down?? Should I even reclaim IDs?
        return deleteEdgesList;
    }

    // Deletes edge and returns it.
    deleteEdge(id) {
        let edge = this.getEdge(id);

        this.removeByValue(edge.v1.edgeIds, edge.id); // remove from v1 id list
        if (!edge.isLoop) {
            this.removeByValue(edge.v2.edgeIds, edge.id); // remove from v2 id list
        }
        this.removeByValue(this.edges, edge); // remove from graph edges

        // TODO: Delete edge from adjList
        this.removeByValue(this.adjList.get(edge.v1), edge.v2);
        this.removeByValue(this.adjList.get(edge.v2), edge.v1);

        return edge;
    }

    // Returns the vertex with id. If none exists, creates a new vetex.
    getVertex(id) {
        for (let vertex of this.adjList.keys()) {
            if (vertex.id == id) {
                return vertex;
            }
        }
        return null; // vertex not found
    }

    // Returns the edge with id.
    getEdge(id) {
        let edge = null;
        this.edges.forEach(function (e) {
            if (e.id == id) {
                edge = e;
            }
        });
        return edge;
    }

    // returns the next available unique vertex id.
    getNewId() {
        if (this.reclaimedIds.size) {
            return this.reclaimedIds.pop();
        } else {
            return this.idIncrement++;
        }
    }

    // removes the first instance of value from array
    removeByValue(array, value) {
        array.splice(array.indexOf(value), 1);
    }

    // Prints the graph contents.
    printGraph() {
        // Print # vertices and edges:
        console.log("Graph has " + this.adjList.size + " vertices");
        console.log("Graph has " + this.edges.length + " edges");

        // Print adjacency matrix contents:
        for (let vertex of this.adjList.keys()) {
            let adjVertices = this.adjList.get(vertex);
            let adjVerts = "";
            for (let adjVertex of adjVertices) {
                adjVerts += adjVertex.id + ", ";
            }
            console.log(vertex.id + ": " + adjVerts); // print this vertex and its adjacent vertices
        }
        console.log("");
    }
}

// Vertex object, with id, and Fabric.js circle.
class Vertex {
    // Vertex constructor, requres id and x/y coordinates.
    constructor(id, x, y) {
        this.id = id;
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

        let [textX, textY] = this.calcTextCoords();
        this.idText = new fabric.Text(this.id + "", {
            left: textX,
            top: textY,
            fill: ID_COLOR,
            fontFamily: 'Calibri, sans-serif',
            fontSize: 15,
            selectable: false,
            hoverCursor: 'default'
        });
    }

    // Creates a new id text for the vertex.
    updateTextPosition() {
        let [x, y] = this.calcTextCoords();

        this.idText.set('left', x);
        this.idText.set('top', y);
    }

    // Calculates the coordinates of the vertex text.
    calcTextCoords() {
        let coords = this.circle.calcOCoords();
        let x = ((coords.tl.x + coords.tr.x) / 2) + 12;
        let y = ((coords.tl.y + coords.bl.y) / 2) + 10;
        return [x, y];
    }
}

class Edge {
    // Edge constructor, requires start and edge vertices.
    constructor(id, v1, v2, loopOffset, parallelOffset) {
        this.id = id
        this.v1 = v1;
        this.v2 = v2;
        this.isLoop = (v1 == v2);
        this.loopOffset = loopOffset;
        this.parallelOffset = parallelOffset;

        let [x1, y1, x2, y2] = this.calcEdgePosition();

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
            let [x1, y1, x2, y2] = this.calcStraightPosition();
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
    }

    // Updates the position of the edge graphics
    updatePosition() {
        if (this.isLoop) {
            let [x1, y1, x2, y2] = this.calcEdgePosition();
            this.line.set('left', x1);
            this.line.set('top', y1 + LOOP_Y_OFFSET);
        } else {
            let [x1, y1, x2, y2] = this.calcStraightPosition();
            this.line.set('x1', x1);
            this.line.set('y1', y1);
            this.line.set('x2', x2);
            this.line.set('y2', y2);
        }
        this.line.setCoords();
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
}
