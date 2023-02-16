import { LabelElement, NumberInput } from '../../libs/flow.module.js';
import { uniform } from 'three/nodes';
import { BaseNode } from '../core/BaseNode.js';
import * as Nodes from 'three/nodes';

const createElementFromProperty = ( node, property ) => {

	const defaultValue = uniform( 0 );
	
	let label = property.label;
	
	if ( label === undefined ) {
		
		label = property.name;
		
		if ( label.endsWith( 'Node' ) === true ) {
			
			label = label.slice( 0, label.length - 4 );
			
		}
		
	}
	
	node[ property.name ] = defaultValue;
	
	const element = new LabelElement( label ).setInput( property.defaultLength || 1 );
	
	if ( property.nodeType === 'float' ) {
		
		element.add( new NumberInput().onChange( ( field ) => {

			defaultValue.value = field.getValue();

		} ) );
		
	}

	element.onConnect( ( elmt ) => {

		elmt.setEnabledInputs( ! elmt.getLinkedObject() );
		
		node[ property.name ] = elmt.getLinkedObject() || defaultValue;

	} );
	
	return element;
	
}

export class CustomNodeEditor extends BaseNode {

	constructor( settings ) {

		const shaderNode = Nodes[ settings.shaderNode ];

		let node = null;
		
		const elements = [];

		if ( settings.properties !== undefined ) {
			
			node = shaderNode();
			
			for( const property of settings.properties ) {
				
				elements.push( createElementFromProperty( node, property ) );
				
			}

		} else {

			node = shaderNode;

		}

		super( settings.name, 1, node, 200 );
		
		this.title.setIcon( 'ti ti-' + settings.icon );

		for(const element of elements) {
			
			this.add( element );
			
		}

	}

}
