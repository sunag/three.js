import { NodeMaterial } from '../nodes/core/NodeMaterial.js';
import { StandardNode } from '../nodes/materials/StandardNode.js';

/**
 * @author WestLangley / http://github.com/WestLangley
 *
 * parameters = {
 *  color: <hex>,
 *  roughness: <float>,
 *  metalness: <float>,
 *  opacity: <float>,
 *
 *  map: new THREE.Texture( <Image> ),
 *
 *  lightMap: new THREE.Texture( <Image> ),
 *  lightMapIntensity: <float>
 *
 *  aoMap: new THREE.Texture( <Image> ),
 *  aoMapIntensity: <float>
 *
 *  emissive: <hex>,
 *  emissiveIntensity: <float>
 *  emissiveMap: new THREE.Texture( <Image> ),
 *
 *  bumpMap: new THREE.Texture( <Image> ),
 *  bumpScale: <float>,
 *
 *  normalMap: new THREE.Texture( <Image> ),
 *  normalScale: <Vector2>,
 *
 *  displacementMap: new THREE.Texture( <Image> ),
 *  displacementScale: <float>,
 *  displacementBias: <float>,
 *
 *  roughnessMap: new THREE.Texture( <Image> ),
 *
 *  metalnessMap: new THREE.Texture( <Image> ),
 *
 *  alphaMap: new THREE.Texture( <Image> ),
 *
 *  envMap: new THREE.CubeTexture( [posx, negx, posy, negy, posz, negz] ),
 *  envMapIntensity: <float>
 *
 *  refractionRatio: <float>,
 *
 *  wireframe: <boolean>,
 *  wireframeLinewidth: <float>,
 *
 *  skinning: <bool>,
 *  morphTargets: <bool>,
 *  morphNormals: <bool>
 * }
 */

function MeshStandardMaterial() {

	this.node = new StandardNode( true );

	NodeMaterial.call( this, this.node, this.node );

	this.type = "MeshStandardMaterial";
	
};

MeshStandardMaterial.prototype = Object.create( NodeMaterial.prototype );
MeshStandardMaterial.prototype.constructor = MeshStandardMaterial;

Object.defineProperties( MeshStandardMaterial.prototype, {
	color: {
		get: function () {

			return this.node.color.value;

		},
		set: function ( val ) {

			this.node.color.value = val;

		}
	},
	map2 : {
		get: function () {

			return this.node.map.value;

		},
		set: function ( val ) {

			this.node.map.value = val;

		}
	},
	roughness: {
		get: function () {

			return this.node.roughnessValue.number;

		},
		set: function ( val ) {

			this.node.roughnessValue.number = val;

		}
	},
	roughnessMap2 : {
		get: function () {

			return this.node.roughnessMap.value;

		},
		set: function ( val ) {

			this.node.roughnessMap.value = val;

		}
	},
	metalness : {
		get: function () {

			return this.node.metalnessValue.number;

		},
		set: function ( val ) {

			this.node.metalnessValue.number = val;

		}
	},
	metalnessMap2 : {
		get: function () {

			return this.node.metalnessMap.value;

		},
		set: function ( val ) {

			this.node.metalnessMap.value = val;

		}
	},
	normalMap2 : {
		get: function () {

			return this.node.normalMap.value;

		},
		set: function ( val ) {

			this.node.normalMap.value = val;

		}
	},
	normalScale : {
		get: function () {

			return this.node.normalMapScale.number;

		},
		set: function ( val ) {

			this.node.normalMapScale.number = val;

		}
	},
	envMap : {
		get: function () {

			return this.node.envMap.value;

		},
		set: function ( val ) {

			this.node.envMap.value = val;

		}
	},	
} );

export { MeshStandardMaterial };
