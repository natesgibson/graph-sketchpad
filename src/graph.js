const Vertex = require('./vertex.js');
const Edge = require('./edge.js');

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
        // get edge's endpoint vertices:
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

        // add edge to adjList:
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

    // Deletes vertex with id.
    deleteVertex(id) {
        let vertex = this.getVertex(id);
        this.updateIds(vertex.circle.id); // decrement appropriate vertex ids (order matters!)
        this.adjList.delete(vertex); // delete this vertex's adjList entry
    }

    // Deletes edge with id.
    deleteEdge(id) {
        let edge = this.getEdge(id);
        if (edge != null) {
            this.removeByValue(edge.v1.edgeIds, edge.line.id); // remove from v1 id list
            if (!edge.isLoop) {
                this.removeByValue(edge.v2.edgeIds, edge.line.id); // remove from v2 id list
            }

            // Delete edges from adjacency list
            let vertex1 = this.adjList.get(edge.v1);
            let vertex2 = this.adjList.get(edge.v2);
            if (vertex1 != null) {this.removeByValue(vertex1, edge.v2); }
            if (vertex2 != null) {this.removeByValue(vertex2, edge.v1); }

            this.updateVertexPropertiesOnEdgeDelete(edge); // update adjacent vertex properties
            this.removeByValue(this.edges, edge); // remove from graph edges
        }
    }

    // Upates loop, parallel, deg of adjacent vertices on edge delete.
    updateVertexPropertiesOnEdgeDelete(edge) {
        if (edge != null) {
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
    }

    // Returns the vertex with id. If none exists, creates a new vetex.
    getVertex(id) {
        for (let vertex of this.adjList.keys()) {
            if (vertex.circle.id == id) {
                return vertex;
            }
        }
        return null; // vertex not found
    }

    // Returns the edge with id.
    getEdge(id) {
        let edge = null;
        this.edges.forEach(function (ed) {
            if (ed.line.id == id) {
                edge = ed;
            }
        });
        return edge;
    }

    // Toggles the direction of the vertex with id: v1 to v2, v2 to v1, undirected.
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
        for (let i = id + 1; i < this.adjList.size; i++) {
            let vertex = this.getVertex(i);
            if (vertex != null) {
                vertex.circle.id--;
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

    // Return the intersection of two sets.
    getIntersection(set1, set2) {
        let intersection = new Set();
        for (let element of set1) {
            if (set2.has(element)) {
                intersection.add(element);
            }
        }
        return intersection;
    }

    // Removes the first instance of value from array.
    removeByValue(array, value) {
        array.splice(array.indexOf(value), 1);
    }

    // Reutrns if the graph has any directed edges.
    getIsDirected() {
        let isDirected = false;
        this.edges.forEach(function (edge) {
            if (edge.isDirected) {
                isDirected = true;
            }
        });
        return isDirected;
    }

    // Returns the laplacian matrix of the graph.
    getlapMatrix() {
        let matrix = [];
        for (let vertex of this.adjList.keys()) {
            let row = new Array;
            for (let i = 0; i < this.adjList.size; i++) { row[i] = 0; }
            let adjacents = this.adjList.get(vertex);
            adjacents.forEach(function(adj) {
                row[adj.circle.id]++;
            });
            matrix.push(row);
            let degree = -vertex.degree;
            if (degree == -0) { degree = 0; }
            row[vertex.circle.id] = degree;
        }
        return matrix;
    }

    // Prints the graph contents.
    printGraph() {
        console.log("adjacency list");
        // For each vertex:
        for (let vertex of this.adjList.keys()) {
            let adjVertices = this.adjList.get(vertex);
            let adjVerts = "";
            for (let adjVertex of adjVertices) {
                adjVerts += adjVertex.circle.id + ", ";
            }
            adjVerts = adjVerts.slice(0, -2);
            console.log(vertex.circle.id + ": " + adjVerts); // print this vertex and its adjacent vertices
        }
        console.log("");
    }
}

module.exports = Graph;
