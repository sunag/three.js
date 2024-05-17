import Node from '../core/Node.js';
import AssignNode from '../core/AssignNode.js';
import OperatorNode from '../math/OperatorNode.js';
import MathNode from '../math/MathNode.js';
import ArrayElementNode from '../utils/ArrayElementNode.js';
import StorageArrayElementNode from '../utils/StorageArrayElementNode.js';
import ConvertNode from '../utils/ConvertNode.js';
import JoinNode from '../utils/JoinNode.js';
import SplitNode from '../utils/SplitNode.js';
import SetNode from '../utils/SetNode.js';
import ConstNode from '../core/ConstNode.js';
import BypassNode from '../core/BypassNode.js';
import CacheNode from '../core/CacheNode.js';
import ContextNode from '../core/ContextNode.js';
import VarNode from '../core/VarNode.js';
import CodeNode from '../code/CodeNode.js';
import FunctionNode from '../code/FunctionNode.js';
import FunctionCallNode from '../code/FunctionCallNode.js';

import { getValueFromType, getValueType } from '../core/NodeUtils.js';

//

let currentStack = null;

const NodeElements = new Map(); // @TODO: Currently only a few nodes are added, probably also add others

function addNodeElement( name, nodeElement ) {

	if ( NodeElements.has( name ) ) {

		console.warn( `Redefinition of node element ${ name }` );
		return;

	}

	if ( typeof nodeElement !== 'function' ) throw new Error( `Node element ${ name } is not a function` );

	NodeElements.set( name, nodeElement );

}

const parseSwizzle = ( props ) => props.replace( /r|s/g, 'x' ).replace( /g|t/g, 'y' ).replace( /b|p/g, 'z' ).replace( /a|q/g, 'w' );

const shaderNodeHandler = {

	setup( NodeClosure, params ) {

		const inputs = params.shift();

		return NodeClosure( nodeObjects( inputs ), ...params );

	},

	get( node, prop, nodeObj ) {

		if ( typeof prop === 'string' && node[ prop ] === undefined ) {

			if ( node.isStackNode !== true && prop === 'assign' ) {

				return ( ...params ) => {

					currentStack.assign( nodeObj, ...params );

					return nodeObj;

				};

			} else if ( NodeElements.has( prop ) ) {

				const nodeElement = NodeElements.get( prop );

				return node.isStackNode && prop !== 'context' ? ( ...params ) => nodeObj.add( nodeElement( ...params ) ) : ( ...params ) => nodeElement( nodeObj, ...params );

			} else if ( prop === 'self' ) {

				return node;

			} else if ( prop.endsWith( 'Assign' ) && NodeElements.has( prop.slice( 0, prop.length - 'Assign'.length ) ) ) {

				const nodeElement = NodeElements.get( prop.slice( 0, prop.length - 'Assign'.length ) );

				return node.isStackNode ? ( ...params ) => nodeObj.assign( params[ 0 ], nodeElement( ...params ) ) : ( ...params ) => nodeObj.assign( nodeElement( nodeObj, ...params ) );

			} else if ( /^[xyzwrgbastpq]{1,4}$/.test( prop ) === true ) {

				// accessing properties ( swizzle )

				prop = parseSwizzle( prop );

				return nodeObject( new SplitNode( nodeObj, prop ) );

			} else if ( /^set[XYZWRGBASTPQ]{1,4}$/.test( prop ) === true ) {

				// set properties ( swizzle )

				prop = parseSwizzle( prop.slice( 3 ).toLowerCase() );

				// sort to xyzw sequence

				prop = prop.split( '' ).sort().join( '' );

				return ( value ) => nodeObject( new SetNode( node, prop, value ) );

			} else if ( prop === 'width' || prop === 'height' || prop === 'depth' ) {

				// accessing property

				if ( prop === 'width' ) prop = 'x';
				else if ( prop === 'height' ) prop = 'y';
				else if ( prop === 'depth' ) prop = 'z';

				return nodeObject( new SplitNode( node, prop ) );

			} else if ( /^\d+$/.test( prop ) === true ) {

				// accessing array

				return nodeObject( new ArrayElementNode( nodeObj, new ConstNode( Number( prop ), 'uint' ) ) );

			}

		}

		return Reflect.get( node, prop, nodeObj );

	},

	set( node, prop, value, nodeObj ) {

		if ( typeof prop === 'string' && node[ prop ] === undefined ) {

			// setting properties

			if ( /^[xyzwrgbastpq]{1,4}$/.test( prop ) === true || prop === 'width' || prop === 'height' || prop === 'depth' || /^\d+$/.test( prop ) === true ) {

				nodeObj[ prop ].assign( value );

				return true;

			}

		}

		return Reflect.set( node, prop, value, nodeObj );

	}

};

