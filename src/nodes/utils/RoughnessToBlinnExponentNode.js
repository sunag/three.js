/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TempNode } from '../core/TempNode.js';
import { FunctionNode } from '../core/FunctionNode.js';
 
function RoughnessToBlinnExponentNode() {

	TempNode.call( this, 'fv1' );

};

// taken from here: http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html

RoughnessToBlinnExponentNode.getSpecularMIPLevel = new FunctionNode( [
	"float getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {",

	//	float envMapWidth = pow( 2.0, maxMIPLevelScalar );
	//	float desiredMIPLevel = log2( envMapWidth * sqrt( 3.0 ) ) - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );
	"	float maxMIPLevelScalar = float( maxMIPLevel );",
	"	float desiredMIPLevel = maxMIPLevelScalar - 0.79248 - 0.5 * log2( pow2( blinnShininessExponent ) + 1.0 );",

	// clamp to allowable LOD ranges.
	"	return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );",
	"}"
].join( "\n" ) );

RoughnessToBlinnExponentNode.prototype = Object.create( TempNode.prototype );
RoughnessToBlinnExponentNode.prototype.constructor = RoughnessToBlinnExponentNode;
RoughnessToBlinnExponentNode.prototype.nodeType = "RoughnessToBlinnExponent";

RoughnessToBlinnExponentNode.prototype.generate = function ( builder, output ) {

	var material = builder.material;

	if ( builder.isShader( 'fragment' ) ) {

		if ( material.isDefined( 'STANDARD' ) ) {

			builder.include( RoughnessToBlinnExponentNode.getSpecularMIPLevel );

			if ( builder.isCache( 'clearCoat' ) ) {

				return builder.format( 'getSpecularMIPLevel( Material_ClearCoat_BlinnShininessExponent( material ), 8 )', this.type, output );

			} else {

				return builder.format( 'getSpecularMIPLevel( Material_BlinnShininessExponent( material ), 8 )', this.type, output );

			}

		} else {

			console.warn( "RoughnessToBlinnExponentNode is only compatible with PhysicalMaterial." );

			return builder.format( '0.0', this.type, output );

		}

	} else {

		console.warn( "RoughnessToBlinnExponentNode is not compatible with " + builder.shader + " shader." );

		return builder.format( '0.0', this.type, output );

	}

};

export { RoughnessToBlinnExponentNode };
