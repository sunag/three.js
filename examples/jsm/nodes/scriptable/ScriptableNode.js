import * as THREE from 'three';
import * as Nodes from 'three/nodes';

import Node, { addNodeClass } from '../core/Node.js';
import { scriptableValue } from './ScriptableValueNode.js';
import { getNodeChildren } from '../core/NodeUtils.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNode.js';

class Resources extends Map {

	get( key, callback = null, ...params ) {

		if ( this.has( key ) ) return super.get( key );

		if ( callback !== null ) {

			const value = callback( ...params );
			this.set( key, value );
			return value;

		}

	}

}

class Parameters {

	constructor( scriptableNode ) {

		this.scriptableNode = scriptableNode;

	}

	get parameters() {

		return this.scriptableNode.parameters;

	}

	get layout() {
		
		return this.scriptableNode.getLayout();

	}

	getInputLayout( id ) {

		for( const element of this.layout.elements ) {

			if ( element.inputType && ( element.id === id || element.name === id ) ) {

				return element;

			}

		}

	}

	get( name ) {
/*
		const value = this.parameters[ name ];

		if ( value === undefined || value === null ) {

			// @TODO: Add support for default values.

			const inputLayout = this.getInputLayout( name );

			const { defaultValue } = inputLayout;
			if ( defaultValue === 'node' ) return Nodes.float();

		}
*/
		const value = this.parameters[ name ].value;
	
		return value;

	}

}

export const global = new Resources();

class ScriptableNode extends Node {

	constructor( codeNode = null, parameters = {} ) {

		super();

		this.codeNode = codeNode;
		this.parameters = parameters;
		this.local = new Resources();

		this._output = scriptableValue();
		this._output.isScriptableOutputNode = true;
		this._source = this.source;
		this._method = null;
		this._object = null;
		this._value = null;
		this._needsOutputUpdate = true;

		this.onRefresh = this.onRefresh.bind( this );

		this.isScriptableNode = true;
		
	}

	get source() {

		return this.codeNode ? this.codeNode.code : '';

	}

	onRefresh() {

		this.needsUpdate = true;

		this.getOutput();

	}

	setParameter( name, value ) {

		const parameters = this.parameters;

		if ( value && value.isScriptableValueNode ) {

			this.deleteParameter( name );

			parameters[ name ] = value;
			parameters[ name ].addEventListener( 'refresh', this.onRefresh );

		} else if ( parameters[ name ] === undefined ) {

			parameters[ name ] = scriptableValue( value );
			parameters[ name ].addEventListener( 'refresh', this.onRefresh );

		} else {

			parameters[ name ].value = value;

		}

		return this;

	}

	getParameter( name ) {

		return this.parameters[ name ];

	}

	deleteParameter( name ) {

		if ( this.parameters[ name ] ) {

			this.parameters[ name ].removeEventListener( 'refresh', this.onRefresh );

			delete this.parameters[ name ];

		}

		return this;

	}

	clearParameters() {

		for ( const name of Object.keys( this.parameters ) ) {

			this.deleteParameter( name );

		}

		this.needsUpdate = true;

		return this;

	}

	call( name, ...params ) {

		const object = this.getObject();
		const method = object[ name ];

		if ( typeof method === 'function' ) {

			return method( ...params );

		}

	}

	async callAsync( name, ...params ) {

		const object = this.getObject();
		const method = object[ name ];

		if ( typeof method === 'function' ) {

			return method.constructor.name === 'AsyncFunction' ? await method( ...params ) : method( ...params );

		}

	}

	getNodeType( builder ) {

		return this.getOutputNode().getNodeType( builder );

	}

	getObject() {

		if ( this.needsUpdate ) this.dispose();
		if ( this._object !== null ) return this._object;

		//

		const refresh = () => {

			this._output.dispatchEvent( { type: 'refresh' } );

		};

		const parameters = new Parameters( this );

		const method = this.getMethod( this.codeNode );
		const params = [ parameters, this.local, global, refresh, THREE, Nodes ];

		this._object = method( ...params );

		return this._object;

	}

	getLayout() {

		return this.getObject().layout;

	}

	getOutputNode() {

		const output = this.getOutput().value;

		if ( output && output.isNode ) {

			return output;

		}

		return float();

	}

	getOutput()	{

		if ( this._needsOutputUpdate === true ) {

			this._value = this.call( 'output' );

			this._needsOutputUpdate = false;

		}

		this._output.value = this._value;

		return this._output;

	}

	getMethod() {

		if ( this.needsUpdate ) this.dispose();
		if ( this._method !== null ) return this._method;

		//

		const parametersProps = [ 'parameters', 'local', 'global', 'refresh', 'THREE', 'TSL' ];
		const interfaceProps = [ 'layout', 'init', 'output', 'dispose' ];

		const properties = interfaceProps.join( ', ' );
		const declarations = 'var ' + properties + ';\n';
		const returns = '\nreturn { ' + properties + ' };';

		const code = declarations + this.codeNode.code + returns;

		//

		this._method = new Function( ...parametersProps, code );

		return this._method;

	}

	dispose() {

		if ( this._method === null ) return;

		if ( this._object && typeof this._object.dispose === 'function' ) {

			this._object.dispose();

		}

		this._method = null;
		this._object = null;
		this._source = null;
		this._value = null;
		this._needsOutputUpdate = true;
		this._output.value = null;

	}

	construct() {

		return this.getOutputNode();

	}

	getSerializeChildren() {

		return getNodeChildren( this, true );

	}

	set needsUpdate( value ) {

		if ( value === true ) this.dispose();

	}

	get needsUpdate() {

		return this.source !== this._source;

	}

}

export default ScriptableNode;

export const scriptable = nodeProxy( ScriptableNode );

addNodeElement( 'scriptable', scriptable );

addNodeClass( ScriptableNode );
