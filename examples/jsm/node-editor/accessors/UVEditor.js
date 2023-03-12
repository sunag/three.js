import { SelectInput, LabelElement } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { UVNode } from 'three/nodes';

export class UVEditor extends BaseNode {

	constructor() {

		const node = new UVNode();

		super( 'UV', node, 200 );

		this.setOutputLength( 2 );

		const optionsField = new SelectInput( [ '1', '2' ], 0 ).onChange( () => {

			node.index = Number( optionsField.getValue() );

			this.invalidate();

		} );

		this.add( new LabelElement( 'Channel' ).add( optionsField ) );

	}

}
