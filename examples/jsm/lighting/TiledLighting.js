import * as THREE from 'three';
import { tiledLights } from '../tsl/lighting/TiledLightsNode.js';

export class TiledLighting extends THREE.Lighting {

	constructor() {

		super();

		this.map = new THREE.ChainMap();

	}

	getNode( scene, camera ) {

		// ignore post-processing

		if ( scene.isQuadMesh ) return super.getNode( scene, camera );

		// tiled lighting

		const keys = [ scene, camera ];

		let node = this.map.get( keys );

		if ( node === undefined ) {

			node = tiledLights();
			this.map.set( keys, node );

		}

		return node;

	}

}
