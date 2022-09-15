import TempNode from '../core/Node.js';
import { ShaderNode, EPSILON, sub, div, cond, lessThan } from '../shadernode/ShaderNodeBaseElements.js';

export const BurnNode = new ShaderNode( ( { base, blend }, builder ) => {
	
	return cond( lessThan( blend, EPSILON ), 0, sub( 1.0, div( sub( 1.0, base ), blend ) ) );

} );

class BlendMode extends TempNode {

	static BURN = 'burn';

	constructor( blendMode, baseNode, blendNode ) {

		super();

		this.blendMode = blendMode;

		this.baseNode = baseNode;
		this.blendNode = blendNode;

	}

	construct( ) {

		const blendMode = this.blendMode;
		const params = { base: this.baseNode, blend: this.blendNode };

		let outputNode = null;

		if ( blendMode === BlendMode.BURN ) {

			outputNode = BurnNode.call( params );

		} else {

			outputNode = this.baseNode;

		}

		return outputNode;

	}

}

export default BlendMode;
