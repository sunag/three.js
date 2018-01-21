/**
 * @author sunag / http://www.sunag.com.br/
 */

import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Color } from '../../math/Color.js';
 
function ColorNode( color ) {

	InputNode.call( this, 'c' );

	this.value = new Color( color || 0 );

};

ColorNode.prototype = Object.create( InputNode.prototype );
ColorNode.prototype.constructor = ColorNode;
ColorNode.prototype.nodeType = "Color";

NodeMaterial.addShortcuts( ColorNode.prototype, 'value', [ 'r', 'g', 'b' ] );

ColorNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.r = this.r;
		data.g = this.g;
		data.b = this.b;

	}

	return data;

};

export { ColorNode };