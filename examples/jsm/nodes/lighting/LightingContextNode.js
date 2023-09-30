import ContextNode from '../core/ContextNode.js';
import { add } from '../math/OperatorNode.js';
import { mix } from '../math/MathNode.js';
import { addNodeClass } from '../core/Node.js';
import { addNodeElement, nodeProxy, float, vec3 } from '../shadernode/ShaderNode.js';

class LightingContextNode extends ContextNode {

	constructor( node, lightingModel = null, backdropNode = null, backdropAlphaNode = null ) {

		super( node );

		this.lightingModel = lightingModel;
		this.backdropNode = backdropNode;
		this.backdropAlphaNode = backdropAlphaNode;

	}

	getNodeType( /*builder*/ ) {

		return 'vec3';

	}

	construct( builder ) {

		const { lightingModel, backdropNode, backdropAlphaNode } = this;

		const context = this.context = {}; // reset context
		const properties = builder.getNodeProperties( this );

		const directDiffuse = vec3().temp( 'directDiffuse' ),
			directSpecular = vec3().temp( 'directSpecular' ),
			indirectDiffuse = vec3().temp( 'indirectDiffuse' ),
			indirectSpecular = vec3().temp( 'indirectSpecular' );

		let totalDiffuse = add( directDiffuse, indirectDiffuse );

		if ( backdropNode !== null ) {

			totalDiffuse = vec3( backdropAlphaNode !== null ? mix( totalDiffuse, backdropNode, backdropAlphaNode ) : backdropNode );

		}

		const totalSpecular = add( directSpecular, indirectSpecular );
		const total = add( totalDiffuse, totalSpecular ).temp( 'reflectedLight' );

		const reflectedLight = {
			directDiffuse,
			directSpecular,
			indirectDiffuse,
			indirectSpecular,
			total
		};

		const lighting = {
			radiance: vec3().temp( 'radiance' ),
			irradiance: vec3().temp( 'irradiance' ),
			iblIrradiance: vec3().temp( 'iblIrradiance' ),
			ambientOcclusion: float( 1 ).temp( 'ambientOcclusion' )
		};

		context.reflectedLight = reflectedLight;
		context.lightingModel = lightingModel || context.lightingModel;

		Object.assign( properties, reflectedLight, lighting );
		Object.assign( context, lighting );

		//const stack = builder.addStack();
		const stack = builder.stack;

		stack.assign( total, 1 );

		stack.if( total.x.lessThan( 0 ), () => {


		} );

		if ( lightingModel ) {

			lightingModel.init( context, builder.stack, builder );

			lightingModel.indirectDiffuse( context, builder.stack, builder );
			lightingModel.indirectSpecular( context, builder.stack, builder );
			lightingModel.ambientOcclusion( context, builder.stack, builder );

		}

		//builder.removeStack();


		stack.construct( builder );


		properties.stack = stack;
		this.context.stack = stack;

		//return builder.stack.bypass( node ).bypass( context.reflectedLight.total );

		return super.construct( builder );

	}

	generate( builder ) {

		const { context } = this;
		const type = this.getNodeType( builder );

		

		this.context.stack.build( builder, 'void' );

		super.generate( builder, type );

		return context.reflectedLight.total.build( builder, type );

	}

}

export default LightingContextNode;

export const lightingContext = nodeProxy( LightingContextNode );

addNodeElement( 'lightingContext', lightingContext );

addNodeClass( LightingContextNode );
