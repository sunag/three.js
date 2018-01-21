import { NodeLib } from '../core/NodeLib.js';
import { ConstNode } from '../core/ConstNode.js';
import { FunctionNode } from '../core/FunctionNode.js';

// LUMA: To get luminance

NodeLib.add( new ConstNode( "vec3 LUMA vec3(0.2125, 0.7154, 0.0721)" ) );

// Normal
// Per-Pixel Tangent Space Normal Mapping
// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html

NodeLib.add( new FunctionNode(
"vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 map, vec2 mUv, vec2 scale ) {\
	vec3 q0 = dFdx( eye_pos );\
	vec3 q1 = dFdy( eye_pos );\
	vec2 st0 = dFdx( mUv.st );\
	vec2 st1 = dFdy( mUv.st );\
	vec3 S = normalize( q0 * st1.t - q1 * st0.t );\
	vec3 T = normalize( -q0 * st1.s + q1 * st0.s );\
	vec3 N = normalize( surf_norm );\
	vec3 mapN = map * 2.0 - 1.0;\
	mapN.xy = scale * mapN.xy;\
	mat3 tsn = mat3( S, T, N );\
	return normalize( tsn * mapN );\
}", null, { derivatives: true } ) );

// Noise

NodeLib.add( new FunctionNode(
"float snoise(vec2 co) {\
	return fract( sin( dot(co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );\
}" ) );

// Hue

NodeLib.add( new FunctionNode(
"vec3 hue_rgb(vec3 rgb, float adjustment) {\
	const mat3 RGBtoYIQ = mat3(0.299, 0.587, 0.114, 0.595716, -0.274453, -0.321263, 0.211456, -0.522591, 0.311135);\
	const mat3 YIQtoRGB = mat3(1.0, 0.9563, 0.6210, 1.0, -0.2721, -0.6474, 1.0, -1.107, 1.7046);\
	vec3 yiq = RGBtoYIQ * rgb;\
	float hue = atan(yiq.z, yiq.y) + adjustment;\
	float chroma = sqrt(yiq.z * yiq.z + yiq.y * yiq.y);\
	return YIQtoRGB * vec3(yiq.x, chroma * cos(hue), chroma * sin(hue));\
}" ) );

// Saturation
// Algorithm from Chapter 16 of OpenGL Shading Language

NodeLib.add( new FunctionNode(
"vec3 saturation_rgb(vec3 rgb, float adjustment) {\
	vec3 intensity = vec3(dot(rgb, LUMA));\
	return mix(intensity, rgb, adjustment);\
}" ) );

// Luminance
// Algorithm from Chapter 10 of Graphics Shaders

NodeLib.add( new FunctionNode(
"float luminance_rgb(vec3 rgb) {\
	return dot(rgb, LUMA);\
}" ) );

// Vibrance
// Shader by Evan Wallace adapted by @lo-th

NodeLib.add( new FunctionNode(
"vec3 vibrance_rgb(vec3 rgb, float adjustment) {\
	float average = (rgb.r + rgb.g + rgb.b) / 3.0;\
	float mx = max(rgb.r, max(rgb.g, rgb.b));\
	float amt = (mx - average) * (-3.0 * adjustment);\
	return mix(rgb.rgb, vec3(mx), amt);\
}" ) );