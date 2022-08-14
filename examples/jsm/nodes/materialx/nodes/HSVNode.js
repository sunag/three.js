import { Node } from '../../Nodes.js';
import * as mx_hsv from '../glsl/lib/mx_hsv.js';

class HSVNode extends Node {

	static HSV_TO_RGB = 'mx_hsvtorgb';
	static RGB_TO_HSB = 'mx_rgbtohsv';

	constructor( method, node ) {

		super( 'vec3' );

		this.method = method;

		this.node = node;

	}

	construct() {

		const node = this.node;
		const paramsAlias = { c: node, hsv: node };

		return mx_hsv[ this.method ].call( paramsAlias );

	}

}

export default HSVNode;
