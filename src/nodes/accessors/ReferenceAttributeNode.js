import Node from '../core/Node.js';
import BufferAttributeNode from './BufferAttributeNode.js';
import { NodeUpdateType } from '../core/constants.js';
import { mat3, mat4 } from '../tsl/TSLBase.js';
import { OnObjectDispose } from '../utils/EventNode.js';

import { BufferAttribute } from '../../core/BufferAttribute.js';
import { InterleavedBuffer } from '../../core/InterleavedBuffer.js';
import { InstancedInterleavedBuffer } from '../../core/InstancedInterleavedBuffer.js';
import { InterleavedBufferAttribute } from '../../core/InterleavedBufferAttribute.js';

const _columns = /*@__PURE__*/ new WeakMap();

/**
 * Creates column attributes that read the given array as a vertex buffer of matrices.
 *
 * @private
 * @param {TypedArray} array - The matrix data.
 * @param {number} itemSize - The item size of the matrices, `9` or `16`.
 * @param {number} [meshPerAttribute=0] - The instancing divisor, `0` if the data is not instanced.
 * @return {Array<InterleavedBufferAttribute>} The column attributes.
 */
function createColumns( array, itemSize, meshPerAttribute = 0 ) {

	const size = Math.sqrt( itemSize );
	const data = meshPerAttribute > 0 ? new InstancedInterleavedBuffer( array, itemSize, meshPerAttribute ) : new InterleavedBuffer( array, itemSize );

	const columns = [];

	for ( let i = 0; i < size; i ++ ) {

		columns.push( new InterleavedBufferAttribute( data, size, i * size ) );

	}

	return columns;

}

/**
 * Returns the column attributes that bind the given matrix attribute as a vertex buffer.
 * Vertex attributes hold at most four components, so matrices are read column by column.
 *
 * @private
 * @param {BufferAttribute} attribute - The matrix attribute.
 * @return {Array<InterleavedBufferAttribute>} The column attributes.
 */
function getColumns( attribute ) {

	let columns = _columns.get( attribute );

	if ( columns === undefined || columns[ 0 ].data.array !== attribute.array ) {

		const meshPerAttribute = attribute.isInstancedBufferAttribute === true ? attribute.meshPerAttribute : 0;

		columns = createColumns( attribute.array, attribute.itemSize, meshPerAttribute );
		columns[ 0 ].data.setUsage( attribute.usage );

		_columns.set( attribute, columns );

	}

	return columns;

}

/**
 * Copies pending updates of the given matrix attribute into its column buffer.
 *
 * @private
 * @param {BufferAttribute} attribute - The matrix attribute.
 */
function syncColumns( attribute ) {

	const data = getColumns( attribute )[ 0 ].data;

	if ( data.version !== attribute.version ) {

		data.clearUpdateRanges();
		data.updateRanges.push( ...attribute.updateRanges );
		attribute.clearUpdateRanges(); // the attribute as the source is never uploaded directly. clear to avoid update range accumulation

		data.version = attribute.version;

	}

}

/**
 * A buffer attribute node whose attribute only defines the layout. The attribute
 * that is bound is resolved from the rendered object.
 *
 * @private
 * @augments BufferAttributeNode
 */
class ReferenceBufferAttributeNode extends BufferAttributeNode {

	static get type() {

		return 'ReferenceBufferAttributeNode';

	}

	/**
	 * Constructs a new reference buffer attribute node.
	 *
	 * @param {BufferAttribute|InterleavedBufferAttribute} layout - The attribute defining the layout.
	 * @param {string} type - The node type.
	 * @param {ReferenceAttributeNode} referenceNode - The node that resolves the attribute.
	 * @param {number} index - The index of the bound attribute, the column for matrices.
	 */
	constructor( layout, type, referenceNode, index ) {

		super( layout, type );

		/**
		 * The node that resolves the attribute.
		 *
		 * @type {ReferenceAttributeNode}
		 */
		this.referenceNode = referenceNode;

		/**
		 * The index of the bound attribute, the column for matrices.
		 *
		 * @type {number}
		 */
		this.index = index;

	}

	getObjectAttribute( object ) {

		return this.referenceNode.getBufferAttributes( object )[ this.index ];

	}

}

