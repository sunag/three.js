let _id = 0;

/**
 * Class for managing NodeMaterial inputs and their callbacks.
 */
class NodeHandler {

    /**
     * Creates a new NodeHandler instance.
     */
    constructor() {

        /**
         * Unique identifier for the handler.
		 *
         * @type {number}
         */
        this.id = _id ++;

        /**
         * Stores handler callbacks by name.
		 *
         * @type {Object.<string, Set<Function>>}
         */
        this.handlers = {};

        /**
         * Version counter, incremented when needsUpdate is set to true.
		 *
         * @type {number}
         */
        this.version = 0;

    }

    /**
     * Sets the needsUpdate flag. Increments version if true.
	 *
     * @param {boolean} value
     */
    set needsUpdate( value ) {

        if ( value === true ) {

            this.version ++;

        }

    }

    /**
     * Checks if a handler exists for the given name.
	 *
     * @param {string} name - The name of the handler to check.
     * @returns {boolean}
     */
    has( name ) {

        return this.handlers[ name ] !== undefined;

    }

    /**
     * Registers a callback for a given handler name.
	 *
     * @param {string} name
     * @param {Function} callback
     * @returns {NodeHandler} Returns itself for chaining.
     */
    onHandle( name, callback ) {

        this.handlers[ name ] || ( this.handlers[ name ] = new Set() );
        this.handlers[ name ].add( callback );

        return this;

    }

    /**
     * Executes all callbacks for a given handler name.
	 *
     * @param {string} name
     * @param {?Node} node - The node to process.
     * @param {NodeBuilder} builder - The current node builder.
     * @returns {?node} The result after all callbacks have been applied.
     */
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
