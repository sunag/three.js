import Node from '../core/Node.js';
import PropertyNode from '../core/PropertyNode.js';
import { ShaderNode, fract, sin, float, vec2, add, mul, bypass, assign, temp, expression } from '../shadernode/ShaderNodeBaseElements.js';

const randomShaderNode = new ShaderNode( ( { seed, seedId } ) => {

	return fract( mul( sin( mul( add( float( seed ), seedId ), 91.3458 ) ), 43758.5453 ) );

} );

class RandomNode extends Node {

	constructor( seedNode ) {

		super( 'float' );

		this.seedNode = seedNode;
		this.seedId = expression( '( seed + .001 )', 'float' );

	}

	generate( builder ) {

		return randomShaderNode.call( { seed: this.seedNode, seedId: this.seedId } ).build( builder );

	}

}

export default RandomNode;
