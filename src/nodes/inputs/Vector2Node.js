/**
 * @author sunag / http://www.sunag.com.br/
 */
 
import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Vector2 } from '../../math/Vector2.js';

function Vector2Node( x, y ) {

	InputNode.call( this, 'v2' );

	this.value = new Vector2( x, y );

};

Vector2Node.prototype = Object.create( InputNode.prototype );
Vector2Node.prototype.constructor = Vector2Node;
Vector2Node.prototype.nodeType = "Vector2";

NodeMaterial.addShortcuts( Vector2Node.prototype, 'value', [ 'x', 'y' ] );

Vector2Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.x = this.x;
		data.y = this.y;

	}

	return data;

};

export { Vector2Node };
