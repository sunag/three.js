import { StringInput, Element } from '../../libs/flow.module.js';
import { BaseNode } from './BaseNode.js';
import { string } from 'three/nodes';

/*
function isURL( uri ) {

	const pattern = new RegExp( '^((ft|htt)ps?:\\/\\/)?' + // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		'(\\:\\d+)?' + // port
		'(\\/[-a-z\\d%@_.~+&:]*)*' + // path
		'(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
		'(\\#[-a-z\\d_]*)?$', 'i' ); // fragment locator

	return pattern.test( uri );

}
*/

export class StringEditor extends BaseNode {

	constructor() {

		const stringNode = string();

		super( 'String', stringNode, 350 );

		const stringInput = new StringInput().onChange( () => {

			const input = stringInput.getValue();

			if ( input !== stringNode.value ) {

				stringNode.value = input;

				this.invalidate();

			}

		} );

		this.add( new Element().add( stringInput ) );

	}

	get stringNode() {

		return this.value;

	}

	getURL() {

		return this.stringNode.value;

	}

}
