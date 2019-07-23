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

    init() {}

    setSVG(circle, text) {
        this.circleSVG = circle;
        this.textSVG = text;
    }

    onMessage(edge, msg) {
        alert(`${this.constructor.name}::onMessage(edge, msg) not implemented!`);
    }

    setText(t) {
        this.textSVG.text(t);
        this.textSVG.cx(this.circleSVG.cx()).cy(this.circleSVG.cy());
    }

    setColor(c) {
        this.circleSVG.fill(c);
    }

    outgoing() {
        const self = this;
        return this.edges.filter(function(e) {
            return e.from === self;
        });
    }

    incoming() {
        const self = this;
        return this.edges.filter(function(e) {
            return e.to === self;
        });
    }

    sendMsg(to, msg) {
        const self = this;

        let edge = null;
        for (const i in this.edges) {
            const e = self.edges[i];
            if (e.to === to) {
                edge = e;
                break;
            };
        }
        if (edge === null) {
            alert(`Invalid message recipient!`);
            // TODO stop the process
            return;
        }
        app.message(edge, msg);
    }

    sendMessage(to, msg) {
        this.sendMsg(to, msg);
    }

    randomNeighbour() {
        const neighbours = this.outgoing();
        return neighbours[Math.floor(Math.random() * neighbours.length)].to;
    }
}

class BaseEdge {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.pathSVG = null;
        this.arrowSVG = null;
    }

    setSVG(path, arrow) {
        this.pathSVG = path;
        this.arrowSVG = arrow;
    }
}

class App {
    constructor(svg) {
        this.svg = svg;

        this.nodes = new Array();

        this.curNodeClass = null;
        this.curNodeColor = 'black';

        this.curEdgeClass = BaseEdge;

        this.sending = new Set();
    }

    onClickAddNode(x, y) {
        const node = new this.curNodeClass();
        console.log(`Add ${node.constructor.name} at ${x}, ${y} (total: ${this.nodes.length})`);
        node.init();

        const tag = this.nodes.length.toString();
        view.drawNode(node, x, y, this.curNodeColor, tag);

        // Update the model
        this.nodes.push(node);
    }

    onDrawEdge(n1, n2) {
        for (let i = 0; i < n1.edges.length; i++) {
            if (n1.edges[i].to === n2) {
                return;
            }
        }

        const edge = new this.curEdgeClass(n1, n2);

        console.log(`${edge.constructor.name} edge from ${n1.textSVG.text()} to ${n2.textSVG.text()}`);

        const x1 = n1.circleSVG.cx(),
            y1 = n1.circleSVG.cy(),
            x2 = n2.circleSVG.cx(),
            y2 = n2.circleSVG.cy();
        view.drawEdge(edge, x1, y1, x2, y2);

        // Update the model
        n1.edges.push(edge);
        n2.edges.push(edge);
    }

    message(e, msg, color = 'lightskyblue') {
        const self = this;

        // Create the message circle
        const msgSVG = svg.circle(10);
        msgSVG.fill(color);
        msgSVG.cx(0).cy(0);

        // Anime it
        const path = anime.path(e.pathSVG.node);
        const sendAnim = anime({
            targets: msgSVG.node,
            translateX: path('x'),
            translateY: path('y'),
            duration: 2000,
            easing: 'linear',
            complete: function() {
                msgSVG.remove();
                e.to.onMessage(e, msg);
                self.sending.delete(sendAnim);
            }
        });

        this.sending.add(sendAnim);
    }
}

class View {
    constructor(svg) {
        const self = this;

        self.svg = svg;
        self.text = svg.text("Left Click to Add Nodes\nLeft Drag to Move Nodes\nRight Click to Delete Nodes\nRight Drag to Add Edges").x(0).y(0);
        self.text.addClass('svg-text');

        self.leftDragging = null;
        self.rightDragging = null;

        // Setup clicking to add node
        $(svg.node).click(function(ev) {
            if (ev.target !== svg.node) {
                return;
            }
            if (app.curNodeClass === null) {
                alert('Set a valid node class first!');
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

        // Node class and Edge class
        $('#node-class').on('input', function() {
            try {
                app.curNodeClass = null;
                app.curNodeClass = eval($(this).val());
                if (typeof app.curNodeClass !== 'function' || !(new app.curNodeClass() instanceof BaseNode)) {
                    app.curNodeClass = null;
                }
            } catch (error) {}
            if (app.curNodeClass === null) {
                $(this).css('background-color', 'pink');
            } else {
                $(this).css('background-color', 'palegreen');
            }
        });
        $('#edge-class').on('input', function() {
            try {
                app.curEdgeClass = null;
                app.curEdgeClass = eval($(this).val());
                if (typeof app.curEdgeClass !== 'function' || !(new app.curEdgeClass() instanceof BaseEdge)) {
                    app.curEdgeClass = null;
                }
            } catch (error) {}
            if (app.curEdgeClass === null) {
                $(this).css('background-color', 'pink');
            } else {
                $(this).css('background-color', 'palegreen');
            }
        });

        // Colors
        $('#node-color-text').on('input', function() {
            if ($(this).val() !== '') {
                $('#node-color').css('color', $(this).val());
                app.curNodeColor = $('#node-color').css('color');
            }
        });
        $('#edge-color-text').on('input', function() {
            if ($(this).val() !== '') {
                $('#edge-color').css('color', $(this).val());
                app.curEdgeColor = $('#edge-color').css('color');
            }
        });
    }

    /*
    Draw a node and setup its events
    */
    drawNode(node, x, y, color, tag) {
        const self = this;

        // Draw the circle
        const circle = self.svg.circle(30).cx(x).cy(y);
        circle.addClass('draggable');
        circle.fill(color);

        const text = self.svg.text(tag).cx(x).cy(y);
        text.addClass('svg-text');
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
        var rotation = Math.atan((y1 - y2) / (x1 - x2)) / Math.PI * 180;
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


        // TODO figure out how to reuse arrow
        const mid = path.pointAt(path.length() / 2);
        const arrow = svg.polygon();
        arrow.plot([
            [-5, -5],
            [0, 10],
            [5, -5]
        ]);
        arrow.fill('#f06');
        arrow.cx(mid.x).cy(mid.y);

        if (x1_ >= x2_) {
            rotation += 180;
        }
        arrow.rotate(rotation - 90, mid.x, mid.y);

        if (e.arrowSVG) {
            e.arrowSVG.replace(arrow);
        }

        e.setSVG(path, arrow);
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

    // Binding
    window.app = app;
    window.view = view;
    window.svg = svg;
    window.BaseNode = BaseNode;
    window.BaseEdge = BaseEdge;

}

$(document).ready(function() {
    main();
});