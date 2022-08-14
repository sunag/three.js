import { Node, float, uv, mul, add } from '../../Nodes.js';
import * as mx_noise from '../glsl/lib/mx_noise.js';

class NoiseNode extends Node {

	static FLOAT_2D = 'mx_perlin_noise_float';

	constructor( method, uvNode = uv() ) {

		super( 'float' );

		this.method = method;
		this.uvNode = uvNode;

		this.amplitudeNode = null;
		this.pivotNode = null;

	}

	construct() {

		const { method, uvNode } = this;

		const noiseNode = mx_noise[ method ].call( { p: uvNode } );

		return noiseNode

	}

}

export default NoiseNode;