const nodeObjectsCacheMap = new WeakMap();
const nodeBuilderFunctionsCacheMap = new WeakMap();

const ShaderNodeObject = function ( obj, altType = null ) {

	const type = getValueType( obj );

	if ( type === 'node' ) {

		let nodeObject = nodeObjectsCacheMap.get( obj );

		if ( nodeObject === undefined ) {

			nodeObject = new Proxy( obj, shaderNodeHandler );

			nodeObjectsCacheMap.set( obj, nodeObject );
			nodeObjectsCacheMap.set( nodeObject, nodeObject );

		}

		return nodeObject;

	} else if ( ( altType === null && ( type === 'float' || type === 'boolean' ) ) || ( type && type !== 'shader' && type !== 'string' ) ) {

		return nodeObject( getConstNode( obj, altType ) );

	} else if ( type === 'shader' ) {

		return tslFn( obj );

	}

	return obj;

};

const ShaderNodeObjects = function ( objects, altType = null ) {

	for ( const name in objects ) {

		objects[ name ] = nodeObject( objects[ name ], altType );

	}

	return objects;

};

const ShaderNodeArray = function ( array, altType = null ) {

	const len = array.length;

	for ( let i = 0; i < len; i ++ ) {

		array[ i ] = nodeObject( array[ i ], altType );

	}

	return array;

};

const ShaderNodeProxy = function ( NodeClass, scope = null, factor = null, settings = null ) {

	const assignNode = ( node ) => nodeObject( settings !== null ? Object.assign( node, settings ) : node );

	if ( scope === null ) {

		return ( ...params ) => {

			return assignNode( new NodeClass( ...nodeArray( params ) ) );

		};

	} else if ( factor !== null ) {

		factor = nodeObject( factor );

		return ( ...params ) => {

			return assignNode( new NodeClass( scope, ...nodeArray( params ), factor ) );

		};

	} else {

		return ( ...params ) => {

			return assignNode( new NodeClass( scope, ...nodeArray( params ) ) );

		};

	}

};

const ShaderNodeImmutable = function ( NodeClass, ...params ) {

	return nodeObject( new NodeClass( ...nodeArray( params ) ) );

};

class ShaderCallNodeInternal extends Node {

	constructor( shaderNode, inputNodes ) {

		super();

		this.shaderNode = shaderNode;
		this.inputNodes = inputNodes;

	}

	getNodeType( builder ) {

		const properties = builder.getNodeProperties( this );

		if ( properties.outputNode === null ) {

			properties.outputNode = this.setupOutput( builder );

		}

		return properties.outputNode.getNodeType( builder );

	}

	call( builder ) {

		const { shaderNode, inputNodes } = this;

		if ( shaderNode.layout ) {

			let functionNodesCacheMap = nodeBuilderFunctionsCacheMap.get( builder.constructor );

			if ( functionNodesCacheMap === undefined ) {

				functionNodesCacheMap = new WeakMap();

				nodeBuilderFunctionsCacheMap.set( builder.constructor, functionNodesCacheMap );

			}

			let functionNode = functionNodesCacheMap.get( shaderNode );

			if ( functionNode === undefined ) {

				functionNode = nodeObject( builder.buildFunctionNode( shaderNode ) );

				functionNodesCacheMap.set( shaderNode, functionNode );

			}

			if ( builder.currentFunctionNode !== null ) {

				builder.currentFunctionNode.includes.push( functionNode );

			}

			return nodeObject( functionNode.call( inputNodes ) );

		}

		const jsFunc = shaderNode.jsFunc;
		const outputNode = inputNodes !== null ? jsFunc( inputNodes, builder.stack, builder ) : jsFunc( builder.stack, builder );

		return nodeObject( outputNode );

	}

	setup( builder ) {

		const { outputNode } = builder.getNodeProperties( this );

		return outputNode || this.setupOutput( builder );

	}

