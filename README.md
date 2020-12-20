# A Graph Theorist's Sketchpad

## Summary

This project is a web application developed as my final project for the course MATH/CPT_S 453 Graph Theory at WSU for Fall 2020.

It is a graph sketchpad, allowing the user to sketch a graph and perform various graph operations.

I made heavy use of the JavaScript library Fabric.js (http://fabricjs.com/).

A live version is hosted at: http://natesgibson.com/graph/.

## Repository Layout
### dist
Contains 'intex.html' and 'style.css' which I used to style the web app.\
'main.js' is built by Node.js. It is a combination of 'index.js' and Node.js library code.

### documents
Contains 'Project Writeup' in .pdf and .docx formats, which outlines the features and implementation of the
project as a narrative.\
(Included as part of the final project requirements. Last updated 12/17/2020.)

### node_modules
Node.js library stuff.

### src
Contains scripts consisting of 'index.js' and 'graph.js', 'vertex.js', and 'edge.js' class files.

## Instructions to Run Locally
If you want to run the web app locally, you only need the 'dist' folder. I would not recommend downloading the entire ~100mb project unless you plan to develop it. For the scripting implementation, see the 'src' folder.

Open 'index.html' in a modern web browser to run. I have not tested this on anything other than an updated Chrome on Windows 10 (December 2020).
