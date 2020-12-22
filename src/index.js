/*
TODO:
- UI info (eg vertex text) toggles
- Fix isBipartite?
- Fix edge arrow and parallel edge graphics
- Way to graphically handle a lot of loops
- everything forced to stay in canvas (including on resize)
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

    // Initialize function on window load.
    function init() {
        // Set up Fabric.js canvas:
        canvas = new fabric.Canvas('canvas1');
        fabric.Group.prototype.hasControls = false;
        canvas.preserveObjectStacking = true;
        // Canvas size:
        canvas.setWidth(window.innerWidth * 0.85);
        canvas.setHeight(window.innerHeight * 0.65);
        window.addEventListener('resize', function () {
            canvas.setWidth(window.innerWidth * 0.85);
            canvas.setHeight(window.innerHeight * 0.65);
        });

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
        let help = document.getElementById('help');
        help.addEventListener('mouseover', function() { toggleDisplayChildren(help); });
        help.addEventListener('mouseout', function() { toggleDisplayChildren(help); });
        canvas.on('object:moving', updatePositionsOnMove);
        document.getElementById('vertex_ids').addEventListener('change', toggleDisplayVertexIds);
        document.getElementById('vertex_degrees').addEventListener('change', toggleDisplayVertexDegrees);

        canvas.on('object:moving', function (e) {
            var obj = e.target;
            // if object is too big ignore
            if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
              return;
            }
            obj.setCoords();
            // top-left  corner
            if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
              obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
              obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
            }
            // bot-right corner
            if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
              obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
              obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
            }
        });
    }

    // Updates UI.
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

    // Toggles if element's children are displayed.
    function toggleDisplayChildren(element) {
        let children = element.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let display = window.getComputedStyle(child).display;
            if (display == 'none') {
                child.style.display = 'block';
            } else {
                child.style.display = 'none';
            }
        }
    }

    // Add a new vertex to graph at mouse position.
    function addVertex(e) {
        // If mouse in canvas:
        if (inCanvas) {
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
            if (!edge.isLoop) {
                canvas.add(edge.arrow);
                canvas.bringToFront(edge.arrow);
            }

            canvas.renderAll();
            updateUI();
        }
    }

    // Deletes all selected objects from graph and canvas.
    function deleteSelected() {
        // First, delete selected edges:
        let active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'line' || object.get('type') == 'ellipse') {
                deleteEdge(graph.getEdge(object.id));
            }
        }

        // Second, delete selected vertices:
        active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'circle') {
                let vertex = graph.getVertex(object.id);
                canvas.remove(vertex.idText);
                canvas.remove(vertex.degText);
                graph.deleteVertex(vertex.circle.id);
                // delete each adjacent edge:
                while (vertex.edgeIds.length > 0) {
                    deleteEdge(graph.getEdge(vertex.edgeIds[0]));
                }
                canvas.remove(object);
            }
        }

        canvas.discardActiveObject(); // remove all selected in canvas
        canvas.renderAll();
        graph.printGraph();
        updateUI();
    }

    // Deletes edge from graph and removes it from canvas.
    function deleteEdge(edge) {
        graph.deleteEdge(edge.line.id);
        canvas.remove(edge.line);
        if (!edge.isLoop) { canvas.remove(edge.arrow); }
    }

    // Toggles the direction of the selected edge: v1 to v2, v2 to v1, undirected.
    function toggleDirection() {
        let active = canvas.getActiveObjects();
        // Note, only checks for line, cannot effect loops
        if (active.length == 1 && active[0].get('type') == 'line') {
            graph.toggleDirection(active[0].id);
        }
        canvas.renderAll();
    }

    // Changes the color of the selected vertices.
    function changeColor(color) {
        let active = canvas.getActiveObjects();

        active.forEach(function(object) {
            if (object.get('type') == "circle") {
                object.set('fill', color);
            }
        });
        canvas.renderAll();
    }

    // Toggles whether the index of vertices is displayed
    function toggleDisplayVertexIds(e) {
        for (var vertex of graph.adjList.keys()) {
            if (e.target.checked) {
                vertex.idText.set('visible', true);
            } else {
                vertex.idText.set('visible', false);
            }
        }
        canvas.renderAll();
    }

    // Toggles whether the degree of vertices is displayed
    function toggleDisplayVertexDegrees(e) {
        for (var vertex of graph.adjList.keys()) {
            if (e.target.checked) {
                vertex.degText.set('visible', true);
            } else {
                vertex.degText.set('visible', false);
            }
        }
        canvas.renderAll();
    }

    // Updates position of dependent graphical objects when an object is moved.
    function updatePositionsOnMove() {
        let active = canvas.getActiveObjects();
        for (var object of active) {
            if (object.get('type') == 'circle') {
                let vertex = graph.getVertex(object.id);
                let adjEdges = graph.getVertex(vertex.circle.id).edgeIds;
                for (let i = 0; i < adjEdges.length; i++) {
                    graph.getEdge(adjEdges[i]).updatePosition();
                }
                vertex.updateTextPosition();
            } else if (object.get('type') == 'line' || object.get('type') == 'ellipse') {
                graph.getEdge(object.id).updatePosition();
            }
        }
        canvas.renderAll();
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
