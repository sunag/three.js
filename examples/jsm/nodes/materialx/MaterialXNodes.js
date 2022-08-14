import { nodeProxy } from '../shadernode/ShaderNodeElements.js';

import HSVNode from './nodes/HSVNode.js';
import NoiseNode from './nodes/NoiseNode.js';

export {
	HSVNode,
	NoiseNode
};

export const mx_hsvtorgb = nodeProxy( HSVNode, HSVNode.HSV_TO_RGB );
export const mx_rgbtohsv = nodeProxy( HSVNode, HSVNode.RGB_TO_HSB );

export const mx_perlin_noise_float = nodeProxy( NoiseNode, NoiseNode.FLOAT_2D );

//

export const noise2d = mx_perlin_noise_float;
