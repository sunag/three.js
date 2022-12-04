import NodeMaterial from './NodeMaterial.js';
import {
	vec3, vec4, normalView, normalLocal, normalWorld, add, mul
} from '../shadernode/ShaderNodeElements.js';
import { MeshNormalMaterial } from 'three';

const defaultValues = new MeshNormalMaterial();

class MeshNormalNodeMaterial extends NodeMaterial {

	constructor( parameters ) {

		super();

		this.isMeshNormalNodeMaterial = true;

		this.lights = true;

		this.colorNode = null;
		this.opacityNode = null;

		this.alphaTestNode = null;

		this.lightNode = null;

		this.positionNode = null;

		this.setDefaultValues( defaultValues );

		this.setValues( parameters );

	}

	build( builder ) {

		this.generatePosition( builder );

		const diffuseColorNode = vec4( 0, 0, 0, 1 );
		const outgoingLightNode = add( mul( vec3( normalView ), .5 ), .5 );

		this.generateOutput( builder, { diffuseColorNode, outgoingLightNode } );

	}

	copy( source ) {

		this.colorNode = source.colorNode;
		this.opacityNode = source.opacityNode;

		this.alphaTestNode = source.alphaTestNode;

		this.lightNode = source.lightNode;

		this.positionNode = source.positionNode;

		return super.copy( source );

	}

}

export default MeshNormalNodeMaterial;
