import { StringInput, Element, LabelElement } from '../libs/flow.module.js';
import { float, string } from 'three/nodes';

export function exportJSON( object, name ) {

	const json = JSON.stringify( object );

	const a = document.createElement( 'a' );
	const file = new Blob( [ json ], { type: 'text/plain' } );

	a.href = URL.createObjectURL( file );
	a.download = name + '.json';
	a.click();

}

export function disposeScene( scene ) {

	scene.traverse( object => {

		if ( ! object.isMesh ) return;

		object.geometry.dispose();

		if ( object.material.isMaterial ) {

			disposeMaterial( object.material );

		} else {

			for ( const material of object.material ) {

				disposeMaterial( material );

			}

		}

	} );

}

export function disposeMaterial( material )	{

	material.dispose();

	for ( const key of Object.keys( material ) ) {

		const value = material[ key ];

		if ( value && typeof value === 'object' && typeof value.dispose === 'function' ) {

			value.dispose();

		}

	}

}

export const colorLib = {
	Material: '#228b22',
	Object3D: '#ffa500',
	CodeNode: '#ff00ff',
	URL: '#00ffff',
	string: '#ff0000'
};

export function getColorFromType( type ) {

	return colorLib[ type ];

}

export function getTypeFromValue( value ) {

	if ( value && value.isScriptableValueNode ) value = value.value;
	if ( ! value ) return;

	if ( value.isNode && value.nodeType === 'string' ) return 'string';
	if ( value.isNode && value.nodeType === 'ArrayBuffer' ) return 'URL';

	for ( const type of Object.keys( colorLib ).reverse() ) {

		if ( value[ 'is' + type ] === true ) return type;

	}

}

export function getColorFromValue( value ) {

	const type = getTypeFromValue( value );

	return getColorFromType( type );

}

export const inputLib = {
	string: StringInput
};

export function createElementFromJSON( json ) {

	const { inputType, nullable } = json;

	const id = json.id || json.name;
	const element = json.name ? new LabelElement( json.name ) : new Element();
	const field = nullable !== true && json.field !== false;

	//

	let node = null;

	if ( nullable !== true ) {

		if ( inputType === 'node' ) {

			node = float();

		} else if ( inputType === 'string' ) {

			node = string();

		}

	}

	element.value = node;

	//

	let input = null;

	if ( json.height ) element.setHeight( json.height );

	if ( inputType ) {

		if ( field && inputLib[ inputType ] ) {

			input = new inputLib[ inputType ]();

			if ( inputType === 'string' ) {

				input.onChange( () => {

					node.value = input.getValue();

					element.dispatchEvent( new Event( 'changeInput' ) );

				} );

			}

			element.add( input );

		}

		element.onConnect( () => {

			const externalNode = element.getLinkedObject();
			
			element.setEnabledInputs( externalNode === null );

			element.value = externalNode || node;

		} );

	}

	//

	if ( inputType ) {

		element.setInputColor( getColorFromType( inputType ) );
		element.setInput( 1 );

		element.onValid( onValidType( inputType ) );

	}

	return { id, element, node, inputType };

}

/*
export function onValidNode( source, target ) {

	const object = target.getObject();

	if ( ! object || ! object.isNode || object.isCodeNode ) {

		return false;

	}

}
*/

export function isGPUNode( object ) {

	return object && object.isNode === true && object.isCodeNode !== true && object.nodeType !== 'string' && object.nodeType !== 'ArrayBuffer';

}

export const onValidNode = onValidType();

export function onValidType( type = 'Node', node = null ) {

	return ( source, target, stage ) => {

		let object = target.getObject();

		if ( object && object.isScriptableValueNode ) object = object.value;

		if ( object ) {

			let isValid = true;

			if ( type === 'Node' ) {

				isValid = isGPUNode( object );

			} else if ( type === 'string') {

				isValid = object.nodeType === 'string';

			} else if ( type === 'URL') {

				isValid = object.nodeType === 'string' || object.nodeType === 'ArrayBuffer';

			} else if ( object[ 'is' + type ] !== true ) {

				isValid = false;

			}

			if ( isValid === false && node !== null && stage === 'dragged' ) {

				const name = target.node.getName();

				node.editor.tips.error( `"${name}" is not a ${type}.` );

			}

			return isValid;

		}

	};

}

