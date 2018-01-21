/**
 * @author sunag / http://www.sunag.com.br/
 */

import { InputNode } from '../core/InputNode.js';
 
function FloatNode( value ) {

	InputNode.call( this, 'fv1' );

	this.value = [ value || 0 ];

};

FloatNode.prototype = Object.create( InputNode.prototype );
FloatNode.prototype.constructor = FloatNode;
FloatNode.prototype.nodeType = "Float";

Object.defineProperties( FloatNode.prototype, {
	number: {
		get: function () {

			return this.value[ 0 ];

		},
		set: function ( val ) {

			this.value[ 0 ] = val;

		}
	}
} );

FloatNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.number = this.number;

	}

	return data;

};

export { FloatNode };