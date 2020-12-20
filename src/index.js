/*
TODO:
- Fix group movement postion stuff
- Different selection (color red?)
- Help ui (?) for controls and such
- UI info toggles
- More Features!
*/


"use strict"
import {fabric} from 'fabric';
const Graph = require('./graph.js');

const VERTEX_COLOR_1 = 'MediumAquaMarine';
const VERTEX_COLOR_2 = 'CornflowerBlue';
const VERTEX_COLOR_3 = 'Plum';
const VERTEX_COLOR_4 = 'DimGrey';
const VERTEX_COLOR_5 = 'Khaki';
const VERTEX_COLOR_6 = 'LightSalmon';

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

    // Prints the Laplacian matrix (WolframAlpha comaptable) if graph is undirected.
    function printLapMatrix() {
        let lapMatDisplay = document.getElementById('lapMat');
        if (!graph.getIsDirected()) {
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
        } else {
            lapMatDisplay.innerText = "Graph must be undirected."
        }
    }
})();
