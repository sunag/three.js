import { BaseNode } from '../core/BaseNode.js';
import { MatcapUVNode } from 'three/nodes';

export class MatcapUVEditor extends BaseNode {

	constructor() {

		const node = new MatcapUVNode();

		super( 'Matcap UV', node, 200 );

		this.setOutputLength( 2 );

	}

}
