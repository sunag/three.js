import ChainMap from './ChainMap.js';
import RenderContext from './RenderContext.js';
import { Scene } from '../../scenes/Scene.js';
import { Camera } from '../../cameras/Camera.js';

const _chainKeys = [];
const _defaultScene = /*@__PURE__*/ new Scene();
const _defaultCamera = /*@__PURE__*/ new Camera();

/**
 * This module manages the render contexts of the renderer.
 *
 * @private
 */
class RenderContexts {

	/**
	 * Constructs a new render context management component.
	 */
	constructor() {

		/**
		 * A dictionary that manages render contexts in chain maps
		 * for each attachment state.
		 *
		 * @type {Object<string,ChainMap>}
		 */
		this.chainMaps = {};

	}

	/**
	 * Returns a render context for the given scene, camera and render target.
	 *
	 * @param {Scene} scene - The scene.
	 * @param {Camera} camera - The camera that is used to render the scene.
	 * @param {?RenderTarget} [renderTarget=null] - The active render target.
	 * @param {?NodeHandler} [handler=null] - The node handler that is used to handle nodes in the scene.
	 * @return {RenderContext} The render context.
	 */
	get( scene, camera, renderTarget = null, handler = null ) {

		let keyIndex = 0;

		if ( handler !== null ) {

			_chainKeys[ keyIndex ++ ] = handler;

		}

		_chainKeys[ keyIndex ++ ] = scene;
		_chainKeys[ keyIndex ++ ] = camera;

		let attachmentState;

		if ( renderTarget === null ) {

			attachmentState = 'default';

		} else {

			const format = renderTarget.texture.format;
			const count = renderTarget.textures.length;

			attachmentState = `${ count }:${ format }:${ renderTarget.samples }:${ renderTarget.depthBuffer }:${ renderTarget.stencilBuffer }`;

		}

		const chainMap = this._getChainMap( attachmentState );

		let renderState = chainMap.get( _chainKeys );

		if ( renderState === undefined ) {

			renderState = new RenderContext();
			renderState.handler = handler;

			chainMap.set( _chainKeys, renderState );

		}

		_chainKeys.length = 0;

		if ( renderTarget !== null ) renderState.sampleCount = renderTarget.samples === 0 ? 1 : renderTarget.samples;

		return renderState;

	}

	/**
	 * Returns a render context intended for clear operations.
	 *
	 * @param {?RenderTarget} [renderTarget=null] - The active render target.
	 * @return {RenderContext} The render context.
	 */
	getForClear( renderTarget = null ) {

		return this.get( _defaultScene, _defaultCamera, renderTarget );

	}

	/**
	 * Returns a chain map for the given attachment state.
	 *
	 * @private
	 * @param {string} attachmentState - The attachment state.
	 * @return {ChainMap} The chain map.
	 */
	_getChainMap( attachmentState ) {

		return this.chainMaps[ attachmentState ] || ( this.chainMaps[ attachmentState ] = new ChainMap() );

	}

	/**
	 * Frees internal resources.
	 */
	dispose() {

		this.chainMaps = {};

	}

}

export default RenderContexts;