/**
 * This node binds a buffer attribute property of the rendered object, like {@link ReferenceNode}
 * does for uniforms. The generated program does not depend on a specific attribute, so it can be
 * shared between objects that each bind their own data. Matrix attributes are bound as one vertex
 * attribute per column. The bound attributes belong to the object and are released when it is disposed.
 *
 * ```js
 * instanceColor.assign( referenceAttribute( 'instanceColor' ) );
 * ```
 *
 * @augments Node
 */
class ReferenceAttributeNode extends Node {

	static get type() {

		return 'ReferenceAttributeNode';

	}

	/**
	 * Constructs a new reference attribute node.
	 *
	 * @param {string} property - The name of the attribute property. It might have dots so nested properties can be referred.
	 * @param {?string} [nodeType=null] - The node type. It is inferred from the attribute if not set.
	 */
	constructor( property, nodeType = null ) {

		super( nodeType );

		/**
		 * The name of the attribute property.
		 *
		 * @type {string}
		 */
		this.property = property;

		/**
		 * The hierarchy of the property names.
		 *
		 * @type {Array<string>}
		 */
		this.properties = property.split( '.' );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isReferenceAttributeNode = true;

		/**
		 * The attributes bound for each rendered object, released when the object is disposed.
		 *
		 * @private
		 * @type {WeakMap<Object3D, Array<BufferAttribute|InterleavedBufferAttribute>>}
		 */
		this._boundAttributes = new WeakMap();

		/**
		 * Matrix attributes are synchronized with their column buffer before the object is rendered.
		 *
		 * @type {string}
		 * @default 'object'
		 */
		this.updateBeforeType = NodeUpdateType.OBJECT;

	}

	/**
	 * Returns the attribute that is bound when rendering the given object.
	 *
	 * @param {Object3D} object - The rendered object.
	 * @return {BufferAttribute} The attribute.
	 */
	getAttribute( object ) {

		const { properties } = this;

		let value = object[ properties[ 0 ] ];

		for ( let i = 1; i < properties.length; i ++ ) {

			value = value[ properties[ i ] ];

		}

		return value;

	}

	/**
	 * Returns the attributes that are bound when rendering the given object.
	 *
	 * @param {Object3D} object - The rendered object.
	 * @return {Array<BufferAttribute|InterleavedBufferAttribute>} The bound attributes, one per column for matrices.
	 */
	getBufferAttributes( object ) {

		const attribute = this.getAttribute( object );
		const attributes = attribute.itemSize > 4 ? getColumns( attribute ) : [ attribute ];

		this._boundAttributes.set( object, attributes );

		return attributes;

	}

	generateNodeType( builder ) {

		if ( this.nodeType !== null ) return this.nodeType;

		return builder.getTypeFromAttribute( this.getAttribute( builder.object ) );

	}

	setup( builder ) {

		const type = this.getNodeType( builder );
		const itemSize = builder.getTypeLength( type );

		// the bound attributes belong to the object, so they are released with it

		OnObjectDispose( ( { object, renderer } ) => {

			const attributes = this._boundAttributes.get( object );

			if ( attributes === undefined ) return;

			for ( const attribute of attributes ) {

				renderer.disposeAttribute( attribute );

			}

			this._boundAttributes.delete( object );

		} );

		// the layout attributes are never bound, each object binds its own attributes

		if ( itemSize > 4 ) {

			const columnType = builder.getTypeFromLength( Math.sqrt( itemSize ) );
			const columns = createColumns( new Float32Array( itemSize ), itemSize ).map( ( column, index ) => new ReferenceBufferAttributeNode( column, columnType, this, index ) );

			return itemSize === 16 ? mat4( ...columns ) : mat3( ...columns );

		}

		return new ReferenceBufferAttributeNode( new BufferAttribute( new Float32Array( itemSize ), itemSize ), type, this, 0 );

	}

	updateBefore( { object } ) {

		const attribute = this.getAttribute( object );

		if ( attribute.itemSize > 4 ) syncColumns( attribute );

	}

}

export default ReferenceAttributeNode;

/**
 * TSL function for creating a reference attribute node.
 *
 * @tsl
 * @function
 * @param {string} property - The name of the attribute property. It might have dots so nested properties can be referred.
 * @param {?string} [type=null] - The node type. It is inferred from the attribute if not set.
 * @returns {ReferenceAttributeNode}
 */
export const referenceAttribute = ( property, type = null ) => new ReferenceAttributeNode( property, type );
