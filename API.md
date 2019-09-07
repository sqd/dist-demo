### Your own node class

```javascript
class MyNodeClass extends BaseNode // Extend from BaseNode to gain access to all the helper functions
{
    init() {
        // init() will be called when the node is created

        this.setColor('blue'); // Set the color of this node to blue
    }

    start() {
        // a function to start the whole messaging process
        // you can also use other names, or don't have such function at all

        const neighbour = this.randomNeighbour(); // randomNeighbour() returns a neighbour Node object

        const myMsg = 0;
        this.sendMsg(neighbour, myMsg); // Send an integer message myMsg to this neighbour 
    }

    onMessage(edge, msg) {
        // called when this node receives a message
        // edge is the edge the message came from
        // msg is the message object

        const newMsg = msg*2 - 1;
        this.setColor('gotcha'); // Set the text of this node

        console.log('A message is sent from ' + edge.from + ' to ' + edge.to);
        // edge.from is the start of the edge, in this case the sender
        // edge.to is the end of the edge, in this case this node

        const outgoingEdges = this.outgoing(); // Get a list of the outbound edges

        const chosenEdge = outgoingEdges[42]; // choose some random edge
        this.sendMsg(chosenEdge.to, newMsg);

        const niceEdge = outgoingEdges[69]; // choose some other random edge
        this.sendMsg(niceEdge.to, newMsg); // send another msg
    }
}

```