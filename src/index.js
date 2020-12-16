"use strict"
import {fabric} from 'fabric';
var MinHeap = require('mnemonist/heap').MinHeap;

const VERTEX_RADIUS = 15;


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

        // Tracks mouse position in canvas:
        mousePos = { x: 0, y: 0 };
        document.addEventListener('mousemove', calcMousePos);

        // Tracks if mouse in canvas:
        inCanvas = false;
        let upperCanvas = document.getElementsByClassName("upper-canvas")[0];
        upperCanvas.addEventListener('mouseenter', function () { inCanvas = true; updateUI(); });
        upperCanvas.addEventListener('mouseleave', function () { inCanvas = false; updateUI(); });

        // Set up graph:
        graph = new Graph();

        // Events:
        document.addEventListener('mousemove', updateUI);
        document.addEventListener('keydown', keyDownSwitch);



        document.addEventListener('mousemove', updateEdges);
        canvas.on('selection:created', function () {
            canvas.getActiveObject().on('moved', function (e) {
                console.log('moving');
                e.target.calcCoords();
                updateEdges();
            });
            console.log("selection created");
        });
        //
        // let coords = canvas.on("object:moving", function(e) {
        //     var actObj = e.target;
        //     var coords = actObj.calcCoords();
        //     // calcCoords returns an object of corner points like this
        //     //{bl:{x:val, y:val},tl:{x:val, y:val},br:{x:val, y:val},tr:{x:val, y:val}}
        //     var left = coords.tl.x;
        //     var top = coords.tl.y;
        //     return {left:left,top:top};
        // });
    }

    // Updates UI (currently for debugging).
    function updateUI(e) {
        if (e != null) {
            document.getElementById('x').innerText = "x: " + e.clientX;
            document.getElementById('y').innerText = "y: " + e.clientY;
        }

        document.getElementById('status').innerText = "In canvas: " + inCanvas;
        document.getElementById('vertices').innerText = "# vertices: " + graph.adjList.size;
        document.getElementById('edges').innerText = "# edges: " + graph.edges.length;
    }

    // Calculates the mouse position in the canvas and updates mousePos.
    function calcMousePos(e) {
        let pointer = canvas.getPointer(e);
        mousePos.x = pointer.x;
        mousePos.y = pointer.y;
    }

    // Calls functions on key down event based on which key was pressed.
    function keyDownSwitch(e) {
        if (e.keyCode === 86) {
            addVertex(e);
        } else if (e.keyCode === 69) {
            addEdge();
        } else if (e.keyCode === 46) {
            deleteSelected();
        } else if (e.keyCode == 97) {
            changeColor('red');
        } else if (e.keyCode == 98) {
            changeColor('green');
        } else if (e.keyCode == 99) {
            changeColor('blue');
        }
    }

    // changes the color of the selected vertices
    function changeColor(color) {
        let active = canvas.getActiveObjects();
        for (let i = 0; i <= active.length; i++) {
            active[i].fill = color;
        }
        canvas.renderAll();
    }

    // Add a new vertex to graph at mouse position.
    function addVertex(e) {
        // If mouse in canvas, nothing selected:
        if (inCanvas && !canvas.getActiveObject()) {
            let posX = mousePos.x - VERTEX_RADIUS; // (offset to place center at mouse)
            let posY = mousePos.y - VERTEX_RADIUS;

            let vertex = graph.addVertex(posX, posY);
            canvas.add(vertex.circle);
            canvas.add(vertex.text);

            vertex.circle.on('moved', function () {
                updateEdges();
                updateVertices();
            });
            //canvas.on('object:moved', updateEdges);

            graph.printGraph();
            updateUI();
        }
    }

    // Add a new edge to graph.
    function addEdge(e) {
        let active = canvas.getActiveObjects();
        if (active.length == 2) {
            console.log("adding edge");
            let v1 = active[0].angle;
            let v2 = active[1].angle;
            let edge = graph.addEdge(v1, v2);

            canvas.add(edge.line);
            console.log(active[0]);
            console.log(active[1]);
            console.log(edge.line);

            updateUI();
        }
    }

    // Updates the graphics of all edges.
    function updateEdges() {
        console.log("updating edges");
        for (var edge of graph.edges) {
            canvas.remove(edge.line);
            edge.newLine();
            canvas.add(edge.line);
        }
    }

    function updateVertices() {
        for (var vertex of graph.vertices) {
            canvas.remove(vertex.text);
            vertex.newText();
            canvas.add(vertex.text);
        }
    }

    // Deletes all selected objects from graph and canvas.
    function deleteSelected(e) {
        // (I think this is the hackyest thing I have ever written)
        for (var object of canvas.getActiveObjects()) {
            canvas.remove(object);
            object.radius = 0; // flags vertex for deletion
        }
        graph.deleteSelectedVertices(); // deletes flagged vertices (radius=0)

        canvas.discardActiveObject(); // removes selection in canvas
        graph.printGraph();
        updateUI();
    }
})();


