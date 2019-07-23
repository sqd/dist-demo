class DFS extends BaseNode {
    init() {
        this.parent = null;
        this.forwarded = new Set();
    }

    start() {
        this.sendMsg(this.randomNeighbour(), null);
    }

    onMessage(edge, msg) {
        // Mark that we have received the message
        this.setColor('lightblue');

        const self = this;

        // First contacting node becomes parent
        if (this.parent === null) {
            this.parent = edge.from;
        }
        // Return token immediately if it's allowed (not forwarded before,
        // AND either it's not from parent OR parent is the last left)
        if (!this.forwarded.has(edge.from) &&
            (edge.from !== this.parent || this.forwarded.size + 1 == this.outgoing().length)) {
            this.sendMsg(edge.from, msg);
            this.forwarded.add(edge.from);
        } else {
            // Find one to forward
            this.outgoing().forEach(e => {
                if (e.to !== self.parent && !self.forwarded.has(e.to)) {
                    this.sendMsg(edge.from, msg);
                    this.forwarded.add(edge.from);
                    return;
                }
            });
            // No luck. Do parent
            this.sendMsg(self.parent, msg);
            this.forwarded.add(self.parent);
        }
    }
}