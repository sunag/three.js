import NodeLoader from './NodeLoader.js';
import NodeMaterialLoader from './NodeMaterialLoader.js';
import { ObjectLoader } from 'three';

class NodeObjectLoader extends ObjectLoader {

	constructor( manager ) {

		super( manager );

		this._nodesJSON = null;
		this._nodes = null;

	}

	parse( json, onLoad ) {

		this._nodesJSON = json.nodes;

		const data = super.parse( json, onLoad );

		this._nodesJSON = null;
		this._nodes = null;

		return data;

	}

	parseNodes( json, textures ) {

		if ( json !== undefined ) {

			const loader = new NodeLoader();
			loader.setTextures( textures );

			return loader.parseNodes( json );

		}

		return {};

	}

	parseMaterials( json, textures ) {

		const materials = {};

		if ( json !== undefined ) {

			this._nodes = this._nodes || this.parseNodes( this._nodesJSON, textures );

			const loader = new NodeMaterialLoader();
			loader.setTextures( textures );
			loader.setNodes( this._nodes );

			for ( let i = 0, l = json.length; i < l; i ++ ) {

				const data = json[ i ];

				materials[ data.uuid ] = loader.parse( data );

			}

		}

		return materials;

	}
/*
	parseObject( data, geometries, materials, textures, animations ) {

		let object = null;

		if ( data.type === 'ScriptableObject' ) {

			object = new ScriptableObject();

			this._nodes = this._nodes || this.parseNodes( this._nodesJSON, textures );

			for ( const uuid of data.codeNodes ) {

				object.codeNodes.push( this._nodes[ uuid ] );

			}

			//

			object.uuid = data.uuid;

			if ( data.name !== undefined ) object.name = data.name;

			if ( data.matrix !== undefined ) {

				object.matrix.fromArray( data.matrix );

				if ( data.matrixAutoUpdate !== undefined ) object.matrixAutoUpdate = data.matrixAutoUpdate;
				if ( object.matrixAutoUpdate ) object.matrix.decompose( object.position, object.quaternion, object.scale );

			} else {

				if ( data.position !== undefined ) object.position.fromArray( data.position );
				if ( data.rotation !== undefined ) object.rotation.fromArray( data.rotation );
				if ( data.quaternion !== undefined ) object.quaternion.fromArray( data.quaternion );
				if ( data.scale !== undefined ) object.scale.fromArray( data.scale );

			}

			if ( data.children !== undefined ) {

				const children = data.children;

				for ( let i = 0; i < children.length; i ++ ) {

					object.add( this.parseObject( children[ i ], geometries, materials, textures, animations ) );

				}

			}

		} else {

			object = super.parseObject( data, geometries, materials, textures, animations );

		}

		return object;

	}
*/
}

export default NodeObjectLoader;
