import BufferNode from './BufferNode.js';
import { error } from '../../utils.js';
import { NodeUpdateType } from '../core/constants.js';
import StructTypeNode from '../core/StructTypeNode.js';
import { getStructLayoutDescriptor, getValueType } from '../core/NodeUtils.js';

function getUniformType( uniform ) {

	return uniform.nodeType || getValueType( uniform.value );

}

class UniformsBufferNode extends BufferNode {

	constructor( name = null ) {

		super( null, 'buffer' );

		this.name = '_' + name;

		this.uniforms = [];

		this._dataViews = null;
		this._structTypeNode = null;
		this._uniformsData = new Map();
		this._structVersion = 0;

		this.updateType = NodeUpdateType.RENDER;

		this.isUniformsBufferNode = true;

		this.needsUpdate = true;

	}

	getNodeType( builder ) {

		if ( this._structVersion !== this.version ) this.buildBuffer( builder );

		return this._structTypeNode.getNodeType( builder );

	}

	addUniform( uniform ) {

		this.uniforms.push( uniform );

		this.needsUpdate = true;

		return this;

	}

	setup( builder ) {

		return super.setup( builder );

	}

	generate( builder, output ) {

		if ( this._structVersion !== this.version ) this.buildBuffer( builder );

		return super.generate( builder, output );

	}

	getUniformName( builder, uniform ) {

		const index = this.uniforms.indexOf( uniform );

		return uniform.getName( builder ) || ( 'u' + index );

	}

	getUniformProperty( builder, uniform ) {

		const name = this.getUniformName( builder, uniform );

		return this.name + '.' + name;

	}

	buildBuffer( builder ) {

		const uniformsData = new Map();

		// Build members array for layout calculation
		const membersArray = [];

		for ( const uniform of this.uniforms ) {

			const name = this.getUniformName( builder, uniform );
			const type = uniform.getNodeType( builder );

			membersArray.push( { name, type, uniform } );

		}

		// Calculate layout using the shared function
		const { members, byteLength } = getStructLayoutDescriptor( membersArray );

		// Build members object and uniformsData map
		const membersObject = {};

		for ( let i = 0; i < members.length; i ++ ) {

			const layout = members[ i ];
			const uniform = membersArray[ i ].uniform;

			uniformsData.set( uniform, {
				type: layout.type,
				name: layout.name,
				offset: layout.offset,
				node: uniform,
				update: this._getUpdate( layout.type )
			} );

			membersObject[ layout.name ] = layout.type;

		}

		const buffer = new Float32Array( new ArrayBuffer( byteLength * Float32Array.BYTES_PER_ELEMENT ) );

		this._dataViews = {};
		this._structTypeNode = new StructTypeNode( membersObject, this.name + 'Struct' );
		this._uniformsData = uniformsData;
		this._structVersion = this.version;

		this.value = buffer;
		this.structTypeNode = this._structTypeNode;

	}

	update() {

		let updated = false;

		for ( const uniformData of this._uniformsData.values() ) {

			if ( uniformData.update.call( this, uniformData ) === true ) {

				updated = true;

			}

		}

		//return updated;

	}

	_getUpdate( type ) {

		let updateFn = null;

		if ( /^(float|int|uint)$/.test( type ) ) updateFn = this._updateNumber;
		else if ( /^[ui]?vec2$/.test( type ) ) updateFn = this._updateVector2;
		else if ( /^[ui]?vec3$/.test( type ) ) updateFn = this._updateVector3;
		else if ( /^[ui]?vec4$/.test( type ) ) updateFn = this._updateVector4;
		else if ( type === 'color' ) updateFn = this._updateColor;
		else if ( type === 'mat3' ) updateFn = this._updateMatrix3;
		else if ( type === 'mat4' ) updateFn = this._updateMatrix4;
		else {

			error( 'UniformsBufferNode: Unsupported uniform type.', type );

		}

		return updateFn;

	}

	_updateNumber( uniformData ) {

		let updated = false;

		const a = this.value;
		const v = uniformData.node.value;
		const offset = uniformData.offset;
		const type = uniformData.type; // Default to float if getType not available

		if ( a[ offset ] !== v ) {

			const b = this._getBufferForType( type );

			b[ offset ] = a[ offset ] = v;
			updated = true;

		}

		return updated;

	}

	_updateVector2( uniformData ) {

		let updated = false;

		const a = this.value;
		const v = uniformData.node.value;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( a[ offset + 0 ] !== v.x || a[ offset + 1 ] !== v.y ) {

			const b = this._getBufferForType( type );

			b[ offset + 0 ] = a[ offset + 0 ] = v.x;
			b[ offset + 1 ] = a[ offset + 1 ] = v.y;

			updated = true;

		}

		return updated;

	}

