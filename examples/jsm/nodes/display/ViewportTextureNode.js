import TextureNode from '../accessors/TextureNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { addNodeClass } from '../core/Node.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNode.js';
import { viewportTopLeft } from './ViewportNode.js';

let rtt = null;
let rttList = [];
let rttId = 0;

class ViewportTextureNode extends TextureNode {

	constructor( uv = viewportTopLeft, level = null ) {

		super( null, uv, level );

		this.isOutputTextureNode = true;

		this.updateType = NodeUpdateType.FRAME;

	}

	construct( builder ) {

		this.rtt = builder.renderer.getViewportTexture();

		this.value = this.rtt.getTexture();

		return super.construct( builder );

	}

	update( frame ) {

		frame.renderer.updateViewportTexture( this.rtt );

	}

}

export default ViewportTextureNode;

export const viewportTexture = nodeProxy( ViewportTextureNode );

addNodeElement( 'viewportTexture', viewportTexture );

addNodeClass( ViewportTextureNode );
