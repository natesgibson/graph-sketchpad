/*
TODO:
- Fix group movement postion stuff
- Different selection (color red?)
- Help ui (?) for controls and such
- Directed edges
- Host on website
- UI info toggles
- More Features!
*/


"use strict"
import {fabric} from 'fabric';

const VERTEX_RADIUS = 15; // vertex fontSize
const LOOP_Y_OFFSET = -33; // y-offset for loops

const VERTEX_COLOR_1 = 'MediumAquaMarine';
const VERTEX_COLOR_2 = 'CornflowerBlue';
const VERTEX_COLOR_3 = 'Plum';
const VERTEX_COLOR_4 = 'DimGrey';
const VERTEX_COLOR_5 = 'Khaki';
const VERTEX_COLOR_6 = 'LightSalmon';

const EDGE_COLOR = 'darkgrey';
const ID_COLOR = '#333333';
const TEXT_FONT = 'Sans-Serif';


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
        canvas.setWidth(window.innerWidth * 0.85);
        canvas.setHeight(window.innerHeight * 0.65);
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
        let lapMatBtn = document.getElementById('lapMatBtn');
        lapMatBtn.addEventListener("click", printLapMatrix);
        canvas.on('object:moving', function() {
            updateEdges();
            updateVertexIDs();
        });
    }

    // Updates UI
    function updateUI(e) {
        let numVertices = graph.adjList.size;
        let numEdges = graph.edges.length;
        let numComponents = graph.getNumComponents();
        let isBipartite = graph.getIsBipartite();

        let vertexText = ' vertices';
        let edgeText = ' edges';
        let componentsText = ' components';
        let bipartiteText = 'is bipartite: ';
        if (numVertices == 1) {
            vertexText = ' vertex';
        }
        if (numEdges == 1) {
            edgeText = ' edge';
        }
        if (numComponents == 1) {
            componentsText = ' component'
        }

        document.getElementById('vertices').innerText = numVertices + vertexText;
        document.getElementById('edges').innerText = numEdges + edgeText;
        document.getElementById('components').innerText = numComponents + componentsText;
        document.getElementById('bipartite').innerText = bipartiteText + isBipartite;
    }

    // Calls functions on key down event based on which key was pressed.
    function keyDownSwitch(e) {
        if (e.keyCode === 86) {
            addVertex(e); // v
        } else if (e.keyCode === 69) {
            addEdge(); // e
        } else if (e.keyCode === 46 || e.keyCode === 8) {
            deleteSelected(); // Delete or backspace
        } else if (e.keyCode === 68) {
            toggleDirection();
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
            canvas.add(vertex.degText);
            // Note: Order matters!
            canvas.bringToFront(vertex.idText);
            canvas.bringToFront(vertex.degText);

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
            canvas.add(edge.arrow);
            canvas.bringToFront(edge.arrow);

            canvas.renderAll();
            updateUI();
        }
    }

    // Deletes all selected objects from graph and canvas.
    function deleteSelected(e) {
        // First, delete edges:
        let active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'line' || object.get('type') == 'ellipse') {
                canvas.remove(graph.getEdge(object.id).arrow); // remove arrow from canvas
                graph.deleteEdge(object.id); // delete edge
                canvas.remove(object); // remove line from canvas
            }
        }

        // Second, delete vertices:
        active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'circle') {
                let vertex = graph.getVertex(object.id);
                canvas.remove(vertex.idText); // delete id text from canvas
                canvas.remove(vertex.degText); // delete deg text from canvas
                let deleteEdgesList = graph.deleteVertex(object.id); // delete vertex
                deleteEdgesList.forEach(function (edge) {
                    if (edge != null) {
                        canvas.remove(edge.line); // Delete appropriate edges from canvas
                    }
                });
                canvas.remove(object); // remove from canvas
            }
        }

        canvas.discardActiveObject(); // remove all selected in canvas
        canvas.renderAll();
        graph.printGraph();
        updateUI();
    }

    // toggles the direction of the selected edge: v1 to v2, v2 to v1, undirected
    function toggleDirection() {
        let active = canvas.getActiveObjects();
        // Note, only checks for line, cannot effect loops
        if (active.length == 1 && active[0].get('type') == 'line') {
            graph.toggleDirection(active[0].id);
        }
        canvas.renderAll();
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

    // Updates the graphics of all vertex id texts.
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

    // Prints the Laplacian matrix (WolframAlpha comaptable)
    function printLapMatrix() {
        let lapMatDisplay = document.getElementById('lapMat');
        let lapMatText = '{';
        let lapMatrix = graph.getlapMatrix();
        for (let i = 0; i < lapMatrix.length; i++) {
            let row = lapMatrix[i];
            let rowText = '{';
            for (let j = 0; j < row.length; j++) {
                rowText += row[j] + ', ';
            }
            rowText = rowText.slice(0, -2);
            rowText += '},';
            lapMatText += rowText;
        }

        if (lapMatrix.length > 0) { lapMatText = lapMatText.slice(0, -1); }
        lapMatText += '}';
        lapMatDisplay.innerText = lapMatText;
    }
})();


