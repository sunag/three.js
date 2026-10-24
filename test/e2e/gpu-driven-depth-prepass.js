import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { createServer } from '../../utils/server.js';

const server = createServer( { root: fileURLToPath( new URL( '../../', import.meta.url ) ) } );
await new Promise( resolve => server.listen( 0, '127.0.0.1', resolve ) );
const url = `http://127.0.0.1:${ server.address().port }/gpu-driven-depth-prepass`;
const systemChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_EXECUTABLE || ( existsSync( systemChrome ) ? systemChrome : undefined );
let browser;

try {

	browser = await puppeteer.launch( { headless: true, executablePath, args: [ '--enable-unsafe-webgpu' ] } );
	const page = await browser.newPage();
	const errors = [];
	page.on( 'pageerror', error => errors.push( error.message ) );
	page.on( 'console', message => {

		if ( message.type() === 'error' ) errors.push( message.text() );

	} );
	await page.setRequestInterception( true );
	page.on( 'request', request => {

		if ( request.url() === url ) {

			request.respond( {
				contentType: 'text/html',
				body: `<!doctype html><link rel="icon" href="data:,"><script type="importmap">
{"imports":{"three":"/src/Three.WebGPU.js","three/webgpu":"/src/Three.WebGPU.js","three/tsl":"/src/Three.TSL.js","three/addons/":"/examples/jsm/"}}
</script>`
			} );

		} else {

			request.continue();

		}

	} );
	await page.goto( url );

	const result = await page.evaluate( async () => {

		const THREE = await import( 'three/webgpu' );
		const { cameraPosition, cameraProjectionMatrix, cameraViewMatrix, color, context, mix, modelViewProjection, overrideNodes, positionLocal, positionView, positionWorld, vec3, vec4 } = await import( 'three/tsl' );
		const { GPUDrivenDrawer } = await import( 'three/addons/drawers/GPUDrivenDrawer.js' );
		const renderer = new THREE.WebGPURenderer();
		await renderer.init();
		const gpuErrors = [];
		renderer.backend.device.addEventListener( 'uncapturederror', event => gpuErrors.push( event.error.message ) );
		const builders = [];
		renderer.debug.onNodeBuilderCreated = ( builder, object ) => {

			if ( object.isRenderObject === true ) builders.push( { builder, prepass: renderer.drawer.depthPrepass } );

		};

		const drawer = new GPUDrivenDrawer( { lodThreshold: 0, occlusionCulling: false } );
		renderer.drawer = drawer;
		const defaultContext = renderer.contextNode;
		const scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x18304a );
		scene.add( new THREE.AmbientLight( 0xffffff, 1 ) );
		const light = new THREE.DirectionalLight( 0xffffff, 2 );
		light.position.set( 3, 8, 5 );
		scene.add( light );
		const camera = new THREE.PerspectiveCamera( 55, 2, 1, 30000 );
		const geometry = new THREE.BoxGeometry( 2, 10, 2, 4, 16, 4 );
		const material = new THREE.MeshStandardNodeMaterial( { roughness: 0.6 } );
		material.colorNode = mix( color( 0x4080c0 ), color( 0xc08040 ), positionWorld.y.mul( 0.8 ).sin().mul( 0.5 ).add( 0.5 ) );
		material.positionNode = positionLocal.add( vec3( 0, positionLocal.x.sin().mul( 0.03 ), 0 ) );

		const mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( 2000, 0, - 2000 );
		scene.add( mesh );
		const instanced = new THREE.InstancedMesh( geometry, material, 3 );
		instanced.position.copy( mesh.position );
		for ( let i = 0; i < instanced.count; i ++ ) instanced.setMatrixAt( i, new THREE.Matrix4().makeTranslation( ( i - 1 ) * 3, 0, - 4 ) );
		scene.add( instanced );

		// The city bends the projection in both passes. The shading shader also exports
		// world position for its material, whereas the depth shader only needs the projection.
		const curvedWorld = overrideNodes( [[ modelViewProjection, () => {

			const offset = positionWorld.xz.sub( cameraPosition.xz );
			const rise = offset.dot( offset ).mul( 0.0002 );
			return cameraProjectionMatrix.mul( vec4( positionView.add( cameraViewMatrix.mul( vec4( 0, rise, 0, 0 ) ).xyz ), 1 ) );

		} ]], context( { getBoundingSphere: sphere => vec4( sphere.xyz, sphere.w.add( 1 ) ) } ) );
		const scenarios = [];

		for ( const samples of [ 0, 4 ] ) {

			const target = new THREE.RenderTarget( 513, 257, { samples } );
			renderer.setSize( target.width, target.height );
			renderer.setRenderTarget( target );
			camera.aspect = target.width / target.height;
			camera.updateProjectionMatrix();

			for ( const curved of [ false, true ] ) {

				renderer.contextNode = curved ? curvedWorld : defaultContext;

				for ( const height of [ 0.1, 2, 6 ] ) {

					camera.position.set( 2002, height, - 1988 );
					camera.lookAt( 2000, height + 3, - 2000 );
					const captures = [];

					for ( const prepass of [ false, true ] ) {

						drawer.depthPrepass = prepass;
						await renderer.compileAsync( scene, camera );
						renderer.render( scene, camera );
						captures.push( await renderer.readRenderTargetPixelsAsync( target, 0, 0, target.width, target.height ) );

					}

					let maxError = 0;
					let different = 0;
					let foreground = 0;

					for ( let i = 0; i < captures[ 0 ].length; i += 4 ) {

						let pixelError = 0;
						for ( let c = 0; c < 3; c ++ ) pixelError = Math.max( pixelError, Math.abs( captures[ 0 ][ i + c ] - captures[ 1 ][ i + c ] ) );
						maxError = Math.max( maxError, pixelError );
						if ( pixelError > 1 ) different ++;
						if ( captures[ 0 ][ i ] !== captures[ 0 ][ 0 ] || captures[ 0 ][ i + 1 ] !== captures[ 0 ][ 1 ] || captures[ 0 ][ i + 2 ] !== captures[ 0 ][ 2 ] ) foreground ++;

					}

					scenarios.push( { samples, curved, height, maxError, different, foreground } );

				}

			}

			target.dispose();

		}

		geometry.dispose();
		material.dispose();
		const qualified = builders.filter( ( { builder } ) => builder.vertexShader.includes( '@invariant' ) );
		const ordinary = builders.filter( ( { builder, prepass } ) => prepass === false && builder.vertexShader.includes( '@invariant' ) );
		const depthShaders = qualified.filter( ( { builder } ) => builder.material.colorWrite === false ).length;
		const colorShaders = qualified.filter( ( { builder } ) => builder.material.colorWrite !== false ).length;
		renderer.dispose();
		return { scenarios, gpuErrors, depthShaders, colorShaders, ordinary: ordinary.length };

	} );

	for ( const scenario of result.scenarios ) {

		assert.ok( scenario.foreground > 1000, `The scene must draw visible geometry: ${ JSON.stringify( scenario ) }` );
		assert.equal( scenario.different, 0, `Depth prepass must preserve shaded pixels: ${ JSON.stringify( scenario ) }` );

	}

	assert.deepEqual( result.gpuErrors, [] );
	assert.ok( result.depthShaders > 0, 'The depth shaders must request invariant vertex positions.' );
	assert.equal( result.colorShaders, 0, 'Only the depth material must request invariant vertex positions.' );
	assert.equal( result.ordinary, 0, 'Draws without a depth prepass must not request invariance.' );
	assert.deepEqual( errors, [] );
	console.log( `GPU-driven depth prepass passed: ${ result.scenarios.length } views, lit node material, deformed meshes and instances, curved projection, MSAA and odd resolution.` );

} finally {

	await browser?.close();
	await new Promise( resolve => server.close( resolve ) );

}
