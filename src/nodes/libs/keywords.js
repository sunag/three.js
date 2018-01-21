import { NodeLib } from '../core/NodeLib.js';
import { UVNode } from '../accessors/UVNode.js';
import { PositionNode } from '../accessors/PositionNode.js';
import { NormalNode } from '../accessors/NormalNode.js';
import { TimerNode } from '../utils/TimerNode.js';

// UV 1

NodeLib.addKeyword( 'uv', function () {

	return new UVNode();

} );

// UV 2

NodeLib.addKeyword( 'uv2', function () {

	return new UVNode( 1 );

} );

// Local Position

NodeLib.addKeyword( 'position', function () {

	return new PositionNode();

} );

// World Position

NodeLib.addKeyword( 'worldPosition', function () {

	return new PositionNode( PositionNode.WORLD );

} );

// Local Normal

NodeLib.addKeyword( 'normal', function () {

	return new NormalNode();

} );

// World Normal

NodeLib.addKeyword( 'worldNormal', function () {

	return new NormalNode( NormalNode.WORLD );

} );

// View Position

NodeLib.addKeyword( 'viewPosition', function () {

	return new PositionNode( NormalNode.VIEW );

} );

// View Normal

NodeLib.addKeyword( 'viewNormal', function () {

	return new NormalNode( NormalNode.VIEW );

} );

// Global Timer

NodeLib.addKeyword( 'time', function () {

	return new TimerNode();

} );