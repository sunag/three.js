import {
	nodeObject, storageObject, nodeProxy, uint, float, vec2, vec4, uniform, Break, Loop,
	vec3, Fn, ivec2, int, uvec2, If, texture, textureLoad, instanceIndex, screenUV, screenCoordinate, directPointLight,
	uvec4,
	Return
} from 'three/tsl';

import * as THREE from 'three';

export const intersectAABB = /*@__PURE__*/ Fn( ( [ point, minBounds, maxBounds ] ) => {

	return point.x.greaterThanEqual( minBounds.x ).and( point.x.lessThanEqual( maxBounds.x ) ).and( point.y.greaterThanEqual( minBounds.y ) ).and( point.y.lessThanEqual( maxBounds.y ) );

} ).setLayout( {
	name: 'intersectAABB',
	type: 'bool',
	inputs: [
		{ name: 'point', type: 'vec2' },
		{ name: 'minBounds', type: 'vec2' },
		{ name: 'maxBounds', type: 'vec2' }
	]
} );


export const circleIntersectsAABB = /*@__PURE__*/ Fn( ( [ circleCenter, radius, minBounds, maxBounds ] ) => {

	// Find the closest point on the AABB to the circle's center using method chaining
	const closestX = minBounds.x.max( circleCenter.x.min( maxBounds.x ) );
	const closestY = minBounds.y.max( circleCenter.y.min( maxBounds.y ) );

	// Compute the distance between the circle's center and the closest point
	const distX = circleCenter.x.sub( closestX );
	const distY = circleCenter.y.sub( closestY );

	// Calculate the squared distance
	const distSquared = distX.mul( distX ).add( distY.mul( distY ) );

	return distSquared.lessThanEqual( radius.mul( radius ) );

} ).setLayout( {
	name: 'circleIntersectsAABB',
	type: 'bool',
	inputs: [
		{ name: 'circleCenter', type: 'vec2' },
		{ name: 'radius', type: 'float' },
		{ name: 'minBounds', type: 'vec2' },
		{ name: 'maxBounds', type: 'vec2' }
	]
} );

const _vector3 = /*@__PURE__*/ new THREE.Vector3();

class TiledLightsNode extends THREE.LightsNode {

	static get type() {

		return 'TiledLightsNode';

	}

	constructor() {

		super();

		this.materialLights = [];
		this.tiledLights = [];

		this.bufferSize = new THREE.Vector2( 2048, 2048 );
		this.tileSize = 8;
		this.maxLights = 2048;
		this.lineSize = Math.floor( this.bufferSize.width / this.tileSize );
		this.count = Math.floor( ( this.bufferSize.width * this.bufferSize.height ) / this.tileSize );

		this.lightsCount = uniform( 0, 'uint' );
		this.tileLightCount = 8;
		this.screenSize = uniform( new THREE.Vector2() );
		this.cameraProjectionMatrix = uniform( 'mat4' );
		this.cameraViewMatrix = uniform( 'mat4' );

		this.indexes = null;

		this.updateBeforeType = THREE.NodeUpdateType.RENDER;

		this.create();

	}

	updateLightsTexture() {

		const { lightsTexture, tiledLights } = this;

		const data = lightsTexture.image.data;
		const lineSize = lightsTexture.image.width * 4;

		this.lightsCount.value = tiledLights.length;

		for ( let i = 0; i < tiledLights.length; i ++ ) {

			const light = tiledLights[ i ];

			// world position

			_vector3.setFromMatrixPosition( light.matrixWorld );

			// store data

			const offset = i * 4;

			data[ offset + 0 ] = _vector3.x;
			data[ offset + 1 ] = _vector3.y;
			data[ offset + 2 ] = _vector3.z;
			data[ offset + 3 ] = light.distance;

			data[ lineSize + offset + 0 ] = light.color.r;
			data[ lineSize + offset + 1 ] = light.color.g;
			data[ lineSize + offset + 2 ] = light.color.b;
			data[ lineSize + offset + 3 ] = light.decay;

		}

		lightsTexture.needsUpdate = true;

	}

	updateBefore( frame ) {

		const { renderer, camera } = frame;

		this.updateLightsTexture( camera );

		this.cameraProjectionMatrix.value = camera.projectionMatrix;
		this.cameraViewMatrix.value = camera.matrixWorldInverse;

		this.screenSize.value.set( window.innerWidth, window.innerHeight );

		renderer.compute( this.compute );

	}

	setLights( lights ) {

		const { tiledLights, materialLights } = this;

		let materialindex = 0;
		let tiledIndex = 0;

		for ( const light of lights ) {

			if ( light.isPointLight === true ) {

				tiledLights[ tiledIndex ++ ] = light;

			} else {

				materialLights[ materialindex ++ ] = light;

			}

		}

		materialLights.length = materialindex;
		tiledLights.length = tiledIndex;

		return super.setLights( materialLights );

	}