	setupOutput( builder ) {

		builder.addStack();

		builder.stack.outputNode = this.call( builder );

		return builder.removeStack();

	}

	generate( builder, output ) {

		const { outputNode } = builder.getNodeProperties( this );

		if ( outputNode === null ) {

			// TSL: It's recommended to use `tslFn` in setup() pass.

			return this.call( builder ).build( builder, output );

		}

		return super.generate( builder, output );

	}

}

class ShaderNodeInternal extends Node {

	constructor( jsFunc ) {

		super();

		this.jsFunc = jsFunc;
		this.layout = null;

	}

	get isArrayInput() {

		return /^\((\s+)?\[/.test( this.jsFunc.toString() );

	}

	setLayout( layout ) {

		this.layout = layout;

		return this;

	}

	call( inputs = null ) {

		nodeObjects( inputs );

		return nodeObject( new ShaderCallNodeInternal( this, inputs ) );

	}

	setup() {

		return this.call();

	}

}

const bools = [ false, true ];
const uints = [ 0, 1, 2, 3 ];
const ints = [ - 1, - 2 ];
const floats = [ 0.5, 1.5, 1 / 3, 1e-6, 1e6, Math.PI, Math.PI * 2, 1 / Math.PI, 2 / Math.PI, 1 / ( Math.PI * 2 ), Math.PI / 2 ];

const boolsCacheMap = new Map();
for ( const bool of bools ) boolsCacheMap.set( bool, new ConstNode( bool ) );

const uintsCacheMap = new Map();
for ( const uint of uints ) uintsCacheMap.set( uint, new ConstNode( uint, 'uint' ) );

const intsCacheMap = new Map( [ ...uintsCacheMap ].map( el => new ConstNode( el.value, 'int' ) ) );
for ( const int of ints ) intsCacheMap.set( int, new ConstNode( int, 'int' ) );

const floatsCacheMap = new Map( [ ...intsCacheMap ].map( el => new ConstNode( el.value ) ) );
for ( const float of floats ) floatsCacheMap.set( float, new ConstNode( float ) );
for ( const float of floats ) floatsCacheMap.set( - float, new ConstNode( - float ) );

const cacheMaps = { bool: boolsCacheMap, uint: uintsCacheMap, ints: intsCacheMap, float: floatsCacheMap };

const constNodesCacheMap = new Map( [ ...boolsCacheMap, ...floatsCacheMap ] );

const getConstNode = ( value, type ) => {

	if ( constNodesCacheMap.has( value ) ) {

		return constNodesCacheMap.get( value );

	} else if ( value.isNode === true ) {

		return value;

	} else {

		return new ConstNode( value, type );

	}

};

const safeGetNodeType = ( node ) => {

	try {

		return node.getNodeType();

	} catch ( _ ) {

		return undefined;

	}

};

const ConvertType = function ( type, cacheMap = null ) {

	return ( ...params ) => {

		if ( params.length === 0 || ( ! [ 'bool', 'float', 'int', 'uint' ].includes( type ) && params.every( param => typeof param !== 'object' ) ) ) {

			params = [ getValueFromType( type, ...params ) ];

		}

		if ( params.length === 1 && cacheMap !== null && cacheMap.has( params[ 0 ] ) ) {

			return nodeObject( cacheMap.get( params[ 0 ] ) );

		}

		if ( params.length === 1 ) {

			const node = getConstNode( params[ 0 ], type );
			if ( safeGetNodeType( node ) === type ) return nodeObject( node );
			return nodeObject( new ConvertNode( node, type ) );

		}

		const nodes = params.map( param => getConstNode( param ) );
		return nodeObject( new JoinNode( nodes, type ) );

	};

};

// exports

export const defined = ( value ) => value && value.value;

// utils

export const getConstNodeType = ( value ) => ( value !== undefined && value !== null ) ? ( value.nodeType || value.convertTo || ( typeof value === 'string' ? value : null ) ) : null;

// shader node base

export function ShaderNode( jsFunc ) {

	return new Proxy( new ShaderNodeInternal( jsFunc ), shaderNodeHandler );

}

export const nodeObject = ( val, altType = null ) => /* new */ ShaderNodeObject( val, altType );
export const nodeObjects = ( val, altType = null ) => new ShaderNodeObjects( val, altType );
export const nodeArray = ( val, altType = null ) => new ShaderNodeArray( val, altType );
export const nodeProxy = ( ...params ) => new ShaderNodeProxy( ...params );
export const nodeImmutable = ( ...params ) => new ShaderNodeImmutable( ...params );

export const tslFn = ( jsFunc ) => {

	const shaderNode = new ShaderNode( jsFunc );

	const fn = ( ...params ) => {

		let inputs;

		nodeObjects( params );

		if ( params[ 0 ] && params[ 0 ].isNode ) {

			inputs = [ ...params ];

		} else {

			inputs = params[ 0 ];

		}

		return shaderNode.call( inputs );

	};

	fn.shaderNode = shaderNode;
	fn.setLayout = ( layout ) => {

		shaderNode.setLayout( layout );

		return fn;

	};

	return fn;

};

//

export const setCurrentStack = ( stack ) => {

	if ( currentStack === stack ) {

		//throw new Error( 'Stack already defined.' );

	}

	currentStack = stack;

};

export const getCurrentStack = () => currentStack;

export function append( node ) {

	if ( currentStack ) currentStack.add( node );

	return node;

}

addNodeElement( 'append', append );

//
// Types
//

export const color = new ConvertType( 'color' );

export const float = new ConvertType( 'float', cacheMaps.float );
export const int = new ConvertType( 'int', cacheMaps.ints );
export const uint = new ConvertType( 'uint', cacheMaps.uint );
export const bool = new ConvertType( 'bool', cacheMaps.bool );

export const vec2 = new ConvertType( 'vec2' );
export const ivec2 = new ConvertType( 'ivec2' );
export const uvec2 = new ConvertType( 'uvec2' );
export const bvec2 = new ConvertType( 'bvec2' );

export const vec3 = new ConvertType( 'vec3' );
export const ivec3 = new ConvertType( 'ivec3' );
export const uvec3 = new ConvertType( 'uvec3' );
export const bvec3 = new ConvertType( 'bvec3' );

export const vec4 = new ConvertType( 'vec4' );
export const ivec4 = new ConvertType( 'ivec4' );
export const uvec4 = new ConvertType( 'uvec4' );
export const bvec4 = new ConvertType( 'bvec4' );

export const mat2 = new ConvertType( 'mat2' );
export const imat2 = new ConvertType( 'imat2' );
export const umat2 = new ConvertType( 'umat2' );
export const bmat2 = new ConvertType( 'bmat2' );

export const mat3 = new ConvertType( 'mat3' );
export const imat3 = new ConvertType( 'imat3' );
export const umat3 = new ConvertType( 'umat3' );
export const bmat3 = new ConvertType( 'bmat3' );

export const mat4 = new ConvertType( 'mat4' );
export const imat4 = new ConvertType( 'imat4' );
export const umat4 = new ConvertType( 'umat4' );
export const bmat4 = new ConvertType( 'bmat4' );

export const string = ( value = '' ) => nodeObject( new ConstNode( value, 'string' ) );
export const arrayBuffer = ( value ) => nodeObject( new ConstNode( value, 'ArrayBuffer' ) );

addNodeElement( 'toColor', color );
addNodeElement( 'toFloat', float );
addNodeElement( 'toInt', int );
addNodeElement( 'toUint', uint );
addNodeElement( 'toBool', bool );
addNodeElement( 'toVec2', vec2 );
addNodeElement( 'toIvec2', ivec2 );
addNodeElement( 'toUvec2', uvec2 );
addNodeElement( 'toBvec2', bvec2 );
addNodeElement( 'toVec3', vec3 );
addNodeElement( 'toIvec3', ivec3 );
addNodeElement( 'toUvec3', uvec3 );
addNodeElement( 'toBvec3', bvec3 );
addNodeElement( 'toVec4', vec4 );
addNodeElement( 'toIvec4', ivec4 );
addNodeElement( 'toUvec4', uvec4 );
addNodeElement( 'toBvec4', bvec4 );
addNodeElement( 'toMat2', mat2 );
addNodeElement( 'toImat2', imat2 );
addNodeElement( 'toUmat2', umat2 );
addNodeElement( 'toBmat2', bmat2 );
addNodeElement( 'toMat3', mat3 );
addNodeElement( 'toImat3', imat3 );
addNodeElement( 'toUmat3', umat3 );
addNodeElement( 'toBmat3', bmat3 );
addNodeElement( 'toMat4', mat4 );
addNodeElement( 'toImat4', imat4 );
addNodeElement( 'toUmat4', umat4 );
addNodeElement( 'toBmat4', bmat4 );

// basic nodes
// HACK - we cannot export them from the corresponding files because of the cyclic dependency
export const element = nodeProxy( ArrayElementNode );
export const storageElement = nodeProxy( StorageArrayElementNode );

export const convert = ( node, types ) => nodeObject( new ConvertNode( nodeObject( node ), types ) );
export const split = ( node, channels ) => nodeObject( new SplitNode( nodeObject( node ), channels ) );

addNodeElement( 'element', element );
addNodeElement( 'storageElement', storageElement );

addNodeElement( 'convert', convert );

//
// Code
//

export const code = nodeProxy( CodeNode );

export const js = ( src, includes ) => code( src, includes, 'js' );
export const wgsl = ( src, includes ) => code( src, includes, 'wgsl' );
export const glsl = ( src, includes ) => code( src, includes, 'glsl' );

//
// Function
//

const nativeFn = ( code, includes = [], language = '' ) => {

	for ( let i = 0; i < includes.length; i ++ ) {

		const include = includes[ i ];

		// TSL Function: glslFn, wgslFn

		if ( typeof include === 'function' ) {

			includes[ i ] = include.functionNode;

		}

	}

	const functionNode = nodeObject( new FunctionNode( code, includes, language ) );

	const fn = ( ...params ) => functionNode.call( ...params );
	fn.functionNode = functionNode;

	return fn;

};

export const glslFn = ( code, includes ) => nativeFn( code, includes, 'glsl' );
export const wgslFn = ( code, includes ) => nativeFn( code, includes, 'wgsl' );

//
// Function Call
//

export const call = ( func, ...params ) => {

	params = params.length > 1 || ( params[ 0 ] && params[ 0 ].isNode === true ) ? nodeArray( params ) : nodeObjects( params[ 0 ] );

	return nodeObject( new FunctionCallNode( nodeObject( func ), params ) );

};

addNodeElement( 'call', call );

//
// Variable
//

export const createVar = nodeProxy( VarNode );

addNodeElement( 'toVar', ( ...params ) => createVar( ...params ).append() );

//
// Bypass
//

export const bypass = nodeProxy( BypassNode );

addNodeElement( 'bypass', bypass );

//
// Cache
//

export const cache = nodeProxy( CacheNode );

addNodeElement( 'cache', cache );

//
// Context
//

export const context = nodeProxy( ContextNode );
export const label = ( node, name ) => context( node, { label: name } );

addNodeElement( 'context', context );
addNodeElement( 'label', label );

//
// Assign
//

export const assign = nodeProxy( AssignNode );

addNodeElement( 'assign', assign );

//
// Operators
//

export const add = nodeProxy( OperatorNode, '+' );
export const sub = nodeProxy( OperatorNode, '-' );
export const mul = nodeProxy( OperatorNode, '*' );
export const div = nodeProxy( OperatorNode, '/' );
export const remainder = nodeProxy( OperatorNode, '%' );
export const equal = nodeProxy( OperatorNode, '==' );
export const notEqual = nodeProxy( OperatorNode, '!=' );
export const lessThan = nodeProxy( OperatorNode, '<' );
export const greaterThan = nodeProxy( OperatorNode, '>' );
export const lessThanEqual = nodeProxy( OperatorNode, '<=' );
export const greaterThanEqual = nodeProxy( OperatorNode, '>=' );
export const and = nodeProxy( OperatorNode, '&&' );
export const or = nodeProxy( OperatorNode, '||' );
export const not = nodeProxy( OperatorNode, '!' );
export const xor = nodeProxy( OperatorNode, '^^' );
export const bitAnd = nodeProxy( OperatorNode, '&' );
export const bitNot = nodeProxy( OperatorNode, '~' );
export const bitOr = nodeProxy( OperatorNode, '|' );
export const bitXor = nodeProxy( OperatorNode, '^' );
export const shiftLeft = nodeProxy( OperatorNode, '<<' );
export const shiftRight = nodeProxy( OperatorNode, '>>' );

addNodeElement( 'add', add );
addNodeElement( 'sub', sub );
addNodeElement( 'mul', mul );
addNodeElement( 'div', div );
addNodeElement( 'remainder', remainder );
addNodeElement( 'equal', equal );
addNodeElement( 'notEqual', notEqual );
addNodeElement( 'lessThan', lessThan );
addNodeElement( 'greaterThan', greaterThan );
addNodeElement( 'lessThanEqual', lessThanEqual );
addNodeElement( 'greaterThanEqual', greaterThanEqual );
addNodeElement( 'and', and );
addNodeElement( 'or', or );
addNodeElement( 'not', not );
addNodeElement( 'xor', xor );
addNodeElement( 'bitAnd', bitAnd );
addNodeElement( 'bitNot', bitNot );
addNodeElement( 'bitOr', bitOr );
addNodeElement( 'bitXor', bitXor );
addNodeElement( 'shiftLeft', shiftLeft );
addNodeElement( 'shiftRight', shiftRight );

//
// Math
//

export const EPSILON = /*#__PURE__*/ float( 1e-6 );
export const INFINITY = /*#__PURE__*/ float( 1e6 );
export const PI = /*#__PURE__*/ float( Math.PI );
export const PI2 = /*#__PURE__*/ float( Math.PI * 2 );

export const all = nodeProxy( MathNode, MathNode.ALL );
export const any = nodeProxy( MathNode, MathNode.ANY );
export const equals = nodeProxy( MathNode, MathNode.EQUALS );

export const radians = nodeProxy( MathNode, MathNode.RADIANS );
export const degrees = nodeProxy( MathNode, MathNode.DEGREES );
export const exp = nodeProxy( MathNode, MathNode.EXP );
export const exp2 = nodeProxy( MathNode, MathNode.EXP2 );
export const log = nodeProxy( MathNode, MathNode.LOG );
export const log2 = nodeProxy( MathNode, MathNode.LOG2 );
export const sqrt = nodeProxy( MathNode, MathNode.SQRT );
export const inverseSqrt = nodeProxy( MathNode, MathNode.INVERSE_SQRT );
export const floor = nodeProxy( MathNode, MathNode.FLOOR );
export const ceil = nodeProxy( MathNode, MathNode.CEIL );
export const normalize = nodeProxy( MathNode, MathNode.NORMALIZE );
export const fract = nodeProxy( MathNode, MathNode.FRACT );
export const sin = nodeProxy( MathNode, MathNode.SIN );
export const cos = nodeProxy( MathNode, MathNode.COS );
export const tan = nodeProxy( MathNode, MathNode.TAN );
export const asin = nodeProxy( MathNode, MathNode.ASIN );
export const acos = nodeProxy( MathNode, MathNode.ACOS );
export const atan = nodeProxy( MathNode, MathNode.ATAN );
export const abs = nodeProxy( MathNode, MathNode.ABS );
export const sign = nodeProxy( MathNode, MathNode.SIGN );
export const length = nodeProxy( MathNode, MathNode.LENGTH );
export const negate = nodeProxy( MathNode, MathNode.NEGATE );
export const dFdx = nodeProxy( MathNode, MathNode.DFDX );
export const dFdy = nodeProxy( MathNode, MathNode.DFDY );
export const round = nodeProxy( MathNode, MathNode.ROUND );
export const trunc = nodeProxy( MathNode, MathNode.TRUNC );
export const fwidth = nodeProxy( MathNode, MathNode.FWIDTH );
export const bitcast = nodeProxy( MathNode, MathNode.BITCAST );

export const atan2 = nodeProxy( MathNode, MathNode.ATAN2 );
export const min = nodeProxy( MathNode, MathNode.MIN );
export const max = nodeProxy( MathNode, MathNode.MAX );
export const mod = nodeProxy( MathNode, MathNode.MOD );
export const step = nodeProxy( MathNode, MathNode.STEP );
export const reflect = nodeProxy( MathNode, MathNode.REFLECT );
export const distance = nodeProxy( MathNode, MathNode.DISTANCE );
export const dot = nodeProxy( MathNode, MathNode.DOT );
export const cross = nodeProxy( MathNode, MathNode.CROSS );
export const pow = nodeProxy( MathNode, MathNode.POW );
export const pow2 = nodeProxy( MathNode, MathNode.POW, 2 );
export const pow3 = nodeProxy( MathNode, MathNode.POW, 3 );
export const pow4 = nodeProxy( MathNode, MathNode.POW, 4 );

export const cbrt = ( a ) => mul( sign( a ), pow( abs( a ), 1.0 / 3.0 ) );
export const lengthSq = ( a ) => dot( a, a );
export const mix = nodeProxy( MathNode, MathNode.MIX );
export const clamp = ( value, low = 0, high = 1 ) => nodeObject( new MathNode( MathNode.CLAMP, nodeObject( value ), nodeObject( low ), nodeObject( high ) ) );
export const saturate = ( value ) => clamp( value );
export const refract = nodeProxy( MathNode, MathNode.REFRACT );
export const smoothstep = nodeProxy( MathNode, MathNode.SMOOTHSTEP );
export const faceForward = nodeProxy( MathNode, MathNode.FACEFORWARD );

export const oneMinus = ( a ) => sub( 1.0, a );
export const reciprocal = ( a ) => div( 1.0, a );
export const difference = ( a, b ) => abs( sub( a, b ) );
export const transformDirection = tslFn( ( [ a, b ], stack, builder ) => {

	// dir can be either a direction vector or a normal vector
	// upper-left 3x3 of matrix is assumed to be orthogonal

	let tA = a;
	let tB = b;

	if ( builder.isMatrix( tA.getNodeType( builder ) ) ) {

		tB = vec4( vec3( tB ), 0.0 );

	} else {

		tA = vec4( vec3( tA ), 0.0 );

	}

	return tA.mul( tB ).xyz.normalize();

} );

export const mixElement = ( t, e1, e2 ) => mix( e1, e2, t );
export const smoothstepElement = ( x, low, high ) => smoothstep( low, high, x );

addNodeElement( 'all', all );
addNodeElement( 'any', any );
addNodeElement( 'equals', equals );

addNodeElement( 'radians', radians );
addNodeElement( 'degrees', degrees );
addNodeElement( 'exp', exp );
addNodeElement( 'exp2', exp2 );
addNodeElement( 'log', log );
addNodeElement( 'log2', log2 );
addNodeElement( 'sqrt', sqrt );
addNodeElement( 'inverseSqrt', inverseSqrt );
addNodeElement( 'floor', floor );
addNodeElement( 'ceil', ceil );
addNodeElement( 'normalize', normalize );
addNodeElement( 'fract', fract );
addNodeElement( 'sin', sin );
addNodeElement( 'cos', cos );
addNodeElement( 'tan', tan );
addNodeElement( 'asin', asin );
addNodeElement( 'acos', acos );
addNodeElement( 'atan', atan );
addNodeElement( 'abs', abs );
addNodeElement( 'sign', sign );
addNodeElement( 'length', length );
addNodeElement( 'lengthSq', lengthSq );
addNodeElement( 'negate', negate );
addNodeElement( 'oneMinus', oneMinus );
addNodeElement( 'dFdx', dFdx );
addNodeElement( 'dFdy', dFdy );
addNodeElement( 'round', round );
addNodeElement( 'reciprocal', reciprocal );
addNodeElement( 'trunc', trunc );
addNodeElement( 'fwidth', fwidth );
addNodeElement( 'atan2', atan2 );
addNodeElement( 'min', min );
addNodeElement( 'max', max );
addNodeElement( 'mod', mod );
addNodeElement( 'step', step );
addNodeElement( 'reflect', reflect );
addNodeElement( 'distance', distance );
addNodeElement( 'dot', dot );
addNodeElement( 'cross', cross );
addNodeElement( 'pow', pow );
addNodeElement( 'pow2', pow2 );
addNodeElement( 'pow3', pow3 );
addNodeElement( 'pow4', pow4 );
addNodeElement( 'transformDirection', transformDirection );
addNodeElement( 'mix', mixElement );
addNodeElement( 'clamp', clamp );
addNodeElement( 'refract', refract );
addNodeElement( 'smoothstep', smoothstepElement );
addNodeElement( 'faceForward', faceForward );
addNodeElement( 'difference', difference );
addNodeElement( 'saturate', saturate );
addNodeElement( 'cbrt', cbrt );
