import UniformNode from '../core/UniformNode.js';
import UVNode from './UVNode.js';

class TextureNode extends UniformNode {

	constructor( value, uvNode = null, levelNode = null ) {

		super( value, 'vec4' );

		this.isTextureNode = true;

		this.uvNode = uvNode;
		this.levelNode = levelNode;

	}

	getUniformHash( /*builder*/ ) {

		return this.value.uuid;

	}

	getInputType( /*builder*/ ) {

		return 'texture';

	}

	getConstructHash( builder ) {

		return `${ this.uuid } / ${ builder.context.environmentContext?.uuid || '' }`;

	}

	construct( builder ) {

		const properties = builder.getNodeProperties( this );

		const uvNode = this.uvNode || builder.context.uvNode || new UVNode();
		let levelNode = this.levelNode || builder.context.levelNode;

		if ( levelNode?.isNode === true ) {

			const texture = this.value;

			levelNode = builder.context.levelShaderNode ? builder.context.levelShaderNode.call( { texture, levelNode }, builder ) : levelNode;

		}

		properties.uvNode = uvNode;
		properties.levelNode = levelNode;

	}

	generate( builder, output ) {

		const { uvNode, levelNode } = builder.getNodeProperties( this );

		const texture = this.value;

		if ( ! texture || texture.isTexture !== true ) {

			throw new Error( 'TextureNode: Need a three.js texture.' );

		}

		const textureProperty = super.generate( builder, 'texture' );

		if ( output === 'sampler' ) {

			return textureProperty + '_sampler';

		} else if ( builder.isReference( output ) ) {

			return textureProperty;

		} else {

			const nodeData = builder.getDataFromNode( this );

			let snippet = nodeData.snippet;

			if ( snippet === undefined ) {

				const uvSnippet = uvNode.build( builder, 'vec2' );

				if ( levelNode?.isNode === true ) {

					const levelSnippet = levelNode.build( builder, 'float' );

					snippet = builder.getTextureLevel( textureProperty, uvSnippet, levelSnippet );

				} else {

					snippet = builder.getTexture( textureProperty, uvSnippet );

				}

				nodeData.snippet = snippet;

			}

			return builder.format( snippet, 'vec4', output );

		}

	}

	serialize( data ) {

		super.serialize( data );

		data.value = this.value.toJSON( data.meta ).uuid;

	}

	deserialize( data ) {

		super.deserialize( data );

		this.value = data.meta.textures[ data.value ];

	}

}

export default TextureNode;
