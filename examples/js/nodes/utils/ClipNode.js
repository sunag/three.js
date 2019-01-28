/**
 * @author sunag / http://www.sunag.com.br/
 */

import { Node } from '../core/Node.js';

function ClipNode( value, threshold, output ) {

	Node.call( this );

	this.value = value;
	this.threshold = threshold;
	this.output = output;
	this.conditional = "<=";

}

ClipNode.prototype = Object.create( Node.prototype );
ClipNode.prototype.constructor = ClipNode;
ClipNode.prototype.nodeType = "Clip";

ClipNode.prototype.getType = function ( builder ) {

	return this.output.getType( builder );

};

ClipNode.prototype.generate = function ( builder, output ) {

	var testValue = this.value.build( builder, 'f' );
	var thresholdValue = this.threshold.build( builder, 'f' );

	var clipCode = "if ( " + testValue + " " + this.conditional + " " + thresholdValue + " ) discard;"

	// clip
	builder.addNodeCode( clipCode );

	return this.output.build( builder, output );

};

ClipNode.prototype.copy = function ( source ) {

	Node.prototype.copy.call( this, source );

	this.value = source.value;
	this.threshold = source.threshold;

};

ClipNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.value = this.value.toJSON( meta ).uuid;
		data.threshold = this.threshold.toJSON( meta ).uuid;

		//if ( this.value ) data.value = this.value.toJSON( meta ).uuid;

	}

	return data;

};

export { ClipNode };
