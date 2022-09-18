import Node from './Node.js';
import VaryingNode from './VaryingNode.js';

class AttributeNode extends Node {

	constructor( attributeName, nodeType = null ) {

		super( nodeType );

		this._attributeName = attributeName;

	}

	getHash( builder ) {

		return this.getAttributeName( builder );

	}

	getNodeType( builder ) {

		const attributeName = this.getAttributeName( builder );

		let nodeType = super.getNodeType( builder );

		if ( builder.hasGeometryAttribute( attributeName ) === false ) {

			nodeType = 'float';

		} else if ( nodeType === null ) {

			const attribute = builder.geometry.getAttribute( attributeName );

			nodeType = builder.getTypeFromLength( attribute.itemSize );

		}

		return nodeType;

	}

	setAttributeName( attributeName ) {

		this._attributeName = attributeName;

		return this;

	}

	getAttributeName( /*builder*/ ) {

		return this._attributeName;

	}

	generate( builder ) {

		const attributeName = this.getAttributeName( builder );
		const geometryAttribute = builder.hasGeometryAttribute( attributeName );

		if ( geometryAttribute === true ) {

			const nodeAttribute = builder.getAttribute( attributeName, this.getNodeType( builder ) );

			if ( builder.isShaderStage( 'vertex' ) ) {

				return nodeAttribute.name;

			} else {

				const nodeVarying = new VaryingNode( this );

				return nodeVarying.build( builder, nodeAttribute.type );

			}

		} else {

			console.warn( `Attribute "${ attributeName }" not found.` );

			return builder.getConst( 'float', 0 );

		}

	}

}

export default AttributeNode;
