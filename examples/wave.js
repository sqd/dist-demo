class DFS extends BaseNode {
    init() {
        this.parent = null;
        this.forwarded = new Set();
    }

    start() {
        this.setColor('blue');
        this.parent = this;

        // Send the token (a set of nodes) to a random neighbour
        const n = this.randomNeighbour();
        this.forwarded.add(n);
        this.sendMsg(n, new Set([this]));
    }

    onMessage(edge, msg) {
        const self = this;

        // If the token has passed everywhere and returned to the initiator, abort
        if (this.parent === this && msg.size == app.nodes.length) {
            alert("Finished!");
            return;
        }

        // Mark that we have received the message
        this.setColor('lightblue');
        msg.add(this);

        // First contacting node becomes parent
        if (this.parent === null) {
            this.parent = edge.from;
        }

        // Return token immediately if it's allowed: not forwarded before,
        // AND (either it's not from parent OR parent is the last left)
        if (!this.forwarded.has(edge.from) &&
            edge.from !== this.parent) {
            this.sendMsg(edge.from, msg);
            this.forwarded.add(edge.from);
        } else {
            // Find one to forward
            const neighbours = this.outgoing();
            for (let i = 0; i < neighbours.length; i++) {
                const e = neighbours[i];
                // If e doesn't go to the parent, and we haven't go through e before
                // Forward through e
                if (e.to !== self.parent && !self.forwarded.has(e.to)) {
                    this.forwarded.add(e.to);
                    this.sendMsg(e.to, msg);
                    return;
                }
            }

            // No luck. Do parent
            this.forwarded.add(self.parent);
            this.sendMsg(self.parent, msg);
        }
    }
}