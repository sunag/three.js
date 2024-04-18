import LightingNode from './LightingNode.js';
import { uniform } from '../core/UniformNode.js';
import { addNodeClass } from '../core/Node.js';

import { Color } from 'three';

class LightMapNode extends LightingNode {

	constructor( node = null ) {

		super();

		this.node = node;

	}

	setup( builder ) {

		builder.context.irradiance.addAssign( this.node );

	}

}

export default LightMapNode;

addNodeClass( 'LightMapNode', LightMapNode );