// Graph object, stored as an adjacency list.
class Graph {
    // Graph constructor.
    constructor() {
        this.adjList = new Map();
        this.edges = [];

        this.idIncrement = 0; // keeps track of next unique vertex id
        this.edgeIdIncrement = 0; // keeps track of next unique edge id
    }

    // Adds a new vertex to the graph.
    addVertex(x, y) {
        let vertex = new Vertex(this.idIncrement++, x, y);
        this.adjList.set(vertex, []);
        this.printGraph();
        return vertex;
    }

    // Adds an undirected edge from v1 to v2.
    addEdge(v1, v2) {
        let vertex1 = this.getVertex(v1);
        let vertex2 = this.getVertex(v2);

        // offset for parallel edges:
        let isParallel = false;
        let parallelOffset = 0;
        if (vertex1 != vertex2 && this.adjList.get(vertex1).includes(vertex2)) {
            isParallel = true;
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
        let id = this.edgeIdIncrement++;
        vertex1.edgeIds.push(id);
        if (vertex1 != vertex2) {
            vertex2.edgeIds.push(id); // not loop, second vertex needs id
        }

        // Update degree and degText
        vertex1.degree++;
        vertex1.updateDegText();
        vertex2.degree++;
        vertex2.updateDegText();

        let edge = new Edge(id, vertex1, vertex2, false, loopOffset, isParallel, parallelOffset);
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
            graph.updateVertexPropertiesOnEdgeDelete(edge); // update adjacent vertex properties
            graph.removeByValue(graph.edges, edge); // remove from graph edges
            deleteEdgesList.push(edge); // to delete graphics
            // (don't have to worry about adjList)
        });

