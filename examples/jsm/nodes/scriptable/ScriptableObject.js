import { Group } from 'three';

class ScriptableObject extends Group {

	constructor( scriptableNodes = [] ) {

		super();

		this.isScriptableObject = true;

		this.scriptableNodes = scriptableNodes;

		this.type = 'ScriptableObject';

	}

	call( name, ...params ) {

		let output = undefined;

		for ( const scriptableNode of this.scriptableNodes ) {

			output = scriptableNode.call( name, ...params );

		}

		return output;

	}

	addScriptable( scriptableNode ) {

		this.scriptableNodes.push( scriptableNode );

		return this;

	}

	toJSON( meta ) {

		// Forked from Object3D.toJSON()
		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		const output = {};

		if ( isRootObject ) {

			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {},
				shapes: {},
				skeletons: {},
				animations: {},
				nodes: {}
			};

			output.metadata = {
				version: 4.5,
				type: 'ScriptableObject',
				generator: 'ScriptableObject.toJSON'
			};

		}

		const { object } = super.toJSON( meta );

		const scriptableNodes = [];

		for ( const scriptableNode of this.scriptableNodes ) {

			scriptableNodes.push( scriptableNode.toJSON( meta ).uuid );

		}

		object.scriptableNode = scriptableNodes;

		output.object = object;

		if ( isRootObject ) {

			const geometries = extractFromCache( meta.geometries );
			const materials = extractFromCache( meta.materials );
			const textures = extractFromCache( meta.textures );
			const images = extractFromCache( meta.images );
			const shapes = extractFromCache( meta.shapes );
			const skeletons = extractFromCache( meta.skeletons );
			const animations = extractFromCache( meta.animations );
			const nodes = extractFromCache( meta.nodes );

			if ( geometries.length > 0 ) output.geometries = geometries;
			if ( materials.length > 0 ) output.materials = materials;
			if ( textures.length > 0 ) output.textures = textures;
			if ( images.length > 0 ) output.images = images;
			if ( shapes.length > 0 ) output.shapes = shapes;
			if ( skeletons.length > 0 ) output.skeletons = skeletons;
			if ( animations.length > 0 ) output.animations = animations;
			if ( nodes.length > 0 ) output.nodes = nodes;

		}

		function extractFromCache( cache ) {

			const values = [];
			for ( const key in cache ) {

				const data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}

			return values;

		}

		return output;

	}

}

export default ScriptableObject;
