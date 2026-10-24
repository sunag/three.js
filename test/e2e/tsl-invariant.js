import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { createServer } from '../../utils/server.js';

const server = createServer( { root: fileURLToPath( new URL( '../../', import.meta.url ) ) } );
await new Promise( resolve => server.listen( 0, '127.0.0.1', resolve ) );
const url = `http://127.0.0.1:${ server.address().port }/tsl-invariant`;
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
{"imports":{"three":"/src/Three.WebGPU.js","three/webgpu":"/src/Three.WebGPU.js","three/tsl":"/src/Three.TSL.js"}}
</script>`
			} );

		} else {

			request.continue();

		}

	} );
	await page.goto( url );

	const results = await page.evaluate( async () => {

		const THREE = await import( 'three/webgpu' );
		const { context } = await import( 'three/tsl' );
		const results = [];

		for ( const forceWebGL of [ false, true ] ) {

			const renderer = new THREE.WebGPURenderer( { forceWebGL } );
			await renderer.init();
			const gpuErrors = [];
			if ( ! forceWebGL ) renderer.backend.device.addEventListener( 'uncapturederror', event => gpuErrors.push( event.error.message ) );
			const size = 33;
			renderer.setSize( size, size );
			const target = new THREE.RenderTarget( size, size );
			renderer.setRenderTarget( target );
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 100 );
			camera.position.z = 4;
			const geometry = new THREE.BoxGeometry();
			const mesh = new THREE.Mesh( geometry );
			scene.add( mesh );
			let expected;

			for ( const mode of [ 'default', 'context enabled', 'context disabled', 'default again' ] ) {

				const material = new THREE.MeshBasicNodeMaterial( { color: 0xff0000 } );
				if ( mode === 'context enabled' ) material.contextNode = context( { invariant: true } );
				if ( mode === 'context disabled' ) material.contextNode = context( { invariant: false } );
				mesh.material = material;
				const { vertexShader, fragmentShader } = await renderer.debug.getShaderAsync( scene, camera, mesh );
				renderer.render( scene, camera );
				const actual = await renderer.readRenderTargetPixelsAsync( target, 0, 0, size, size );
				if ( expected === undefined ) expected = actual;
				const qualifier = forceWebGL ? 'invariant gl_Position;' : '@invariant @builtin( position )';

				results.push( {
					backend: forceWebGL ? 'WebGL' : 'WebGPU', mode,
					invariant: vertexShader.includes( qualifier ),
					fragmentInvariant: fragmentShader.includes( qualifier ),
					samePixels: actual.every( ( value, i ) => value === expected[ i ] ),
					center: Array.from( actual.slice( ( 16 * size + 16 ) * 4, ( 16 * size + 16 ) * 4 + 4 ) ),
					gpuErrors
				} );
				material.dispose();

			}

			geometry.dispose();
			target.dispose();
			renderer.dispose();

		}

		return results;

	} );

	for ( const result of results ) {

		const label = `${ result.backend }: ${ result.mode }`;
		assert.equal( result.invariant, result.mode === 'context enabled', `${ label }: invariance must be opt-in.` );
		assert.equal( result.fragmentInvariant, false, `${ label }: fragment shader must remain unchanged.` );
		assert.equal( result.samePixels, true, `${ label }: the API must preserve rendered pixels.` );
		assert.ok( result.center[ 0 ] > 200 && result.center[ 1 ] < 10, `${ label }: the mesh must render red.` );
		assert.deepEqual( result.gpuErrors, [], label );

	}

	assert.deepEqual( errors, [] );
	console.log( 'TSL invariant context passed: WebGPU and WebGL, identical pixels and ordinary shaders remain unqualified.' );

} finally {

	await browser?.close();
	await new Promise( resolve => server.close( resolve ) );

}
