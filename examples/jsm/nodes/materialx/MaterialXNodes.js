import { mx_perlin_noise_float } from './functions/lib/mx_noise.js';
import { mx_hsvtorgb, mx_rgbtohsv } from './functions/lib/mx_hsv.js';
import { nodeObject, float, vec2, add, sub, mul, mix, clamp, uv, length, smoothstep, dFdx, dFdy, convert } from '../shadernode/ShaderNodeElements.js';
/*
import HSVNode from './nodes/HSVNode.js';
import Noise2DNode from './nodes/NoiseNode.js';

export {
	HSVNode,
	Noise2DNode
};

export const mx_hsvtorgb = nodeProxy( HSVNode, HSVNode.HSV_TO_RGB );
export const mx_rgbtohsv = nodeProxy( HSVNode, HSVNode.RGB_TO_HSB );

export const mx_noise2d = nodeProxy( NoiseNode, NoiseNode.FLOAT_2D );
*/
//

//export const noise2d = mx_perlin_noise_float;
//

export const mx_aastep = ( threshold, value ) => {

	threshold = float( threshold );
	value = float( value );

	const afwidth = mul( length( vec2( dFdx( value ), dFdy( value ) ) ), 0.70710678118654757 );

	return smoothstep( sub( threshold, afwidth ), add( threshold, afwidth ), value );

};

const _ramp = ( a, b, uv, p ) => mix( a, b, clamp( nodeObject( uv )[ p ] ) );
export const mx_ramplr = ( valuel, valuer, texcoord = uv() ) => _ramp( valuel, valuer, texcoord, 'x' );
export const mx_ramptb = ( valuet, valueb, texcoord = uv() ) => _ramp( valuet, valueb, texcoord, 'y' );

const _split = ( a, b, center, uv, p ) => mix( a, b, mx_aastep( center, nodeObject( uv )[ p ] ) );
export const mx_splitlr = ( valuel, valuer, center, texcoord = uv() ) => _split( valuel, valuer, center, texcoord, 'x' );
export const mx_splittb = ( valuet, valueb, center, texcoord = uv() ) => _split( valuet, valueb, center, texcoord, 'y' );

export const mx_noise2d_float = ( amplitude, pivot, texcoord = uv() ) => add( mul( amplitude, mx_perlin_noise_float( convert( texcoord, 'vec2|vec3' ) ) ), pivot );
export const mx_noise2d_vec2 = ( amplitude, pivot, texcoord = uv() ) => add( mul( amplitude, mx_perlin_noise_float( convert( texcoord, 'vec2|vec3' ) ) ), pivot );
export const mx_noise2d_vec3 = ( amplitude, pivot, texcoord = uv() ) => add( mul( amplitude, mx_perlin_noise_float( convert( texcoord, 'vec2|vec3' ) ) ), pivot );

export { mx_hsvtorgb, mx_rgbtohsv };

