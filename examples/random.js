class RandomForward extends BaseNode {
    init() {
        // Set a custom state
        this.myState = 0;
    }

    onMessage(edge, msg) {
        // Set the text
        this.setText(msg.toString());
        // Forward the incremented counter
        this.sendMsg(this.randomNeighbour(), msg + 1);
    }

    start() {
        this.onMessage(null, 0);
    }
}