	_updateVector3( uniformData ) {

		let updated = false;

		const a = this.value;
		const v = uniformData.node.value;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( a[ offset + 0 ] !== v.x || a[ offset + 1 ] !== v.y || a[ offset + 2 ] !== v.z ) {

			const b = this._getBufferForType( type );

			b[ offset + 0 ] = a[ offset + 0 ] = v.x;
			b[ offset + 1 ] = a[ offset + 1 ] = v.y;
			b[ offset + 2 ] = a[ offset + 2 ] = v.z;

			updated = true;

		}

		return updated;

	}

	_updateVector4( uniformData ) {

		let updated = false;

		const a = this.value;
		const v = uniformData.node.value;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( a[ offset + 0 ] !== v.x || a[ offset + 1 ] !== v.y || a[ offset + 2 ] !== v.z || a[ offset + 3 ] !== v.w ) {

			const b = this._getBufferForType( type );

			b[ offset + 0 ] = a[ offset + 0 ] = v.x;
			b[ offset + 1 ] = a[ offset + 1 ] = v.y;
			b[ offset + 2 ] = a[ offset + 2 ] = v.z;
			b[ offset + 3 ] = a[ offset + 3 ] = v.w;

			updated = true;

		}

		return updated;

	}

	_updateColor( uniformData ) {

		let updated = false;

		const a = this.value;
		const c = uniformData.node.value;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( a[ offset + 0 ] !== c.r || a[ offset + 1 ] !== c.g || a[ offset + 2 ] !== c.b ) {

			const b = this._getBufferForType( type );

			b[ offset + 0 ] = a[ offset + 0 ] = c.r;
			b[ offset + 1 ] = a[ offset + 1 ] = c.g;
			b[ offset + 2 ] = a[ offset + 2 ] = c.b;

			updated = true;

		}

		return updated;

	}

	_updateMatrix3( uniformData ) {

		let updated = false;

		const a = this.value;
		const e = uniformData.node.value.elements;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( a[ offset + 0 ] !== e[ 0 ] || a[ offset + 1 ] !== e[ 1 ] || a[ offset + 2 ] !== e[ 2 ] ||
			a[ offset + 4 ] !== e[ 3 ] || a[ offset + 5 ] !== e[ 4 ] || a[ offset + 6 ] !== e[ 5 ] ||
			a[ offset + 8 ] !== e[ 6 ] || a[ offset + 9 ] !== e[ 7 ] || a[ offset + 10 ] !== e[ 8 ] ) {

			const b = this._getBufferForType( type );

			b[ offset + 0 ] = a[ offset + 0 ] = e[ 0 ];
			b[ offset + 1 ] = a[ offset + 1 ] = e[ 1 ];
			b[ offset + 2 ] = a[ offset + 2 ] = e[ 2 ];
			b[ offset + 4 ] = a[ offset + 4 ] = e[ 3 ];
			b[ offset + 5 ] = a[ offset + 5 ] = e[ 4 ];
			b[ offset + 6 ] = a[ offset + 6 ] = e[ 5 ];
			b[ offset + 8 ] = a[ offset + 8 ] = e[ 6 ];
			b[ offset + 9 ] = a[ offset + 9 ] = e[ 7 ];
			b[ offset + 10 ] = a[ offset + 10 ] = e[ 8 ];

			updated = true;

		}

		return updated;

	}

	_updateMatrix4( uniformData ) {

		let updated = false;

		const a = this.value;
		const e = uniformData.node.value.elements;
		const offset = uniformData.offset;
		const type = uniformData.type;

		if ( arraysEqual( a, e, offset ) === false ) {

			const b = this._getBufferForType( type );
			b.set( e, offset );
			setArray( a, e, offset );
			updated = true;

		}

		return updated;

	}

	_getBufferForType( type ) {

		let dataView = this.value;

		if ( /^i(nt|vec[234])$/.test( type ) ) {

			dataView = this._dataViews.int32Array || ( this._dataViews.int32Array = new Int32Array( dataView.buffer ) );

		} else if ( /^u(int|vec[234])$/.test( type ) ) {

			dataView = this._dataViews.uint32Array || ( this._dataViews.uint32Array = new Uint32Array( dataView.buffer ) );

		}

		return dataView;

	}

}

function setArray( a, b, offset ) {

	for ( let i = 0, l = b.length; i < l; i ++ ) {

		a[ offset + i ] = b[ i ];

	}

}

function arraysEqual( a, b, offset ) {

	for ( let i = 0, l = b.length; i < l; i ++ ) {

		if ( a[ offset + i ] !== b[ i ] ) return false;

	}

	return true;

}

export default UniformsBufferNode;

export const uniformsBuffer = ( name ) => new UniformsBufferNode( name );
