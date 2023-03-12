import Node, { addNodeClass } from '../core/Node.js';
import { float } from '../shadernode/ShaderNode.js';
import { addNodeElement, nodeProxy } from '../shadernode/ShaderNode.js';

class ScriptableValueNode extends Node {

	constructor( value = null ) {

        super();

        this.value = value;

        this.isScriptableValueNode = true;

    }

    getNodeType( builder ) {

        return this.value && this.value.isNode ? this.value.getNodeType( builder ) : 'float';

    }

    construct() {

        return this.value && this.value.isNode ? this.value : float();

    }

}

export default ScriptableValueNode;

export const scriptableValue = nodeProxy( ScriptableValueNode );

addNodeElement( 'scriptableValue', scriptableValue );

addNodeClass( ScriptableValueNode );
