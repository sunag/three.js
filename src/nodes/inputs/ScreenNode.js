/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TextureNode } from './TextureNode.js';
import { InputNode } from '../core/InputNode.js';
 
function ScreenNode( coord ) {

	TextureNode.call( this, undefined, coord );

};

ScreenNode.prototype = Object.create( TextureNode.prototype );
ScreenNode.prototype.constructor = ScreenNode;
ScreenNode.prototype.nodeType = "Screen";

ScreenNode.prototype.isUnique = function () {

	return true;

};

ScreenNode.prototype.getTexture = function ( builder, output ) {

	return InputNode.prototype.generate.call( this, builder, output, this.getUuid(), 't', 'renderTexture' );

};
