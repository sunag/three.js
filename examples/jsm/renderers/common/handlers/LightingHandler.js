class LightingHandler {

	constructor() {

		this.renderer = null;
		this.lightingModel = null;

	}

	direct( ...params ) {

		this.lightingModel.direct( ...params );

	}

	indirectDiffuse( ...params ) {

		this.lightingModel.indirectDiffuse( ...params );

	}

	indirectSpecular( ...params ) {

		this.lightingModel.indirectSpecular( ...params );

	}

	ambientOcclusion( ...params ) {

		this.lightingModel.ambientOcclusion( ...params );

	}

	start( context, stack, builder ) {

		this.lightingModel.start( context, stack, builder );

	}

	finish( context, stack, builder ) {

		this.lightingModel.finish( context, stack, builder );

	}

	setup( { renderer, lightingModel } ) {

		this.renderer = renderer;
		this.lightingModel = lightingModel;



	}

}

export default LightingHandler;
