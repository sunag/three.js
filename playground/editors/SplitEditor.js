import { SelectInput, Element } from 'flow';
import { BaseNodeEditor } from '../BaseNodeEditor.js';
import { SplitNode, UniformNode } from 'three/nodes';

const NULL_VALUE = new UniformNode( 0 );

export class SplitEditor extends BaseNodeEditor {

	constructor() {

		const node = new SplitNode( NULL_VALUE, 'x' );

		super( 'Split', node, 175 );

		const componentsField = new SelectInput( [
			{ name: 'X | R', value: 'x' },
			{ name: 'Y | G', value: 'y' },
			{ name: 'Z | B', value: 'z' },
			{ name: 'W | A', value: 'w' }
		], node.components ).onChange( () => {

			node.components = componentsField.getValue();

			this.invalidate();

		} );

		const componentsElement = new Element().add( componentsField ).setInput( 1 )
			.onConnect( () => {

				node.node = componentsElement.getLinkedObject() || NULL_VALUE;

			} );

		this.add( componentsElement );

	}

}