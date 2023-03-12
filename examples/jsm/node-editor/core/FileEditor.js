import { StringInput, Element } from '../../libs/flow.module.js';
import { BaseNode } from './BaseNode.js';
import { arrayBuffer, arrayBufferToBase64, base64ToArrayBuffer } from 'three/nodes';

export class FileEditor extends BaseNode {

	constructor( buffer = null, name = 'File' ) {

		super( 'File', arrayBuffer( buffer ), 250 );

		this.nameInput = new StringInput( name ).setReadOnly( true );

		this.add( new Element().add( this.nameInput ) );

		this.url = null;

	}

	set buffer( arrayBuffer ) {

		this.value.value = arrayBuffer;
		this.url = null;

	}

	get buffer() {

		return this.value.value;

	}

	getURL() {

		if ( this.url === null ) {

			const blob = new Blob( [ this.buffer ], { type: 'application/octet-stream' } );

			this.url = URL.createObjectURL( blob );

		}

		return this.url;

	}

	serialize( data ) {

		super.serialize( data );

		data.buffer = arrayBufferToBase64( this.buffer );
		data.name = this.nameInput.getValue();

	}

	deserialize( data ) {

		super.deserialize( data );

		this.buffer = base64ToArrayBuffer( data.buffer );
		this.nameInput.setValue( data.name );

	}
}
