import { LabelElement } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { MathNode, UniformNode } from 'three/nodes';

const NULL_VALUE = new UniformNode( 0 );
const ONE_VALUE = new UniformNode( 1 );

export class BlendEditor extends BaseNode {

	constructor() {

		const node = new MathNode( MathNode.MIX, NULL_VALUE, NULL_VALUE, ONE_VALUE );

		super( 'Blend', node, 200 );

		this.setOutputLength( 3 );

		const aElement = new LabelElement( 'Base' ).setInput( 3 );
		const bElement = new LabelElement( 'Blend' ).setInput( 3 );
		const cElement = new LabelElement( 'Opacity' ).setInput( 1 );

		aElement.onConnect( () => {

			node.aNode = aElement.getLinkedObject() || NULL_VALUE;

		} );

		bElement.onConnect( () => {

			node.bNode = bElement.getLinkedObject() || NULL_VALUE;

		} );

		cElement.onConnect( () => {

			node.cNode = cElement.getLinkedObject() || ONE_VALUE;

		} );

		this.add( aElement )
			.add( bElement )
			.add( cElement );

	}

}
