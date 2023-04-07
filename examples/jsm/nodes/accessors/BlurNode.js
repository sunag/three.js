import TempNode from '../core/TempNode.js'
import { addNodeClass } from '../core/Node.js'
import { add, mul, div } from '../math/OperatorNode.js';
import { floor, ceil, fract, pow, mix } from '../math/MathNode.js';
import { textureLod } from '../accessors/TextureNode.js';
import { textureSize } from '../accessors/TextureSizeNode.js';
import { nodeProxy, addNodeElement, float, vec2, vec4, int } from '../shadernode/ShaderNode.js';

// Mipped Bicubic Texture Filtering by N8
// https://www.shadertoy.com/view/Dl2SDW

const bC = 1.0 / 6.0;

const w0 = ( a ) => mul( bC, mul( a, mul( a, a.negate().add( 3.0 ) ).sub( 3.0 ) ).add( 1.0 ) );

const w1 = ( a ) => mul( bC,  mul( a, mul( a, mul( 3.0, a ).sub( 6.0 ) ) ).add( 4.0 ) );

const w2 = ( a ) => mul( bC,  mul( a, mul( a, mul( - 3.0, a ).add( 3.0 ) ).add( 3.0 ) ).add( 1.0 ) );

const w3 = ( a ) => mul( bC, pow( a, 3 ) );

const g0 = ( a ) => w0( a ).add( w1( a ) );

const g1 = ( a ) => w2( a ).add( w3( a ) );

// h0 and h1 are the two offset functions
const h0 = ( a ) => add( -1.0, w1( a ).div( w0( a ).add( w1( a ) ) ) );

const h1 = ( a ) => add( 1.0, w3( a ).div( w2( a ).add( w3( a ) ) ) );

const bicubic = ( textureNode, uv, texelSize, lod ) => {

	const uvScaled = mul( uv, texelSize.zw ).add( 0.5 );

	const iuv = floor( uvScaled );
    const fuv = fract( uvScaled );

	const g0x = g0( fuv.x );
	const g1x = g1( fuv.x );
	const h0x = h0( fuv.x );
	const h1x = h1( fuv.x );
	const h0y = h0( fuv.y );
	const h1y = h1( fuv.y );

	const p0 = vec2( iuv.x.add( h0x ), iuv.y.add( h0y ) ).sub( 0.5 ).mul( texelSize.xy );
    const p1 = vec2( iuv.x.add( h1x ), iuv.y.add( h0y ) ).sub( 0.5 ).mul( texelSize.xy );
    const p2 = vec2( iuv.x.add( h0x ), iuv.y.add( h1y ) ).sub( 0.5 ).mul( texelSize.xy );
    const p3 = vec2( iuv.x.add( h1x ), iuv.y.add( h1y ) ).sub( 0.5 ).mul( texelSize.xy );

	const a = g0( fuv.y ).mul( add( g0x.mul( textureLod( textureNode.value, p0, lod ) ), g1x.mul( textureLod( textureNode.value, p1, lod ) ) ) );
	const b = g1( fuv.y ).mul( add( g0x.mul( textureLod( textureNode.value, p2, lod ) ), g1x.mul( textureLod( textureNode.value, p3, lod ) ) ) );

	return a.add( b );

}

const textureBicubic = ( textureNode, uvNode, lodNode ) => {

	const fLodSize = vec2( textureSize( textureNode, int( lodNode ) ) );
	const cLodSize = vec2( textureSize( textureNode, int( lodNode.add( 1.0 ) ) ) );
	const fLodSizeInv = div( 1.0, fLodSize );
	const cLodSizeInv = div( 1.0, cLodSize );
	const fSample = bicubic( textureNode, uvNode, vec4( fLodSizeInv, fLodSize ), floor( lodNode ) );
	const cSample = bicubic( textureNode, uvNode, vec4( cLodSizeInv, cLodSize ), ceil( lodNode ) );

	return mix( fSample, cSample, fract( lodNode ) );

}

class BlurNode extends TempNode {

	constructor( textureNode, blurNode = float( 3 ) ) {

		super( 'vec4' );

		this.textureNode = textureNode;
		this.blurNode = blurNode;

	}

	construct( builder ) {

		const textureNode = this.textureNode;
		textureNode.build( builder );

		

		//return textureLod( textureNode.value, textureNode.uvNode, float( 3.9 ) );
		return textureBicubic( textureNode, textureNode.uvNode, this.blurNode );		
	}
/*
	generate( builder, output ) {

		const name = this.textureNode.build( builder, 'property' );
		const uvSnippet = this.textureNode.uvNode.build( builder, 'vec2' );

		return builder.format( `textureBicubic( ${name}, ${name}_sampler, ${uvSnippet}, 3.0 )`, 'vec4', output );

	}*/
}

export default BlurNode;

export const blur = nodeProxy( BlurNode );

addNodeElement( 'blur', blur );

addNodeClass( BlurNode );
