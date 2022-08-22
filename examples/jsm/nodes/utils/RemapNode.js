import Node from '../core/Node.js';
import { add, sub, div, mul } from '../shadernode/ShaderNodeBaseElements.js';

class RemapNode extends Node {

	constructor( node, inLowNode, inHighNode, outLowNode, outHighNode ) {

		super();

		this.node = node;
		this.inLowNode = inLowNode;
		this.inHighNode = inHighNode;
		this.outLowNode = outLowNode;
		this.outHighNode = outHighNode;

	}

	construct() {

		const { node, inLowNode, inHighNode, outLowNode, outHighNode } = this;

		const value = div( sub( node, inLowNode ), sub( inHighNode, inLowNode ) );

		return add( mul( sub( outHighNode, outLowNode ), value ), outLowNode );

	}

}

export default RemapNode;