	getTileIndex( elementIndex ) {

		elementIndex = int( elementIndex );

		const stride = int( 4 );
		const tileOffset = elementIndex.div( stride );
		const tileIndex = this.screenTileIndex.mul( int( 2 ) ).add( tileOffset );

		return this.lightIndexes.element( tileIndex ).element( elementIndex.modInt( stride ) );

	}

	getLightData( index ) {

		index = int( index );

		const dataA = textureLoad( this.lightsTexture, ivec2( index, 0 ) );
		const dataB = textureLoad( this.lightsTexture, ivec2( index, 1 ) );

		const position = dataA.xyz;
		const viewPosition = this.cameraViewMatrix.mul( position );
		const distance = dataA.w;
		const color = dataB.rgb;
		const decay = dataB.w;

		return {
			position,
			viewPosition,
			distance,
			color,
			decay
		};

	}

	setupLights( builder, lightNodes ) {

		const lightingModel = builder.context.reflectedLight;

		// force declaration order, before of the loop
		lightingModel.directDiffuse.append();
		lightingModel.directSpecular.append();

		Fn( () => {

			Loop( this.tileLightCount, ( { i } ) => {

				const lightIndex = this.getTileIndex( i );

				If( lightIndex.equal( int( 0 ) ), () => {

					Break();

				} );

				const { color, decay, viewPosition, distance } = this.getLightData( lightIndex.sub( 1 ) );

				directPointLight( {
					color,
					lightViewPosition: viewPosition,
					cutoffDistance: distance,
					decayExponent: decay
				} ).append();

			} );

		} )().append();

		// others lights

		super.setupLights( builder, lightNodes );

	}

	create() {

		const { count, tileSize, lineSize } = this;

		// buffers

		const lightsData = new Float32Array( this.maxLights * 4 * 2 ); // 2048 lights, 4 elements(rgba), 2 components, 1 component per line (position, distance, color, decay)
		const lightsTexture = new THREE.DataTexture( lightsData, lightsData.length / 8, 2, THREE.RGBAFormat, THREE.FloatType );
		lightsTexture.needsUpdate = true;

		const lightIndexesArray = new Uint32Array( count * 4 * 2 );
		const lightIndexesAttribute = new THREE.StorageBufferAttribute( lightIndexesArray, 4 );
		const lightIndexes = storageObject( lightIndexesAttribute, 'uvec4' ).label( 'lightIndexes' );

		// compute

		const getBlockIndex = ( index ) => {

			const tileIndex = instanceIndex.mul( int( 2 ) ).add( int( index ) );

			return lightIndexes.element( tileIndex );

		};

		const getTileIndex = ( elementIndex ) => {

			elementIndex = int( elementIndex );

			const stride = int( 4 );
			const tileOffset = elementIndex.div( stride );
			const tileIndex = instanceIndex.mul( int( 2 ) ).add( tileOffset );

			return this.lightIndexes.element( tileIndex ).element( elementIndex.modInt( stride ) );

		};

		const compute = Fn( () => {

			const { cameraProjectionMatrix, bufferSize, screenSize } = this;

			const tiledBufferSize = bufferSize.clone().divideScalar( tileSize ).floor();

			const tileScreen = vec2(
				instanceIndex.modInt( tiledBufferSize.width ),
				instanceIndex.div( tiledBufferSize.width )
			).mul( tileSize ).div( screenSize );

			const blockSize = float( tileSize ).div( screenSize );
			const minBounds = tileScreen;
			const maxBounds = minBounds.add( blockSize );

			const index = uint( 0 ).toVar();

			getBlockIndex( 0 ).assign( uvec4( 0 ) );
			getBlockIndex( 1 ).assign( uvec4( 0 ) );

			Loop( this.maxLights, ( { i } ) => {

				If( index.greaterThanEqual( this.tileLightCount ).or( uint( i ).greaterThanEqual( uint( this.lightsCount ) ) ), () => {

					Return();

				} );

				const { viewPosition, distance } = this.getLightData( i );

				const projectedPosition = cameraProjectionMatrix.mul( viewPosition );
				const ndc = projectedPosition.div( projectedPosition.w );
				const screenPosition = ndc.xy.mul( 0.5 ).add( 0.5 ).flipY();

				const distanceFromCamera = viewPosition.z;
				const pointRadius = distance.div( distanceFromCamera );

				If( circleIntersectsAABB( screenPosition, pointRadius, minBounds, maxBounds ), () => {

					getTileIndex( index ).assign( i.add( int( 1 ) ) );
					index.addAssign( uint( 1 ) );

				} );

			} );

		} )().compute( count );

		// screen coordinate lighting indexes

		const screenTile = screenCoordinate.div( tileSize ).floor().toVar();
		const screenTileIndex = screenTile.x.add( screenTile.y.mul( lineSize ) );

		const indexes = lightIndexes.element( screenTileIndex.mul( uint( 2 ) ) );

		// assigns

		this.lightIndexes = lightIndexes;
		this.screenTileIndex = screenTileIndex;
		this.indexes = indexes;
		this.compute = compute;
		this.lightsTexture = lightsTexture;

	}

}

export default TiledLightsNode;

export const tiledLights = /*@__PURE__*/ nodeProxy( TiledLightsNode );
