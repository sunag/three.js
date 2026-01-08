import Node from './Node.js';

/**
 * Base class for uniform group nodes that can be used to group single instances
 * of {@link UniformNode} and manage them as a uniform buffer.
 *
 * @augments Node
 */
class UniformGroupBaseNode extends Node {

	static get type() {

		return 'UniformGroupBaseNode';

	}

	/**
	 * Constructs a new uniform group base node.
	 *
	 * @param {boolean} [shared=false] - Whether this uniform group node is shared or not.
	 * @param {number} [order=1] - Influences the internal sorting.
	 */
	constructor( shared = false, order = 1 ) {

		super( 'string' );

		/**
		 * Whether this uniform group node is shared or not.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.shared = shared;

		/**
		 * Influences the internal sorting.
		 * TODO: Add details when this property should be changed.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.order = order;

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isUniformGroup = true;

	}

	serialize( data ) {

		super.serialize( data );

		data.version = this.version;
		data.shared = this.shared;

	}

	deserialize( data ) {

		super.deserialize( data );

		this.version = data.version;
		this.shared = data.shared;

	}

}

export default UniformGroupBaseNode;

/**
 * Default uniform group for single uniforms.
 *
 * @type {UniformGroupBaseNode}
 */
export const defaultUniformGroup = /*@__PURE__*/ new UniformGroupBaseNode();