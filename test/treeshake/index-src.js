import * as THREE from '../../src/Three.js';
import WebGPURenderer from '../../examples/jsm/renderers/webgpu/WebGPURenderer.js';
import Renderer from '../../examples/jsm/renderers/common/Renderer.js';
import { vec3 } from '../../examples/jsm/nodes/shadernode/ShaderNode.js';

let camera, scene, renderer;

init();

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );

	scene = new THREE.Scene();
	scene.node = vec3( 1, 0, 0 ).texture();

	//renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer = new Renderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animation );
	document.body.appendChild( renderer.domElement );

}

function animation( ) {

	renderer.render( scene, camera );

}
