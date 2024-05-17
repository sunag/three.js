import * as THREE from '../..';
import { vec3, INFINITY } from '../../examples/jsm/nodes/shadernode/ShaderNode.js';
import WebGPURenderer from '../../examples/jsm/renderers/webgpu/WebGPURenderer.js';

let camera, scene, renderer;

init();

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );

	scene = new THREE.Scene();
	scene.node = vec3( 1, 0, INFINITY ).texture();
	console.log( scene.node, '>>' );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	//renderer = new WebGPURenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animation );
	document.body.appendChild( renderer.domElement );

}

function animation( ) {

	renderer.render( scene, camera );

}
