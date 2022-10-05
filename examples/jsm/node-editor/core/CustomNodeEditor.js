import { Element, LabelElement, NumberInput, SelectInput } from '../../libs/flow.module.js';
import { UniformNode, OperatorNode, add, uniform } from 'three/nodes';
import { BaseNode } from '../core/BaseNode.js';

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
	
	const element = new LabelElement( label ).setInput( property.length || 1 );
	
	element.add( new NumberInput().onChange( ( field ) => {

		defaultValue.value = field.getValue();

	} ) );
	
	element.onConnect( ( elmt ) => {

		elmt.setEnabledInputs( ! elmt.getLinkedObject() );
		
		node[ property.name ] = elmt.getLinkedObject() || defaultValue;

	} );
	
	return element;
	
}

export class CustomNodeEditor extends BaseNode {

	constructor( settings ) {

		let node = null;
		
		const elements = [];

		if ( settings.properties !== undefined ) {
			
			node = settings.shaderNode();
			
			for( const property of settings.properties ) {
				
				elements.push( createElementFromProperty( node, property ) );
				
			}

		}

		super( settings.title, 1, node, 150 );
		
		for(const element of elements) {
			
			this.add( element );
			
		}

	}

}

/*
		const NULL_VALUE = new UniformNode( 0 );

		const node = new OperatorNode( '+', NULL_VALUE, NULL_VALUE );

		super( 'Operator', 1, node, 150 );

		const opInput = new SelectInput( [
			{ name: 'Addition ( + )', value: '+' },
			{ name: 'Subtraction ( - )', value: '-' },
			{ name: 'Multiplication ( * )', value: '*' },
			{ name: 'Division ( / )', value: '/' }
		], '+' );

		opInput.onChange( ( data ) => {

			node.op = data.getValue();

			this.invalidate();

		} );

		const aElement = new LabelElement( 'A' ).setInput( 3 );
		const bElement = new LabelElement( 'B' ).setInput( 3 );


		aElement.add( new NumberInput().onChange( ( field ) => {

			node.aNode.value = field.getValue();

		} ) ).onConnect( ( elmt ) => {

			elmt.setEnabledInputs( ! elmt.getLinkedObject() );
			node.aNode = elmt.getLinkedObject() || NULL_VALUE;

		} );

		bElement.add( new NumberInput().onChange( ( field ) => {

			node.bNode.value = field.getValue();

		} ) ).onConnect( ( elmt ) => {

			elmt.setEnabledInputs( ! elmt.getLinkedObject() );
			node.bNode = elmt.getLinkedObject() || NULL_VALUE;

		} );


		this.add( new Element().add( opInput ) )
			.add( aElement )
			.add( bElement );
*/