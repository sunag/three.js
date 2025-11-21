import ContextNode from './ContextNode.js';
import { addMethodChaining } from '../tsl/TSLCore.js';

/**
 * A context node that overrides a target node within a callback function.
 *
 * @augments ContextNode
 */
class OverrideContextNode extends ContextNode {

	static get type() {

		return 'OverrideContextNode';

	}

	constructor( targetNode, callback, flowNode = null ) {

		super( flowNode, {
			overrideNodes: new Map( [[ targetNode, callback ]] )
		} );

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isOverrideContextNode = true;

		/**
		 * A reference to the target node to override.
		 *
		 * @type {Node}
		 */
		this.targetNode = targetNode;

		/**
		 * A callback function that returns the overriding node.
		 *
		 * @type {Function}
		 */
		this.callback = callback;

	}

	/**
	 * Gathers the context data from all parent context nodes.
	 *
	 * @return {Object} The gathered context data.
	 */
	getFlowContextData() {

		const children = [];

		this.traverse( ( node ) => {

			if ( node.isOverrideContextNode === true ) {

				children.push( node.value.overrideNodes );

			}

		} );

		const overrideNodes = new Map( children.flatMap( ( map ) => Array.from( map.entries() ) ) );

		const data = super.getFlowContextData();
		data.overrideNodes = overrideNodes;

		return data;

	}

}

export default OverrideContextNode;

/**
 * Creates an OverrideContextNode that overrides a target node within a callback function.
 *
 * @param {Node} targetNode - The target node to override.
 * @param {Function} callback - A callback function that returns the overriding node.
 * @param {Node} [flowNode=null] - An optional flow node.
 * @return {OverrideContextNode} The created OverrideContextNode.
 */
export function overrideNode( targetNode, callback, flowNode = null ) {

	return new OverrideContextNode( targetNode, callback, flowNode );

}

addMethodChaining( 'overrideNode', ( flowNode, node, callback ) => overrideNode( node, callback, flowNode ) );
