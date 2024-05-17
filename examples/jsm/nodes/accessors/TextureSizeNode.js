import Node from '../core/Node.js';
import { addNodeClass } from '../core/Node.js';
import { nodeProxy } from '../shadernode/ShaderNode.js';

class TextureSizeNode extends Node {

	constructor( textureNode, levelNode = null ) {

		super( 'uvec2' );

		this.isTextureSizeNode = true;

		this.textureNode = textureNode;
		this.levelNode = levelNode;

	}

	setup( builder ) {

		const properties = builder.getNodeProperties( this );
		properties.textureNode = this.textureNode;
		properties.levelNode = this.levelNode;

	}

	generate( builder, output ) {

		const textureProperty = this.textureNode.build( builder, 'property' );
		const levelNode = this.levelNode.build( builder, 'int' );

		return builder.format( `${ builder.getMethod( 'textureDimensions' ) }( ${ textureProperty }, ${ levelNode } )`, this.getNodeType( builder ), output );

	}

}

export default TextureSizeNode;

export const textureSize = nodeProxy( TextureSizeNode );

addNodeClass( 'TextureSizeNode', TextureSizeNode );
