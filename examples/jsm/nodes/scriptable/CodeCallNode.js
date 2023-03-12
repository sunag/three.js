import Node from '../core/Node.js';

class CodeCallNode extends Node {

	constructor( codeNode = null, parameters = {} ) {

		super();

		this.codeNode = codeNode;
		this.parameters = parameters;

		this._method = null;
		this._object = null;

	}

	call( name, ...params ) {

		const behaviorObject = this.getObject( codeNode );

		if ( typeof behaviorObject[ name ] === 'function' ) {

			return behaviorObject[ name ]( ...params );

		}

	}

	getObject() {

		if ( this._object !== null ) return this._object;
		
		//

		const method = this.getMethod( codeNode );
		const params = [ this.parameters ];

		this._object = method( ...params );

		return this._object;

	}

	getMethod() {

		if ( this._method !== null ) return this._method;
		
		//

		const parametersProps = [ 'container', 'inputs' ];
		const interfaceProps = [ 'layout', 'refresh' ];

		const properties = interfaceProps.join( ', ' );
		const declarations = 'var ' + properties + ';\n';
		const returns = '\nreturn { ' + properties + ' };';

		const code = declarations + codeNode.code + returns;

		const funcClass = /await/.test( code ) ? AsyncFunction : Function;

		//

		this._method = new funcClass( ...parametersProps, code );

		return this._method;

	}
	
	setParameters( parameters ) {

		this.parameters = parameters;

		return this;

	}

	getParameters() {

		return this.parameters;

	}

	set needsUpdate( value ) {

		if ( value === true ) {
			
			this._method = null;
			this._object = null;

		}

	}

	get needsUpdate() {

		return this._method !== null;

	}

}

export default CodeCallNode;
