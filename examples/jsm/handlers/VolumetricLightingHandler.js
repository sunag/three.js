import LightingHandler from '../renderers/common/handlers/LightingHandler.js';

import { positionView, vec3, length, float, dot, sqrt, div, atan, tslFn } from 'three/nodes';

const scatter = tslFn( ( [ vPos_immutable, lPos ] ) => {

	const vPos = vec3( vPos_immutable ).toVar();

	const d = float( length( vPos ) ).toVar();
	vPos.divAssign( d );

	const q = vec3( lPos.negate() );
	const b = float( dot( vPos, q ) );
	const c = float( dot( q, q ) );
	const s = float( div( 1.0, sqrt( c.sub( b.mul( b ) ) ) ) );
	const l = float( s.mul( atan( d.add( b ).mul( s ) ).sub( atan( b.mul( s ) ) ) ) );

	return l;

} ).setLayout( {
	name: 'Scatter',
	type: 'float',
	inputs: [
		{ name: 'vPos', type: 'vec3' },
		{ name: 'lPos', type: 'vec3' }
	]
} );

class VolumetricLightingHandler extends LightingHandler {

	direct( inputs ) {

		const { lightViewPosition, lightColor, reflectedLight } = inputs;

		const lightVolume = scatter( positionView, lightViewPosition ).mul( .09 );

		reflectedLight.directDiffuse.addAssign( lightVolume.mul( lightColor ) );

		super.direct( inputs );

	}

}

export default VolumetricLightingHandler;
