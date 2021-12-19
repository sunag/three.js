import { ObjectNode } from '../../libs/flow.module.js';

export class BaseNode extends ObjectNode {

	constructor( name, inputLength, value = null, width = 300 ) {

		const getObjectCallback = ( /*output = null*/ ) => {

			return value;

		};

		super( name, inputLength, getObjectCallback, width );

		this.onValidElement = ( source, target ) => {

			console.log( this.getObject(), target.getObject().isNode );

		};

	}

	add( element ) {

		element.onValid( this.onValidElement );

		return super.add( element );

	}

}
