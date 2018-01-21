/**
 * @author sunag / http://www.sunag.com.br/
 */

import { FloatNode } from '../inputs/FloatNode.js';
 
function TimerNode( scope, scale ) {

	FloatNode.call( this );

	this.scope = scope || TimerNode.LOCAL;
	this.scale = scale !== undefined ? scale : 1;

};

TimerNode.LOCAL = 'local';
TimerNode.GLOBAL = 'global';
TimerNode.ENVIRONMENT = 'environment';

TimerNode.prototype = Object.create( FloatNode.prototype );
TimerNode.prototype.constructor = TimerNode;
TimerNode.prototype.nodeType = "Timer";

TimerNode.prototype.updateFrame = function ( delta ) {

	switch( this.scope ) {
		
		case TimerNode.LOCAL:
			
			this.number += delta * this.scale;
			
			break;
		
		case TimerNode.GLOBAL:
			break;
			
		case TimerNode.ENVIRONMENT:
		
			this.number = performance.now() * this.scale;
		
			break;
	}

};

TimerNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.scope = this.scope;
		data.scale = this.scale;

	}

	return data;

};

export { TimerNode };