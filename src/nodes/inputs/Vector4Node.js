/**
 * @author sunag / http://www.sunag.com.br/
 */

import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Vector4 } from '../../math/Vector4.js';
 
function Vector4Node( x, y, z, w ) {

	InputNode.call( this, 'v4' );

	this.value = new Vector4( x, y, z, w );

};

Vector4Node.prototype = Object.create( InputNode.prototype );
Vector4Node.prototype.constructor = Vector4Node;
Vector4Node.prototype.nodeType = "Vector4";

NodeMaterial.addShortcuts( Vector4Node.prototype, 'value', [ 'x', 'y', 'z', 'w' ] );

Vector4Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.x = this.x;
		data.y = this.y;
		data.z = this.z;
		data.w = this.w;

	}

	return data;

};

export { Vector4Node };
