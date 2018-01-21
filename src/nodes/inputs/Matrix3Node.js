/**
 * @author sunag / http://www.sunag.com.br/
 */

import { InputNode } from '../core/InputNode.js';
import { NodeMaterial } from '../core/NodeMaterial.js';
import { Matrix3 } from '../../math/Matrix3.js';
 
function Matrix3Node( matrix ) {

	InputNode.call( this, 'm3' );

	this.value = matrix || new Matrix3();

};

Matrix3Node.prototype = Object.create( InputNode.prototype );
Matrix3Node.prototype.constructor = Matrix3Node;
Matrix3Node.prototype.nodeType = "Matrix3";

NodeMaterial.addShortcuts( Matrix3Node.prototype, 'value', [ 'elements' ] );

Matrix3Node.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.elements = this.value.elements.concat();

	}

	return data;

};

export { Matrix3Node };