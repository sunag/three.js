import { NumberInput, LabelElement } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { FloatNode } from '../../renderers/nodes/Nodes.js';

export class FloatEditor extends BaseNode {

	constructor() {

		const node = new FloatNode();

		super( 'Float', 1, node, 250 );

		this.title.setIcon( 'ti ti-box-multiple-1' );

		const field = new NumberInput().onChange( () => {

			node.value = field.getValue();

		} );

		this.add( new LabelElement( 'Value' ).add( field ) );

	}

}
