/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TempNode } from '../core/TempNode.js';

function ColorsNode( index ) {

	TempNode.call( this, 'v4', { unique: true } );

	this.index = index || 0;

}

ColorsNode.prototype = Object.create( TempNode.prototype );
ColorsNode.prototype.constructor = ColorsNode;
ColorsNode.prototype.nodeType = "Colors";

ColorsNode.prototype.generate = function ( builder, output ) {

	var needId = this.index > 0;
	var offsetName = needId ? this.index + 1 : '';

	var vertexName = `color${offsetName}`;
	var fragmentName = `vColor${offsetName}`;

	if ( ! builder.analyzing ) {

		if ( needId ) builder.addVertexParsCode( `attribute vec4 ${vertexName};` );

		builder.addVaryCode( `varying vec4 ${fragmentName};` );

		builder.addVertexFinalCode( `${fragmentName} = ${vertexName};` );

	}

	var result = builder.isShader( 'vertex' ) ? vertexName : fragmentName;

	return builder.format( result, this.getType( builder ), output );

};

ColorsNode.prototype.copy = function ( source ) {

	TempNode.prototype.copy.call( this, source );

	this.index = source.index;

	return this;

};

ColorsNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.index = this.index;

	}

	return data;

};

export { ColorsNode };
