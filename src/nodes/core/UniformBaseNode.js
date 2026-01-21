import InputNode from './InputNode.js';
import { defaultUniformGroup } from './UniformGroupBaseNode.js';
import { warn } from '../../utils.js';

/**
 * Base class for representing a uniform.
 *
 * @augments InputNode
 */
class UniformBaseNode extends InputNode {

	static get type() {

		return 'UniformBaseNode';

	}

	/**
	 * Constructs a new uniform base node.
	 *
	 * @param {any} value - The value of this node. Usually a JS primitive or three.js object (vector, matrix, color, texture).
	 * @param {?string} nodeType - The node type. If no explicit type is defined, the node tries to derive the type from its value.
	 */
	constructor( value, nodeType = null ) {

		super( value, nodeType );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isUniformNode = true;

		/**
		 * The name or label of the uniform.
		 *
		 * @type {string}
		 * @default ''
		 */
		this.name = '';

		/**
		 * The uniform group of this uniform. By default, uniforms are
		 * managed per object but they might belong to a shared group
		 * which is updated per frame or render call.
		 *
		 * @type {UniformGroupBaseNode}
		 */
		this.groupNode = defaultUniformGroup;

	}

	/**
	 * Sets the {@link UniformBaseNode#name} property.
	 *
	 * @param {string} name - The name of the uniform.
	 * @return {UniformBaseNode} A reference to this node.
	 */
	setName( name ) {

		this.name = name;

		return this;

	}

	/**
	 * Sets the {@link UniformBaseNode#name} property.
	 *
	 * @deprecated
	 * @param {string} name - The name of the uniform.
	 * @return {UniformBaseNode} A reference to this node.
	 */
	label( name ) {

		warn( 'TSL: "label()" has been deprecated. Use "setName()" instead.' ); // @deprecated r179

		return this.setName( name );

	}

	/**
	 * Sets the {@link UniformBaseNode#groupNode} property.
	 *
	 * @param {UniformGroupBaseNode} group - The uniform group.
	 * @return {UniformBaseNode} A reference to this node.
	 */
	setGroup( group ) {

		this.groupNode = group;

		return this;

	}

	/**
	 * By default, this method returns the result of {@link Node#getHash} but derived
	 * classes might overwrite this method with a different implementation.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @return {string} The uniform hash.
	 */
	getUniformHash( builder ) {

		return this.getHash( builder );

	}

	onUpdate( callback, updateType ) {

		callback = callback.bind( this );

		return super.onUpdate( ( frame ) => {

			const value = callback( frame, this );

			if ( value !== undefined ) {

				this.value = value;

			}

	 	}, updateType );

	}

	/**
	 * Overwrites the default implementation to handle boolean uniforms.
	 *
	 * @param {NodeBuilder} builder - The current node builder.
	 * @return {string} The input type.
	 */
	getInputType( builder ) {

		let type = super.getInputType( builder );

		if ( type === 'bool' ) {

			type = 'uint';

		}

		return type;

	}

	getSharedNode( builder ) {

		const hash = this.getUniformHash( builder );

		let sharedNode = builder.getNodeFromHash( hash );

		if ( sharedNode === undefined ) {

			builder.setHashNode( this, hash );

			sharedNode = this;

		}

		return sharedNode;

	}

	getName( builder = null ) {

		if ( builder === null ) return this.name;

		//

		const nodeData = builder.getDataFromNode( this, 'any' );

		if ( nodeData.nodeName === undefined ) {

			const uniformName = this.name || builder.context.nodeName;

			if ( builder.context.nodeName !== undefined ) delete builder.context.nodeName;

			nodeData.nodeName = uniformName || '';

		}

		return nodeData.nodeName;

	}

	getProperty( builder ) {

		const sharedNode = this.getSharedNode( builder );
		const sharedNodeType = sharedNode.getInputType( builder );

		const nodeUniform = builder.getUniformFromNode( sharedNode, sharedNodeType, builder.shaderStage, this.getName( builder ) );
		const uniformProperty = builder.getPropertyName( nodeUniform );

		return uniformProperty;

	}

	generate( builder, output ) {

		const type = this.getNodeType( builder );
		const uniformProperty = this.getProperty( builder );

		//

		let snippet = uniformProperty;

		if ( type === 'bool' ) {

			// cache to variable

			const nodeData = builder.getDataFromNode( this );

			let propertyName = nodeData.propertyName;

			if ( propertyName === undefined ) {

				const sharedNode = this.getSharedNode( builder );
				const sharedNodeType = sharedNode.getInputType( builder );

				const nodeVar = builder.getVarFromNode( this, null, 'bool' );
				propertyName = builder.getPropertyName( nodeVar );

				nodeData.propertyName = propertyName;

				snippet = builder.format( uniformName, sharedNodeType, type );

				builder.addLineFlowCode( `${ propertyName } = ${ snippet }`, this );

			}

			snippet = propertyName;

		}

		return builder.format( snippet, type, output );

	}

}

export default UniformBaseNode;
