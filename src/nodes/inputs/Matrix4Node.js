/**
 * @author sunag / http://www.sunag.com.br/
 */

import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Matrix4 } from '../../math/Matrix4.js';
 
function Matrix4Node( matrix ) {

	InputNode.call( this, 'm4' );

	this.value = matrix || new Matrix4();

};

Matrix4Node.prototype = Object.create( InputNode.prototype );
Matrix4Node.prototype.constructor = Matrix4Node;
Matrix4Node.prototype.nodeType = "Matrix4";

NodeMaterial.addShortcuts( Matrix4Node.prototype, 'value', [ 'elements' ] );

Matrix4Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.elements = this.value.elements.concat();

	}

	return data;

};

export { Matrix4Node };