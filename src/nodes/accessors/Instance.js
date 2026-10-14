
import { Fn } from '../tsl/TSLBase.js';
import { OnAfterObjectUpdate, OnObjectDispose, OnObjectUpdate } from '../utils/EventNode.js';
import { normalLocal, transformNormal } from './Normal.js';
import { positionLocal, positionPrevious } from './Position.js';
import { varyingProperty } from '../core/PropertyNode.js';
import ReferenceAttributeNode, { referenceAttribute } from './ReferenceAttributeNode.js';
import { buffer } from './BufferNode.js';
import { storage } from './StorageBufferNode.js';
import { instanceIndex } from '../core/IndexNode.js';

import { getInstanceBufferCount } from '../../renderers/common/RenderObject.js';

const _previousInstanceMatrices = /*@__PURE__*/ new WeakMap();
const _uniformArrays = /*@__PURE__*/ new WeakMap();

/**
 * Binds an instance attribute that is not a property of the rendered object,
 * like the matrices given to `instance()` or the previous-frame matrices.
 *
 * @private
 * @augments ReferenceAttributeNode
 */
class InstanceAttributeNode extends ReferenceAttributeNode {

	static get type() {

		return 'InstanceAttributeNode';

	}

	/**
	 * Constructs a new instance attribute node.
	 *
	 * @param {Function} resolveAttribute - Returns the attribute of the rendered object.
	 * @param {string} nodeType - The node type.
	 */
	constructor( resolveAttribute, nodeType ) {

		super( '', nodeType );

		/**
		 * Returns the attribute of the rendered object.
		 *
		 * @type {Function}
		 */
		this.resolveAttribute = resolveAttribute;

	}

	getAttribute( object ) {

		return this.resolveAttribute( object );

	}

}

/**
 * Returns the array that is bound as uniform buffer for the given matrices. The uniform array
 * of shared programs can be longer than the matrices, so they are copied into an array of its length
 * whenever their version changes.
 *
 * @param {InstancedBufferAttribute} matrices - The matrix buffer attribute.
 * @param {number} count - The length of the uniform array.
 * @returns {Float32Array} The array of the uniform buffer.
 */
function getUniformArray( matrices, count ) {

	const length = count * 16;

	if ( matrices.array.length === length ) return matrices.array;

	let data = _uniformArrays.get( matrices );

	if ( data === undefined || data.array.length !== length || data.source !== matrices.array ) {

		data = { array: new Float32Array( length ), source: matrices.array, version: - 1 };
		_uniformArrays.set( matrices, data );

	}

	if ( data.version !== matrices.version ) {

		data.array.set( matrices.array.length > length ? matrices.array.subarray( 0, length ) : matrices.array );
		data.version = matrices.version;

	}

	return data.array;

}

/**
 * Creates the node for instanced matrix transformations. Storage matrices are read from a storage buffer.
 * Otherwise, matrices that fit into a uniform buffer are read from one, and from an instanced vertex buffer if not.
 * Both bind the matrices of the rendered object, so the program can be shared between objects.
 *
 * @param {NodeBuilder} builder - The current node builder.
 * @param {InstancedBufferAttribute|StorageInstancedBufferAttribute} matrices - The matrix buffer attribute that defines the layout.
 * @param {Function} getMatrices - Returns the matrix buffer attribute of the rendered object.
 * @returns {Node} The matrix node.
 */
function createInstanceMatrixNode( builder, matrices, getMatrices ) {

	if ( matrices.isStorageInstancedBufferAttribute === true ) {

		// storage matrices are part of the render object cache key, so they are not shared

		return storage( getMatrices( builder.object ), 'mat4', Math.max( matrices.count, 1 ) ).element( instanceIndex );

	}

	const count = getInstanceBufferCount( matrices.count, builder.getUniformBufferLimit() );

	if ( count > 0 ) {

		const matrixBuffer = buffer( new Float32Array( count * 16 ), 'mat4', count );

		OnObjectUpdate( ( { object } ) => {

			matrixBuffer.value = getUniformArray( getMatrices( object ), count );

		} );

		return matrixBuffer.element( instanceIndex );

	}

	return new InstanceAttributeNode( getMatrices, 'mat4' );

}

/**
 * Retrieves or initializes the previous-frame instance matrix attribute for motion vectors.
 *
 * @param {Object3D} object - The rendered object.
 * @param {InstancedBufferAttribute|StorageInstancedBufferAttribute} matrices - The current matrix buffer attribute.
 * @returns {InstancedBufferAttribute|StorageInstancedBufferAttribute} The previous-frame matrix buffer attribute.
 */
function getPreviousMatrix( object, matrices ) {

	let previous = _previousInstanceMatrices.get( object );

	if ( previous === undefined || previous.array.length !== matrices.array.length ) {

		previous = matrices.clone();
		_previousInstanceMatrices.set( object, previous );

	}

	return previous;

}

