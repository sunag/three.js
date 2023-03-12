import { LabelElement, ToggleInput, SelectInput } from '../../libs/flow.module.js';
import { BaseNode } from '../core/BaseNode.js';
import { onValidNode, onValidType, getColorFromType } from '../NodeEditorUtils.js';
import { TextureNode, UVNode } from 'three/nodes';
import { Texture, TextureLoader, RepeatWrapping, ClampToEdgeWrapping, MirroredRepeatWrapping } from 'three';

const textureLoader = new TextureLoader();
const defaultTexture = new Texture();
const defaultUV = new UVNode();

const getTexture = ( url ) => {

	return textureLoader.load( url );

};

export class TextureEditor extends BaseNode {

	constructor() {

		const node = new TextureNode( defaultTexture );

		super( 'Texture', node, 250 );

		this.setOutputLength( 4 );

		this.texture = null;

		this._initFile();
		this._initParams();

		this.onValidElement = () => {};

	}

	_initFile() {

		const fileElement = new LabelElement( 'File' ).setInputColor( getColorFromType( 'URL' ) ).setInput( 1 );

		fileElement.onValid( onValidType( 'URL' ) ).onConnect( () => {

			const textureNode = this.value;
			const fileEditorElement = fileElement.getLinkedElement();

			this.texture = fileEditorElement ? getTexture( fileEditorElement.node.getURL() ) : null;

			textureNode.value = this.texture || defaultTexture;

			this.update();

		}, true );

		this.add( fileElement );

	}

	_initParams() {

		const uvField = new LabelElement( 'UV' ).setInput( 2 );

		uvField.onValid( onValidNode ).onConnect( () => {

			const node = this.value;

			node.uvNode = uvField.getLinkedObject() || defaultUV;

		} );

		this.wrapSInput = new SelectInput( [
			{ name: 'Repeat Wrapping', value: RepeatWrapping },
			{ name: 'Clamp To Edge Wrapping', value: ClampToEdgeWrapping },
			{ name: 'Mirrored Repeat Wrapping', value: MirroredRepeatWrapping }
		], RepeatWrapping ).onChange( () => {

			this.update();

		} );

		this.wrapTInput = new SelectInput( [
			{ name: 'Repeat Wrapping', value: RepeatWrapping },
			{ name: 'Clamp To Edge Wrapping', value: ClampToEdgeWrapping },
			{ name: 'Mirrored Repeat Wrapping', value: MirroredRepeatWrapping }
		], RepeatWrapping ).onChange( () => {

			this.update();

		} );

		this.flipYInput = new ToggleInput( false ).onChange( () => {

			this.update();

		} );

		this.add( uvField )
			.add( new LabelElement( 'Wrap S' ).add( this.wrapSInput ) )
			.add( new LabelElement( 'Wrap T' ).add( this.wrapTInput ) )
			.add( new LabelElement( 'Flip Y' ).add( this.flipYInput ) );

	}

	update() {

		const texture = this.texture;

		if ( texture ) {

			texture.wrapS = Number( this.wrapSInput.getValue() );
			texture.wrapT = Number( this.wrapTInput.getValue() );
			texture.flipY = this.flipYInput.getValue();
			texture.dispose();

			this.invalidate();

		}

	}

}
