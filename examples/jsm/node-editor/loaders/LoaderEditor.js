import { SelectInput, StringInput, Element, LabelElement } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { FBXLoader } from '../../loaders/FBXLoader.js';

export class LoaderEditor extends BaseNode {

	constructor() {

		const fbxLoader = new FBXLoader();

		super( 'Loader', 1, fbxLoader );

		this.title.setStyle( 'red' );

		this.setWidth( 300 );

		const options = new SelectInput( [
			{ name: 'FBX', value: 'fbox' }
		] );

		const path = new StringInput();

		const url = new StringInput();


		path.setValue( 'models/fbx/' );
		url.setValue( 'stanford-bunny.fbx' );

		this.add( new LabelElement( 'Format' ).add( options ) )
			.add( new LabelElement( 'Path').add( path ) )
			.add( new LabelElement( 'URL').add( url ) );

	}

}
