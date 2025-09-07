class AbstractInspector {

	constructor() {

		this.renderer = null;

		this.currentFrame = null;
		

	}

	get nodeFrame() {

		return this.renderer._nodes.nodeFrame;

	}

	beginCompute( uid, computeNode ) { }

	finishCompute() { }

	beginRender( uid, scene, camera, renderTarget ) { }

	finishRender( uid ) { }

	resolveFrame( frame ) { }

}

export default AbstractInspector;
