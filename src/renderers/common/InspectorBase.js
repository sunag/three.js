class InspectorBase {

	constructor() {

		this._renderer = null;

		this.currentFrame = null;

	}

	get nodeFrame() {

		return this._renderer._nodes.nodeFrame;

	}

	setRenderer( renderer ) {

		this._renderer = renderer;

		return this;

	}

	getRenderer() {

		return this._renderer;

	}

	computeAsync( computeNodes, dispatchSizeOrCount ) { }

	beginCompute( uid, computeNode ) { }

	finishCompute() { }

	beginRender( uid, scene, camera, renderTarget ) { }

	finishRender( uid ) { }

	resolveFrame( frame ) { }

}

export default InspectorBase;
