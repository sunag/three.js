import UniformBaseNode from './UniformBaseNode.js';
import { objectGroup } from './UniformGroupNode.js';
import { getConstNodeType } from '../tsl/TSLCore.js';
import { getValueFromType } from './NodeUtils.js';

/**
 * Class for representing a uniform.
 *
 * @augments UniformBaseNode
 */
class UniformNode extends UniformBaseNode {

	static get type() {

		return 'UniformNode';

	}

	/**
	 * Constructs a new uniform node.
	 *
	 * @param {any} value - The value of this node. Usually a JS primitive or three.js object (vector, matrix, color, texture).
	 * @param {?string} nodeType - The node type. If no explicit type is defined, the node tries to derive the type from its value.
	 */
	constructor( value, nodeType = null ) {

		super( value, nodeType );

		/**
		 * The uniform group of this uniform.
		 *
		 * @type {UniformGroupNode}
		 */
		this.groupNode = objectGroup;

	}

	/**
	 * Returns the {@link UniformNode#groupNode}.
	 *
	 * @return {UniformGroupNode} The uniform group.
	 */
	getGroup() {

		return this.groupNode;

	}

}

export default UniformNode;

/**
 * TSL function for creating a uniform node.
 *
 * @tsl
 * @function
 * @param {any|string} value - The value of this uniform or your type. Usually a JS primitive or three.js object (vector, matrix, color, texture).
 * @param {string} [type] - The node type. If no explicit type is defined, the node tries to derive the type from its value.
 * @returns {UniformNode}
 */
export const uniform = ( value, type ) => {

	const nodeType = getConstNodeType( type || value );

	if ( nodeType === value ) {

		// if the value is a type but no having a value

		value = getValueFromType( nodeType );

	}

	if ( value && value.isNode === true ) {

		let v = value.value;

		value.traverse( n => {

			if ( n.isConstNode === true ) {

				v = n.value;

			}

		} );

		value = v;

	}

	return new UniformNode( value, nodeType );

};
