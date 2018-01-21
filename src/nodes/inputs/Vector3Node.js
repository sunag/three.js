/**
 * @author sunag / http://www.sunag.com.br/
 */
 
import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Vector3 } from '../../math/Vector3.js';
 
function Vector3Node( x, y, z ) {

	InputNode.call( this, 'v3' );

	this.type = 'v3';
	this.value = new Vector3( x, y, z );

};

Vector3Node.prototype = Object.create( InputNode.prototype );
Vector3Node.prototype.constructor = Vector3Node;
Vector3Node.prototype.nodeType = "Vector3";

NodeMaterial.addShortcuts( Vector3Node.prototype, 'value', [ 'x', 'y', 'z' ] );

Vector3Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.x = this.x;
		data.y = this.y;
		data.z = this.z;

	}

	return data;

};

export { Vector3Node };
