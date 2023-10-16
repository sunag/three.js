class TSLDecoder {

	constructor() {

	}

	emitFunctionDeclaration( node ) {

		const { name, type } = node;
		let func = `const ${ name } = tslFn( ( ) => {`;

		const layout = { name, type, inputs: [] };

		func += `} ).setLayout( {
	name: '${ name }',
	type: '${ type }',
	inputs: []
} );`;

		console.log( func );

	}

	emit( ast ) {

		console.log( ast );

		for ( const statement of ast.body ) {

			if ( statement.isVariableDeclaration ) {

				console.log( statement );

			} else if ( statement.isFunctionDeclaration ) {

				this.emitFunctionDeclaration( statement );

			}

		}

	}

}

export default TSLDecoder;
