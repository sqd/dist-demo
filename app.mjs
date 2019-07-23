'use strict';
import anime from './js/anime.es.mjs';
import $ from './js/jquery.min.mjs'
import SVG from './js/svg.min.mjs'

class BaseNode {
    constructor() {
        this.circleSVG = null;
        this.textSVG = null;
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
    }
}

class App {
    constructor(svg) {
        this.svg = svg;

        this.nodes = new Array();
        this.edges = {}

        this.curNodeClass = BaseNode;
        this.curInitColor = 'black';

        this.curEdgeClass = BaseEdge;
    }

    clickAddNode(x, y) {
        console.log(`Add node at ${x}, ${y} (total: ${this.nodes.length})`);

        const node = new this.curNodeClass();

        const tag = this.nodes.length.toString();
        view.drawNode(node, x, y, this.curInitColor, tag);

        // Update the model
        this.nodes.push(node);
        this.edges[node] = new Array();
    }

    dragAddEdge(n1, n2, x1, y1, x2, y2) {
        // console.log(`Edge from ${n1.text} to ${n2.text}`);

        const edge = new this.curEdgeClass(n1, n2);

        view.drawEdge(edge, x1, y1, x2, y2);

        // Update the model
    }

    addNode(obj, color, x, y, neighbours) {

    }
}

class View {
    constructor(svg) {
        self = this;

        self.svg = svg;
        svg.text("Left Click to Add Nodes\nLeft Drag to Move Nodes\nRight Click to Delete Nodes\nRight Drag to Add Edges").x(0).y(0);

        self.leftDragging = null;
        self.rightDragFromNode = null;
        self.rightDragFromCircle = null;

        // Setup clicking to add node
        $(svg.node).click(function(ev) {
            if (ev.target !== svg.node) {
                return;
            }
            app.clickAddNode(ev.pageX, ev.pageY);
        });

        // Disable right click menu
        $(svg.node).contextmenu(function(ev) {
            ev.preventDefault();
        });

        // Make a node dragged by the left btn follow cursor
        $(svg.node).mousemove(function(ev) {
            if (self.leftDragging === null) {
                return;
            }
            self.leftDragging.forEach(e => {
                e.cx(ev.pageX);
                e.cy(ev.pageY);
            });
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
        self = this;

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
                    self.leftDragging = [circle, text];
                    break;
                case 3:
                    self.rightDragFromNode = node;
                    self.rightDragFromCircle = circle;
                    break
            }
        });
        circle.mouseup(function(ev) {
            switch (ev.which) {
                case 1:
                    self.leftDragging = null;
                    break;
                case 3:
                    const fromCircle = self.rightDragFromCircle;
                    if (ev.target === self.rightDragFromCircle.node) {
                        return;
                    }
                    const x1 = fromCircle.cx(),
                        y1 = fromCircle.cy();
                    const x2 = circle.cx(),
                        y2 = circle.cy();
                    console.log(`${x1},${y1} -> ${x2},${y2}`);
                    app.dragAddEdge(self.rightDragFromNode, node, x1, y1, x2, y2);
                    self.rightDragFromNode = null;
                    self.rightDragFromCircle = null;
                    break;
            }
        });

        // Disable right click menu
        $(circle.node).contextmenu(function(ev) {
            ev.preventDefault();
        });

        node.setSVG(circle, text);
    }

    /*
    Draw an edge and setup events
    */
    drawEdge(e, x1, y1, x2, y2) {
        // var path = draw.path(`M${e.from.x} ${e.from.y} S 125 150 ${e.to.x} ${e.to.y}`);
        const rotation = Math.atan((y1 - y2) / (x1 - x2)) / Math.PI * 180;
        const longRadius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2;
        const shortRadius = longRadius / 5;

        const pathdir = `M${x1} ${y1} A ${longRadius} ${shortRadius} ${rotation} 0 0 ${x2} ${y2}`;

        const path = svg.path(pathdir);
        path.fill('none');
        path.stroke({ color: '#f06', width: 4, linecap: 'round', linejoin: 'round' })
        path.back();
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