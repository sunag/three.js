let _id = 0;

class NodeHandler {

	constructor() {

		this.id = _id ++;

		this.handlers = {};

		this.version = 0;

	}

	set needsUpdate( value ) {

		if ( value === true ) {

			this.version ++;

		}

	}

	has( name ) {

		return this.handlers[ name ] !== undefined;

	}

	onHandle( name, callback ) {

		this.handlers[ name ] || ( this.handlers[ name ] = new Set() );
		this.handlers[ name ].add( callback );

		return this;

	}

	handle( name, node, builder ) {

		const callbacks = this.handlers[ name ];

		if ( callbacks !== undefined ) {

			for ( const callback of callbacks ) {

				node = callback( node, builder );

			}

		}

		return node;

	}

}

export default NodeHandler;