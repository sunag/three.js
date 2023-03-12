import { BaseNode } from './BaseNode.js';
import { Element, LabelElement, StringInput } from '../../libs/flow.module.js';
import { ScriptableObject, scriptable, code } from 'three/nodes';

const inputLib = {
    string: StringInput
};

const code2 = `
const { GLTFLoader } = await import( 'three/addons/loaders/GLTFLoader.js' );

const loader = new GLTFLoader().setPath( 'models/gltf/DamagedHelmet/glTF/' );
const gltf = await loader.loadAsync( 'DamagedHelmet.gltf' );

const scene = gltf.scene;

addOutput( 'Scene', scene );

//setDefaultOutput( scene );
`;

const code3 = `
let object3d = new THREE.Object3D();
let filter = '';

const refresh = () => {

	const founded = object3d.getObjectByName( filter );

	setOutput( 'Output', founded );

}

addInput( 'Object', 'Object3D', ( value ) => {

	object3d = value;

	refresh();

} );

addInput( 'Object', 'string', ( value ) => {

	filter = value;

	refresh();

} );

// name, type
//addOutput( 'Output', 'Material' );
addOutput( 'Output', 'Object3D' );
`;

const source = `
layout = {
    name: "Get Material",
    width: 500,
    elements: [
        { name: 'Name', inputType: 'string' },
        { name: 'Target', type: 'Object3D' },
        { id: 'Code', inputType: 'JavaScript', height: 500 }
    ],
    output: { type: 'Material' }
}

refresh = () => {

    const filter = getInput( 'Name' );
    const target = getInput( 'Target' );

    let founded = null;

    if ( target ) {

        founded = target.getObjectByName( filter );

    }

    return founded;

}
`;

export class ScriptableBaseNode extends BaseNode {

	constructor() {

		const scriptableObject = new ScriptableObject();

		super( 'Scriptable', 0, scriptableObject, 300 );

		this.scriptableObject = scriptableObject;

		this.scriptableElements = {};

		this.setSource( source );

	}

    setSource( source ) {

        this.scriptableObject.scriptableNodes = [ code( source ).scriptable() ]

        this.updateScript();

        return this;

    }

    getScriptable() {

        return this.scriptableObject.scriptableNodes[ 0 ];

    }

    getObject() {

        return this.getScriptable().getObject();

    }

	updateScript() {

		const object = this.getObject()

		this.updateStyle( object.layout );

	}

	clearElements() {

		while ( this.elements.length > 1 ) {

			this.remove( this.elements[ this.elements.length - 1 ] );

		}

	}

	addElement( data ) {

        const id = data.id || data.name;
		const element = data.name ? new LabelElement( data.name ) : new Element();
        
        let input = null;

        if ( data.height ) element.setHeight( data.height );

		if ( data.inputType ) {

            if ( data.inputType === 'JavaScript' ) {

                const editorDOM = document.createElement( 'div' );
                editorDOM.style.width = '100%';
                editorDOM.style.height = '100%';
                element.dom.appendChild( editorDOM );

                window.require.config( { paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } } );
        
                require( [ 'vs/editor/editor.main' ], () => {
        
                    const editor = window.monaco.editor.create( editorDOM, {
                        value: source,
                        language: 'javascript',
                        theme: 'vs-dark',
                        automaticLayout: true
                    } );

                    editor.getModel().onDidChangeContent( (e) => {

                        console.log( editor.getValue() );

                    } );
        
                } );

                this.setResizable( true );

            } else if ( inputLib[ data.inputType ] ) {

                input = new inputLib[ data.inputType ]();
                element.add( input );

            }

		}

		this.add( element );

        //

        const currentScriptable = this.getScriptable();

        element.setInput( 1 ).onConnect( () => {
            
			currentScriptable.call( 'refresh' )

		} );

        this.scriptableElements[ id ] = { data, input };

		return this;

	}

	updateStyle( layout = null ) {

        this.setName( 'Scriptable' );
        this.setResizable( false );
        this.setWidth( 300 );

		this.clearElements();

		if ( layout ) {

			if ( layout.name ) {

				this.setName( layout.name );

			}

            if ( layout.width ) {

				this.setWidth( layout.width );

			}

			if ( layout.elements ) {

				for ( const element of layout.elements ) {

					this.addElement( element );

				}

			}

			if ( layout.output ) {

				this.setOutputLength( layout.output.type ? 1 : 0 );

			}

		}

	}

}
