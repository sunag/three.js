import Node from '../core/Node.js';

class DeferredCallNode extends Node {

	static get type() {

		return 'DeferredCallNode';

	}

	constructor( node, name, ... parameters ) {

		super();

		this.node = node;

		this.name = name;

		this.parameters = parameters;

		this.isDeferredCallNode = true;

	}

}

export default DeferredCallNode;
