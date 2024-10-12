import { LightsNode } from '../../nodes/Nodes.js';

class Lighting {

	constructor() {


	}

	getNode( lights = [] ) {

		return new LightsNode( lights );

	}

}

export default Lighting;
