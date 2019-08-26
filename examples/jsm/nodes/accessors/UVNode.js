/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TempNode } from '../core/TempNode.js';
import { NodeLib } from '../core/NodeLib.js';

function UVNode( index ) {

	TempNode.call( this, 'v2', { unique: true } );

	this.index = index || 0;

}

UVNode.prototype = Object.create( TempNode.prototype );
UVNode.prototype.constructor = UVNode;
UVNode.prototype.nodeType = "UV";

UVNode.prototype.generate = function ( builder, output ) {

	var needId = this.index > 0;
	var offsetName = needId ? this.index + 1 : '';

	var vertexName = `uv${offsetName}`;
	var fragmentName = `vUv${offsetName}`;

	if ( ! builder.analyzing ) {

		if ( needId ) builder.addVertexParsCode( `attribute vec2 ${vertexName};` );

		builder.addVaryCode( `varying vec2 ${fragmentName};` );

		builder.addVertexFinalCode( `${fragmentName} = ${vertexName};` );

	}

	var result = builder.isShader( 'vertex' ) ? vertexName : fragmentName;
console.log( builder.analyzing, result, builder.shader );
	return builder.format( result, this.getType( builder ), output );

};

UVNode.prototype.copy = function ( source ) {

	TempNode.prototype.copy.call( this, source );

	this.index = source.index;

	return this;

};

UVNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.index = this.index;

	}

	return data;

};

NodeLib.addKeyword( 'uv', function () {

	return new UVNode();

} );

NodeLib.addKeyword( 'uv2', function () {

	return new UVNode( 1 );

} );

export { UVNode };
