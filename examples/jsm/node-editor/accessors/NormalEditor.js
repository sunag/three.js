import { SelectInput, Element } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { NormalNode } from 'three/nodes';

export class NormalEditor extends BaseNode {

	constructor() {

		const node = new NormalNode();

		super( 'Normal', node, 200 );

		this.setOutputLength( 3 );

		const optionsField = new SelectInput( [
			{ name: 'Local', value: NormalNode.LOCAL },
			{ name: 'World', value: NormalNode.WORLD },
			{ name: 'View', value: NormalNode.VIEW },
			{ name: 'Geometry', value: NormalNode.GEOMETRY }
		], NormalNode.LOCAL ).onChange( () => {

			node.scope = optionsField.getValue();

			this.invalidate();

		} );

		this.add( new Element().add( optionsField ) );

	}

}
