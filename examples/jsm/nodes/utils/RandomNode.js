import Node from '../core/Node.js';
import { vec2, mul, sin, dot, fract } from '../shadernode/ShaderNodeBaseElements.js';

class RandomNode extends Node {

	constructor( seedNode ) {

		super();

		this.seedNode = seedNode;

	}

	construct() {

		const seedNode = this.seedNode;

		return fract( mul( sin( dot( seedNode.xy, vec2( 12.9898, 78.233 ) ) ), 43758.5453 ) );

	}

}

export default RandomNode;