        //this.updateIds(vertex.id); // decrement appropriate vertex ids (order matters!)
        this.adjList.delete(vertex); // delete this vertex's adjList entry
        // TODO: Update Ids?
        return deleteEdgesList;
    }

    // Deletes edge and returns it.
    deleteEdge(id) {
        let edge = this.getEdge(id);
        if (edge != null) {
            this.removeByValue(edge.v1.edgeIds, edge.id); // remove from v1 id list
            if (!edge.isLoop) {
                this.removeByValue(edge.v2.edgeIds, edge.id); // remove from v2 id list
            }
            this.removeByValue(this.edges, edge); // remove from graph edges

            // Delete edges from adjacency list
            this.removeByValue(this.adjList.get(edge.v1), edge.v2);
            this.removeByValue(this.adjList.get(edge.v2), edge.v1);

            this.updateVertexPropertiesOnEdgeDelete(edge); // update adjacent vertex properties
        }

        return edge;
    }

    // Upates loop, parallel, deg of adjacent vertices on edge delete.
    updateVertexPropertiesOnEdgeDelete(edge) {
        if (edge.isLoop) {
            edge.v1.degree -= 2;
            edge.v1.updateDegText();
        } else {
            if (edge.isParallel) {
            edge.v1.parallels--;
            edge.v2.parallels--;
            }

            edge.v1.degree--;
            edge.v2.degree--;
            edge.v1.updateDegText();
            edge.v2.updateDegText();
        }
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

    // toggles the direction of the vertex with id: v1 to v2, v2 to v1, undirected
    toggleDirection(id) {
        let edge = this.getEdge(id);
        if (edge != null) {
            let dirChange = edge.toggleDirection();
            if (dirChange == 1) {
                // update adjList for v1 to v2 from undirected:
                this.removeByValue(this.adjList.get(edge.v1), edge.v2);
            } else if (dirChange == 2) {
                // update adjList for v2 to v1 from v1 to v2:
                this.removeByValue(this.adjList.get(edge.v1), edge.v2);
                this.adjList.get(edge.v2).push(edge.v1);
            } else if (dirChange == 3) {
                // update adjList for undirected from v2 to v1:
                this.adjList.get(edge.v2).push(edge.v1);
            }
        }
        this.printGraph();
    }

    // Decriments the ids of all vertices id > id by 1 when a vertex of id is deleted.
    updateIds(id) {
        // TODO: implement
        for (let i = id + 1; i < this.adjList.size; i++) {
            let vertex = this.getVertex(i);
            if (vertex != null) {
                vertex.id--;
                vertex.updateIdText();
            }
        }
        this.idIncrement--;
    }

    // Returns the number of components in the graph.
    getNumComponents() {
        return this.getComponents().length;
    }

    // Builds and returns the graph's components.
    getComponents() {
        let components = [];
        let found = [];
        let graph = this;
        for (let vertex of this.adjList.keys()) {
            if(found.indexOf(vertex) == -1) {
                let component = [];
                component = graph.buildComponent(vertex, component);
                found = found.concat(component);
                components.push(component);
            }
        }
        return components;
    }

    // Recursively builds and returns a component.
    buildComponent(vertex, component) {
        component.push(vertex);
        let adjacents = this.adjList.get(vertex);
        let graph = this;
        adjacents.forEach(function (adj) {
            if (component.indexOf(adj) == -1) {
                component = graph.buildComponent(adj, component);
            }
        });
        return component;
    }

    // Returns whether the graph is bipartite.
    getIsBipartite() {
        if (this.adjList.size == 0) {
            return true; // trivially bipartite
        }

        if (this.getNumComponents() == 1) {
            let [set1, set2] = this.buildBipartiteSets();
            let intersection = this.getIntersection(set1, set2);
            let allAcountedFor = ((set1.size + set2.size) == this.adjList.size);
            let areDisjoint = (intersection.size == 0);
            return allAcountedFor && areDisjoint;
        }

        return false;
    }

    // Builds two sets for bipartite check.
    buildBipartiteSets() {
        let set1 = new Set();
        let set2 = new Set();
        set1.add(this.adjList.keys().next().value);
        for (let vertex of this.adjList.keys()) {
            let adjacents = this.adjList.get(vertex);
            adjacents.forEach(function (adj) {
                if (set1.has(vertex)) {
                    set2.add(adj);
                }
                if (set2.has(vertex)) {
                    set1.add(adj);
                }
            });
        }
        return [set1, set2];
    }

    // return the intersection of two sets
    getIntersection(set1, set2) {
        let intersection = new Set();
        for (let element of set1) {
            if (set2.has(element)) {
                intersection.add(element);
            }
        }
        return intersection;
    }

    // removes the first instance of value from array
    removeByValue(array, value) {
        array.splice(array.indexOf(value), 1);
    }

    // Returns the laplacian matrix of the graph
    getlapMatrix() {
        let matrix = [];
        for (let vertex of this.adjList.keys()) {
            let row = new Array;
            for (let i = 0; i < this.adjList.size; i++) { row[i] = 0; }
            let adjacents = this.adjList.get(vertex);
            adjacents.forEach(function(adj) {
                row[adj.id]++;
            });
            matrix.push(row);
            let degree = -vertex.degree;
            if (degree == -0) { degree = 0; }
            row[vertex.id] = degree;
        }
        return matrix;
    }

    // Prints the graph contents.
    printGraph() {
        console.log("adjacency list:");
        // For each vertex:
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
        this.idText = new fabric.Text(this.id + "", {
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
        this.idText.set('text', this.id + '');
    }
}

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
