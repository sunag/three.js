import Node from '../core/Node.js';
import { nodeProxy } from '../shadernode/ShaderNode.js';
import { code } from 'three/nodes';

const source = `

fn getFace( direction : vec3<f32> ) -> f32 {
	let absDirection = abs( direction );
	var face = - 1.0;
	if ( absDirection.x > absDirection.z ) {
		if ( absDirection.x > absDirection.y ) {
			if ( direction.x > 0.0 ) { face = 0.0; }
		  	else { face = 3.0; }
		} else {
		  	if ( direction.y > 0.0 ) { face = 1.0; }
		  	else { face = 4.0; }
		}
	} else {
		if ( absDirection.z > absDirection.y ) {
		  	if ( direction.z > 0.0 ) { face = 2.0; }
		  	else { face = 5.0; }
		} else {
		  	if ( direction.y > 0.0 ) { face = 1.0; }
		  	else { face = 4.0; }
		}
	}
	return face;
}

fn getUV( direction : vec3<f32>, face : f32 ) -> vec2<f32> {
	var uv : vec2<f32>;
	if ( face == 0.0 ) {
		uv = vec2( direction.z, direction.y ) / abs( direction.x );
	} else if ( face == 1.0 ) {
		uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
	} else if ( face == 2.0 ) {
		uv = vec2( - direction.x, direction.y ) / abs( direction.z );
	} else if ( face == 3.0 ) {
		uv = vec2( - direction.z, direction.y ) / abs( direction.x );
	} else if ( face == 4.0 ) {
		uv = vec2( - direction.x, direction.z ) / abs( direction.y );
	} else {
		uv = vec2( direction.x, direction.y ) / abs( direction.z );
	}
	return 0.5 * ( uv + 1.0 );
}

//

const cubeUV_minMipLevel = 4.0;
const cubeUV_minTileSize = 16.0;

const CUBEUV_MAX_MIP : f32 = 0;
const CUBEUV_TEXEL_WIDTH : f32 = 0;
const CUBEUV_TEXEL_HEIGHT : f32 = 0;

fn bilinearCubeUV( texture : texture_2d<f32>, textureSampler : sampler, direction : vec3<f32>, mipIntParam : f32 ) -> vec3<f32> {
	var face = getFace( direction );
	let filterInt = max( cubeUV_minMipLevel - mipIntParam, 0.0 );
	let mipInt = max( mipIntParam, cubeUV_minMipLevel );
	let faceSize = exp2( mipInt );
	var uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
	if ( face > 2.0 ) {
		uv.y += faceSize;
		face -= 3.0;
	}
	uv.x += face * faceSize;
	uv.x += filterInt * 3.0 * cubeUV_minTileSize;
	uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
	uv.x *= CUBEUV_TEXEL_WIDTH;
	uv.y *= CUBEUV_TEXEL_HEIGHT;
	
	return textureSample( texture, textureSampler, uv ).rgb;
}

`;

class PMREMNode extends Node {

	constructor( textureNode ) {

		super();

		this.textureNode = textureNode;

        this.isPMREMNode = true;

	}

	construct() {

		return this.textureNode;

	}

}

export default PMREMNode;

export const pmrem = nodeProxy( PMREMNode );
