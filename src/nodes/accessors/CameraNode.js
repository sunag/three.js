/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TempNode } from '../core/TempNode.js';
import { FunctionNode } from '../core/FunctionNode.js';
 
function CameraNode( scope, camera ) {

	TempNode.call( this, 'v3' );

	this.setScope( scope || CameraNode.POSITION );
	this.setCamera( camera );

};

CameraNode.fDepthColor = new FunctionNode( [
	"float depthColor( float mNear, float mFar ) {",
	"	#ifdef USE_LOGDEPTHBUF_EXT",
	"		float depth = gl_FragDepthEXT / gl_FragCoord.w;",
	"	#else",
	"		float depth = gl_FragCoord.z / gl_FragCoord.w;",
	"	#endif",
	"	return 1.0 - smoothstep( mNear, mFar, depth );",
	"}"
].join( "\n" ) );

CameraNode.POSITION = 'position';
CameraNode.DEPTH = 'depth';
CameraNode.TO_VERTEX = 'toVertex';

CameraNode.prototype = Object.create( TempNode.prototype );
CameraNode.prototype.constructor = CameraNode;
CameraNode.prototype.nodeType = "Camera";

CameraNode.prototype.setCamera = function ( camera ) {

	this.camera = camera;
	this.updateFrame = camera !== undefined ? this.onUpdateFrame : undefined;

};

CameraNode.prototype.setScope = function ( scope ) {

	switch ( this.scope ) {

		case CameraNode.DEPTH:

			delete this.near;
			delete this.far;

			break;

	}

	this.scope = scope;

	switch ( scope ) {

		case CameraNode.DEPTH:

			var camera = this.camera;

			this.near = new FloatNode( camera ? camera.near : 1 );
			this.far = new FloatNode( camera ? camera.far : 1200 );

			break;

	}

};

CameraNode.prototype.getType = function ( builder ) {

	switch ( this.scope ) {

		case CameraNode.DEPTH:
			return 'fv1';

	}

	return this.type;

};

CameraNode.prototype.isUnique = function ( builder ) {

	switch ( this.scope ) {

		case CameraNode.DEPTH:
		case CameraNode.TO_VERTEX:
			return true;

	}

	return false;

};

CameraNode.prototype.isShared = function ( builder ) {

	switch ( this.scope ) {

		case CameraNode.POSITION:
			return false;

	}

	return true;

};

CameraNode.prototype.generate = function ( builder, output ) {

	var material = builder.material;
	var result;

	switch ( this.scope ) {

		case CameraNode.POSITION:

			result = 'cameraPosition';

			break;

		case CameraNode.DEPTH:

			var func = CameraNode.fDepthColor;

			builder.include( func );

			result = func.name + '(' + this.near.build( builder, 'fv1' ) + ',' + this.far.build( builder, 'fv1' ) + ')';

			break;

		case CameraNode.TO_VERTEX:

			result = 'normalize( ' + new PositionNode( PositionNode.WORLD ).build( builder, 'v3' ) + ' - cameraPosition )';

			break;

	}

	return builder.format( result, this.getType( builder ), output );

};

CameraNode.prototype.onUpdateFrame = function ( delta ) {

	switch ( this.scope ) {

		case CameraNode.DEPTH:

			var camera = this.camera;

			this.near.number = camera.near;
			this.far.number = camera.far;

			break;

	}

};

CameraNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.scope = this.scope;

		if ( this.camera ) data.camera = this.camera.uuid;

		switch ( this.scope ) {

			case CameraNode.DEPTH:

				data.near = this.near.number;
				data.far = this.far.number;

				break;

		}

	}

	return data;

};

export { CameraNode };
