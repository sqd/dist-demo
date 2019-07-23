'use strict';
import anime from './js/anime.es.mjs';
import $ from './js/jquery.min.mjs';
import SVG from './js/svg.min.mjs';
import utils from './js/utils.mjs';

class BaseNode {
    constructor() {
        this.circleSVG = null;
        this.textSVG = null;

        this.edges = new Array();
    }

    setSVG(circle, text) {
        this.circleSVG = circle;
        this.textSVG = text;
    }

    onMessage(sender, msg) {

    }
}

class BaseEdge {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.pathSVG = null;
    }

    setSVG(svg) {
        this.pathSVG = svg;
    }
}

class App {
    constructor(svg) {
        this.svg = svg;

        this.nodes = new Array();

        this.curNodeClass = BaseNode;
        this.curInitColor = 'black';

        this.curEdgeClass = BaseEdge;
    }

    onClickAddNode(x, y) {
        console.log(`Add node at ${x}, ${y} (total: ${this.nodes.length})`);

        const node = new this.curNodeClass();

        const tag = this.nodes.length.toString();
        view.drawNode(node, x, y, this.curInitColor, tag);

        // Update the model
        this.nodes.push(node);
    }

    onDrawEdge(n1, n2) {
        console.log(`Edge from ${n1.textSVG.text()} to ${n2.textSVG.text()}`);

        const edge = new this.curEdgeClass(n1, n2);

        const x1 = n1.circleSVG.cx(),
            y1 = n1.circleSVG.cy(),
            x2 = n2.circleSVG.cx(),
            y2 = n2.circleSVG.cy();
        view.drawEdge(edge, x1, y1, x2, y2);

        // Update the model
        n1.edges.push(edge);
        n2.edges.push(edge);
    }
}

class View {
    constructor(svg) {
        const self = this;

        self.svg = svg;
        svg.text("Left Click to Add Nodes\nLeft Drag to Move Nodes\nRight Click to Delete Nodes\nRight Drag to Add Edges").x(0).y(0);

        self.leftDragging = null;
        self.rightDragging = null;

        // Setup clicking to add node
        $(svg.node).click(function(ev) {
            if (ev.target !== svg.node) {
                return;
            }
            app.onClickAddNode(ev.pageX, ev.pageY);
        });

        // Disable right click menu
        $(svg.node).contextmenu(function(ev) {
            ev.preventDefault();
        });

        // Make a node dragged by the left btn follow cursor
        $(svg.node).mousemove(function(ev) {
            // If not dragging, this is just a normal mouse-move
            if (self.leftDragging === null) {
                return;
            }
            // Move the current dragging node
            self.moveNode(self.leftDragging, ev.pageX, ev.pageY);
        });

        // If a node dragged by the left btn leave the canvas
        // Drop it at the border
        $(svg.node).mouseleave(function() {
            self.leftDragging = null;
        });
    }

    /*
    Draw a node and setup its events
    */
    drawNode(node, x, y, color, tag) {
        const self = this;

        // Draw the circle
        const circle = self.svg.circle(30).cx(x).cy(y);
        circle.attr({ class: "draggable" });
        circle.fill(color);

        const text = self.svg.text(tag).cx(x).cy(y);
        text.attr({ class: "svg-text" });
        text.fill('white');

        // Mouse events
        circle.mousedown(function(ev) {
            switch (ev.which) {
                case 1:
                    // Start dragging the node around
                    self.leftDragging = node;
                    break;
                case 3:
                    // Start adding an edge
                    self.rightDragging = node;
                    break
            }
        });
        circle.mouseup(function(ev) {
            switch (ev.which) {
                case 1:
                    // Stop dragging the node around
                    self.leftDragging = null;
                    break;
                case 3:
                    // Add an edge
                    const from = self.rightDragging;
                    // Ignore if stop on self
                    if (ev.target === from.circleSVG.node) {
                        return;
                    }
                    // Tell control
                    app.onDrawEdge(self.rightDragging, node);
                    // Reset
                    self.rightDragging = null;
                    break;
            }
        });

        // Disable right click menu on the circle
        $(circle.node).contextmenu(function(ev) {
            ev.preventDefault();
        });

        node.setSVG(circle, text);
    }

    /*
    Draw an edge and setup events
    */
    drawEdge(e, x1, y1, x2, y2) {
        const radius = 15; // TODO magic number
        const rotation = Math.atan((y1 - y2) / (x1 - x2)) / Math.PI * 180;
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        const x1_ = utils.interpolate(x1, x2, radius / dist),
            y1_ = utils.interpolate(y1, y2, radius / dist),
            x2_ = utils.interpolate(x2, x1, radius / dist),
            y2_ = utils.interpolate(y2, y1, radius / dist);

        const longRadius = dist / 2 - 2 * radius;
        const shortRadius = longRadius / 5;

        const pathdir = `M${x1_} ${y1_} A ${longRadius} ${shortRadius} ${rotation} 0 0 ${x2_} ${y2_}`;

        const path = e.pathSVG === null ? svg.path() : e.pathSVG;
        path.plot(pathdir);
        path.fill('none');
        path.stroke({ color: '#f06', width: 4 })
        path.back();

        e.setSVG(path);
    }

    moveNode(node, x, y) {
        const self = this;

        node.circleSVG.cx(x).cy(y);
        node.textSVG.cx(x).cy(y);

        node.edges.forEach(edge => {
            if (node === edge.from) {
                // The 'from' node is moved
                const to = edge.to.circleSVG;
                self.drawEdge(edge, x, y, to.cx(), to.cy());
            } else {
                // The 'to' node is moved
                const from = edge.from.circleSVG;
                self.drawEdge(edge, from.cx(), from.cy(), x, y);
            }
        });
    }
}

var svg;
var app;
var view;
var editor;

function main() {
    // Create canvas
    svg = SVG("background").size('100%', '100%');
    svg.attr({ style: 'background: #D3D3D3;' });

    // Initialize app
    app = new App(svg);

    // View
    view = new View(svg);

    // Init editors
    editor = ace.edit("configure-input");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");

    // Binding
    document.app = app;
    document.view = view;
    document.svg = svg;
}

$(document).ready(function() {
    main();
});