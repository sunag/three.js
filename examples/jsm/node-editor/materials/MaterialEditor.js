import { BaseNode } from '../core/BaseNode.js';

export class MaterialEditor extends BaseNode {

	constructor( name, material, width = 300 ) {

		super( name, material, width );

	}

	get material() {

		return this.value;

	}

}
