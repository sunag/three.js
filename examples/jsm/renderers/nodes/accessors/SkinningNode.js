import Node from '../core/Node.js';
import AttributeNode from '../core/AttributeNode.js';
import FloatNode from '../inputs/FloatNode.js';
import Matrix4Node from '../inputs/Matrix4Node.js';
import TextureNode from '../inputs/TextureNode.js';
import OperatorNode from '../math/OperatorNode.js';

import { NodeUpdateType } from '../core/constants.js';
import { ApplySkinning } from '../functions/Common.js';

class SkinningNode extends Node {

	constructor( skinnedMesh ) {

		super( 'vec4' );

		this.skinnedMesh = skinnedMesh;

		this.updateType = NodeUpdateType.Object;

		//

		this.bindMatrixNode = new Matrix4Node( skinnedMesh.bindMatrix );
		this.bindMatrixInverseNode = new Matrix4Node( skinnedMesh.bindMatrixInverse );
		this.boneTextureSizeNode = new FloatNode();
		this.boneTextureNode = new TextureNode();

	}

	getType( /*builder*/ ) {

		return 'vec4';

	}

	generate( builder, output ) {

		const type = this.getType( builder );
		const nodeData = builder.getDataFromNode( this, builder.shaderStage );

		let skinIndexNode = nodeData.skinIndexNode;

		if ( skinIndexNode === undefined ) {

			skinIndexNode = new AttributeNode( 'skinIndex', 'vec4' );

			nodeData.skinIndexNode = skinIndexNode;

		}

		let skinWeightNode = nodeData.skinWeight;

		if ( skinWeightNode === undefined ) {

			skinWeightNode = new AttributeNode( 'skinWeight', 'vec4' );

			nodeData.skinWeightNode = skinWeightNode;

		}

		const applySkinningCallNode = ApplySkinning.call( {
			index: skinIndexNode,
			weight: skinWeightNode,
			bindMatrix: this.bindMatrixNode,
			boneTexture: this.boneTextureNode, // how to apply a separate texture and sampler object?
			boneSampler: this.boneTextureNode, // how to apply a separate texture and sampler object?
			boneTextureSize: this.boneTextureSizeNode
		} );

		const outputNode = new OperatorNode( '*', this.bindMatrixInverseNode, applySkinningCallNode );

		const skinningSnipped = outputNode.build( builder, type );

		return builder.format( skinningSnipped, type, output );

	}

	update() {

		const skeleton = this.skinnedMesh.skeleton;

		skeleton.update();

		if ( skeleton.boneTexture === null ) skeleton.computeBoneTexture();

		this.boneTextureSizeNode.value = skeleton.boneTextureSize;
		this.boneTextureNode.value = skeleton.boneTexture;

	}

}

export default SkinningNode;
