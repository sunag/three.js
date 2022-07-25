import {
	FileLoader,
	Loader,
	TextureLoader
} from '../../../build/three.module.js';
import * as Nodes from '../nodes/Nodes.js';
import { 
    float, int, vec2, vec3, vec4, color,
    mul
} from '../nodes/Nodes.js';

class MaterialXLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {

		new FileLoader( this.manager )
			.setPath( this.path )
			.load( url, async ( text ) => {

				try {

					onLoad( await this.parseAsync( text ) );

				} catch ( e ) {

					onError( e );

				}

			}, onProgress, onError );

		return this;

	}

	parse( text ) {

		return new MaterialX( this.manager, this.path ).parse( text );

	}

	async parseAsync( text ) {

		return this.parse( text );

	}

}

class MaterialXNode {

    constructor( materialX, nodeXML, nodePath = '' ) {

        this.materialX = materialX;
        this.nodeXML = nodeXML;
        this.nodePath = nodePath ? nodePath + '/' + this.name : this.name;

        this.node = null;

        this.children = [];

    }

    get element() {

        return this.nodeXML.nodeName;

    }

    get nodegraph() {

        return this.getAttribute( 'nodegraph' );

    }

    get nodegraphPath() {

        return this.nodegraph + '/' + this.output;

    }

    get nodename() {

        return this.getAttribute( 'nodename' );

    }

    get output() {

        return this.getAttribute( 'output' );

    }

    get name() {

        return this.getAttribute( 'name' );

    }

    get type() {

        return this.getAttribute( 'type' );

    }

    get value() {

        return this.getAttribute( 'value' );

    }

    get hasNodeGraph() {

        return this.nodegraph !== null && this.output !== null;

    }

    get isConst() {

        return this.element === 'input' && this.value !== null;

    }

    getClassFromType( type ) {

        let nodeClass = null;

        if ( type === 'integer' ) nodeClass = int;
        else if ( type === 'float' ) nodeClass = float;
        else if ( type === 'vec2' ) nodeClass = vec2;
        else if ( type === 'vec3' ) nodeClass = vec3;
        else if ( type === 'vec4' || type === 'color4' ) nodeClass = vec4;
        else if ( type === 'color3' ) nodeClass = color;

        return nodeClass;

    }

    getNode() {

        let node = this.node;

        if ( node === null ) {

            if ( this.isConst ) {

                const nodeClass = this.getClassFromType( this.type );

                node = nodeClass( ...this.getVector() )

            } else if ( this.hasNodeGraph ) {

                const matXNode = this.materialX.getMaterialXNode( this.nodegraphPath );
                console.log( matXNode )

            } else {

                console.log( this.nodegraph, this.output );


            }
            
            if ( node === null ) {

                console.warn(  `THREE.MaterialXLoader: Unexpected node ${ new XMLSerializer().serializeToString( this.nodeXML ) }.` )

                node = float( 0 );

            }

            node.name = this.name;

            this.node = node;

        }

        return node;

    }

    getNodes() {

        const nodes = {};

        for ( const input of this.children ) {

           const node = input.getNode();

           nodes[ node.name ] = node;

		}

        return nodes;

    }

    getValue() {

        return this.value.trim();

    }

    getVector() {

        const vector = [];

        for ( const val of this.getValue().split( /[,|\s]/ ) ) {
    
            if ( val !== '' ) {

                vector.push( Number( val.trim() ) );

            }
    
        }
    
        return vector;

    }

    getAttribute( name ) {

        return this.nodeXML.getAttribute( name );

    }

    setStandardSurface( material ) {

        const inputs = this.getNodes();

        //

        let colorNode = null;

        if ( inputs.base && inputs.base_color ) colorNode = mul( inputs.base, inputs.base_color );
        else if ( inputs.base ) colorNode = inputs.base;
        else if ( inputs.base_color ) colorNode = inputs.base_color;
        
        //

        let roughnessNode = null;

        if ( inputs.specular_roughness ) roughnessNode = inputs.specular_roughness;
        
        //

        let metalnessNode = null;

        if ( inputs.metalness ) metalnessNode = inputs.metalness;
        
        //

        let clearcoatNode = null;
        let clearcoatRoughnessNode = null;

        if ( inputs.coat ) clearcoatNode = inputs.coat;
        if ( inputs.coat_roughness ) clearcoatRoughnessNode = inputs.coat_roughness;

        //

        material.colorNode = colorNode || color( 0.8, 0.8, 0.8 );
        material.roughnessNode = roughnessNode || float( 0.2 );
        material.metalnessNode = metalnessNode || float( 0 );
        material.clearcoatNode = clearcoatNode || float( 0 );
        material.clearcoatRoughnessNode = clearcoatRoughnessNode || float( 0 );

    }

    setMaterial( material ) {

        if ( this.element === 'standard_surface' ) {

            this.setStandardSurface( material );

        }

    }

    toMaterial() {

        const material = new Nodes.MeshPhysicalNodeMaterial();
        material.name = this.name;

        for ( const nodeX of this.children ) {

            const shaderProperties = this.materialX.getMaterialXNode( nodeX.nodename );
            shaderProperties.setMaterial( material );

		}

		return material;

    }

    toMaterials() {

        const materials = {};

        for ( const nodeX of this.children ) {
            
            if ( nodeX.element === 'surfacematerial' ) {

                const material = nodeX.toMaterial();
                
                materials[ material.name ] = material;

            }

		}

        return materials;

    }

    add( materialXNode ) {

        this.children.push( materialXNode );

    }

}

class MaterialX {

    constructor( manager, path ) {

		this.manager = manager;
		this.path = path;
		this.resourcePath = '';

        this.nodesXLib = new Map();
        //this.nodesXRefLib = new WeakMap();

		this.textureLoader = new TextureLoader( manager );

	}

    addMaterialXNode( materialXNode ) {

        this.nodesXLib.set( materialXNode.nodePath, materialXNode );

    }
/*
    getMaterialXNodeFromXML( xmlNode ) {

        return this.nodesXRefLib.get( xmlNode );

    }
*/
    getMaterialXNode( ...names ) {

        return this.nodesXLib.get( names.join('/') );

    }

    parseNode( nodeXML, nodePath = '' ) {

        const materialXNode = new MaterialXNode( this, nodeXML, nodePath );

        for ( const childNodeXML of nodeXML.children ) {

            const childMXNode = this.parseNode( childNodeXML, materialXNode.nodePath );
            materialXNode.add( childMXNode );

            if ( childNodeXML.nodeName == 'output' ) {

                console.log( childMXNode.nodegraphPath );

            }
            if ( childNodeXML.nodeName == 'output' ) {

                console.log( '123' );

            }
            if ( materialXNode.nodePath ) {

                this.addMaterialXNode( materialXNode );

            }

        }

        return materialXNode;

    }

    parse( text ) {

		const rootXML = new DOMParser().parseFromString( text, 'application/xml' ).documentElement;

        const filePrefix = rootXML.getAttribute( 'fileprefix' );

		this.resourcePath = filePrefix ? new URL( filePrefix, this.path ).href : this.path;
		this.textureLoader.setPath( this.resourcePath );

		//

        const materials = this.parseNode( rootXML ).toMaterials();

		return { materials };

    }

}

export { MaterialXLoader };