// Graph object, stored as an adjacency list.
class Graph {
    // Graph constructor.
    constructor() {
        this.vertices = [];
        this.edges = [];
        this.adjList = new Map();
        this.idIncrement = 0; // keeps track of next unique vertex id
        this.reclaimedIds = new MinHeap(); // keeps track of ids we can reuse from deleted vertices
    }

    // Adds a new vertex to the graph.
    addVertex(x, y) {
        let vertex = new Vertex(this.getNewId(), x, y);
        this.vertices.push(vertex);
        this.adjList.set(vertex, []);
        return vertex;
    }

    // returns the next available unique vertex id.
    getNewId() {
        if (this.reclaimedIds.size) {
            return this.reclaimedIds.pop();
        } else {
            return this.idIncrement++;
        }
    }

    // Deletes all vertices with radius=0 from graph.
    deleteSelectedVertices() {
        for (let vertex of this.adjList.keys()) {
            if (vertex.circle.radius == 0) {
                this.adjList.delete(vertex);
                this.reclaimedIds.push(vertex.id);
                console.log("deleted vertex " + vertex.id);
            }
        }
        console.log("");
    }

    // Adds an undirected edge from v1 to v2.
    addEdge(v1, v2) {
        let vertex1 = this.getVertex(v2);
        let vertex2 = this.getVertex(v1);

        this.adjList.get(vertex1).push(vertex2);
        this.adjList.get(vertex2).push(vertex1);

        let edge = new Edge(vertex1, vertex2);
        this.edges.push(edge);
        return edge;
    }

    // Returns the vertex with id v. If none exists, creates a new vetex.
    getVertex(v) {
        for (let vertex of this.adjList.keys()) {
            if (vertex.id == v) {
                return vertex;
            }
        }

        return new Vertex(v, -1, -1);
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
        this.circle = new fabric.Circle({
            left: x,
            top: y,
            fill: 'MediumAquaMarine',
            stroke: 'slategrey',
            strokeWidth: 0.15,
            radius: VERTEX_RADIUS,
            hasControls: false,
            angle: this.id
        });

        this.newText();
    }

    newText() {
        let coords = this.circle.calcOCoords();
        let x = (coords.tl.x + coords.tr.x) / 2;
        let y = ((coords.tl.y + coords.bl.y) / 2) - 20;

        this.text = new fabric.Text(this.id + "", {
            left: x,
            top: y,
            fill: 'black',
            fontFamily: 'Calibri, sans-serif',
            fontSize: 15,
            selectable: false
        });
    }
}

class Edge {
    constructor(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;

        this.newLine();
    }

    newLine() {
        let v1Coords = this.v1.circle.calcOCoords();
        let v2Coords = this.v2.circle.calcOCoords();

        let x1 = (v1Coords.tl.x + v1Coords.tr.x) / 2;
        let y1 = (v1Coords.tl.y + v1Coords.bl.y) / 2;
        let x2 = (v2Coords.tl.x + v2Coords.tr.x) / 2;
        let y2 = (v2Coords.tl.y + v2Coords.bl.y) / 2;

        console.log("x1:" + x1 + " y1:" + y1 + ", x2:" + x2 + "y2:" + y2 + "\n");
        this.line = new fabric.Line([x1, y1, x2, y2], {
            stroke: 'darkgrey',
            strokeWidth: 2,
            selectable: false
        });
    }
}
