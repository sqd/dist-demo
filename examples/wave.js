class DFS extends BaseNode {
    init() {
        this.parent = null;
        this.forwarded = new Set();
    }

    start() {
        this.setColor('blue');

        this.parent = this;
        const n = this.randomNeighbour();
        this.sendMsg(n, new Set([this]));
        this.forwarded.add(n);
    }

    thisText() {
        return this.textSVG.text();
    }

    onMessage(edge, msg) {
        if (this.parent === this && msg.size == app.nodes.length) {
            return;
        }

        // Mark that we have received the message
        this.setColor('lightblue');
        console.log(msg);
        msg.add(this);

        const self = this;

        // First contacting node becomes parent
        if (this.parent === null) {
            this.parent = edge.from;
        }
        // Return token immediately if it's allowed (not forwarded before,
        // AND either it's not from parent OR parent is the last left)
        if (!this.forwarded.has(edge.from) &&
            edge.from !== this.parent) {
            this.sendMsg(edge.from, msg);
            this.forwarded.add(edge.from);
        } else {
            // Find one to forward
            const neighbours = this.outgoing();
            for (let i = 0; i < neighbours.length; i++) {
                const e = neighbours[i];
                if (e.to !== self.parent && !self.forwarded.has(e.to)) {
                    this.sendMsg(e.to, msg);
                    this.forwarded.add(e.to);
                    return;
                }
            }
            // No luck. Do parent
            this.sendMsg(self.parent, msg);
            this.forwarded.add(self.parent);
        }
    }
}