/**
 * Copies the current matrices into the previous-frame matrices of the given object.
 *
 * @param {Object3D} object - The rendered object.
 * @param {InstancedBufferAttribute|StorageInstancedBufferAttribute} matrices - The current matrix buffer attribute.
 */
function updatePreviousMatrix( object, matrices ) {

	const previous = getPreviousMatrix( object, matrices );

	previous.array.set( matrices.array );
	previous.version = matrices.version;

}

/**
 * Transforms the local position, the previous position and the normal with the instance matrices,
 * and assigns the instance color.
 *
 * @param {NodeBuilder} builder - The current node builder.
 * @param {InstancedBufferAttribute|StorageInstancedBufferAttribute} matrices - The matrix buffer attribute that defines the layout.
 * @param {Function} getMatrices - Returns the matrix buffer attribute of the rendered object.
 * @param {?Node} instanceColorNode - The instance color node.
 */
function setupInstance( builder, matrices, getMatrices, instanceColorNode ) {

	const instanceMatrixNode = createInstanceMatrixNode( builder, matrices, getMatrices );

	// POSITION

	const instancePosition = instanceMatrixNode.mul( positionLocal ).xyz;
	positionLocal.assign( instancePosition );

	if ( builder.needsPreviousData() ) {

		OnAfterObjectUpdate( ( { object } ) => updatePreviousMatrix( object, getMatrices( object ) ) );

		const previousMatrixNode = createInstanceMatrixNode( builder, matrices, object => getPreviousMatrix( object, getMatrices( object ) ) );

		positionPrevious.assign( previousMatrixNode.mul( positionPrevious ).xyz );

		// the previous matrices are created by this program, so it also releases them

		OnObjectDispose( ( { object } ) => {

			const previous = _previousInstanceMatrices.get( object );

			if ( previous !== undefined ) {

				_uniformArrays.delete( previous );
				_previousInstanceMatrices.delete( object );

			}

		} );

	}

	// NORMAL

	if ( builder.hasGeometryAttribute( 'normal' ) ) {

		const instanceNormal = transformNormal( normalLocal, instanceMatrixNode );
		normalLocal.assign( instanceNormal );

	}

	// COLOR

	if ( instanceColorNode !== null ) {

		instanceColor.assign( instanceColorNode );

	}

	// DISPOSE

	OnObjectDispose( ( { object } ) => _uniformArrays.delete( getMatrices( object ) ) );

}

/**
 * Creates the node of storage instance colors.
 *
 * @param {StorageInstancedBufferAttribute} colors - The color buffer attribute.
 * @returns {Node} The color node.
 */
function createStorageColorNode( colors ) {

	// storage colors are part of the render object cache key, so they are not shared

	return storage( colors, 'vec3', Math.max( colors.count, 1 ) ).element( instanceIndex );

}

/**
 * TSL object representing a varying property for the instanced color vector.
 *
 * @type {VaryingNode<vec3>}
 */
export const instanceColor = /*@__PURE__*/ varyingProperty( 'vec3', 'vInstanceColor' );

/**
 * TSL function representing the standard instancing vertex shader setup.
 * Transforms positionLocal and normalLocal, and assigns varying color in-place.
 *
 * @tsl
 * @function
 * @param {InstancedBufferAttribute|StorageInstancedBufferAttribute} matrices - The instanced transformation matrices.
 * @param {?InstancedBufferAttribute|StorageInstancedBufferAttribute} [colors=null] - The optional instanced colors.
 */
export const instance = /*@__PURE__*/ Fn( ( [ matrices, colors = null ], builder ) => {

	let instanceColorNode = null;

	if ( colors ) {

		instanceColorNode = colors.isStorageInstancedBufferAttribute === true ? createStorageColorNode( colors ) : new InstanceAttributeNode( () => colors, 'vec3' );

	}

	setupInstance( builder, matrices, () => matrices, instanceColorNode );

}, 'void' );

/**
 * TSL wrapper for applying instanced mesh rendering setup. The program reads the instance data
 * of the rendered mesh, so it is shared between instanced meshes with the same data layout.
 *
 * @tsl
 * @function
 * @param {InstancedMesh} instancedMesh - The instanced mesh.
 */
export const instancedMesh = /*@__PURE__*/ Fn( ( [ instancedMesh ], builder ) => {

	const colors = instancedMesh.instanceColor;

	let instanceColorNode = null;

	if ( colors !== null ) {

		instanceColorNode = colors.isStorageInstancedBufferAttribute === true ? createStorageColorNode( colors ) : referenceAttribute( 'instanceColor', 'vec3' );

	}

	setupInstance( builder, instancedMesh.instanceMatrix, object => object.instanceMatrix, instanceColorNode );

}, 'void' );
