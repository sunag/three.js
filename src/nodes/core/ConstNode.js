/**
 * @author sunag / http://www.sunag.com.br/
 */

import { TempNode } from './TempNode.js';
 
function ConstNode( src, useDefine ) {

	TempNode.call( this );

	this.eval( src || ConstNode.PI, useDefine );

};

ConstNode.PI = 'PI';
ConstNode.PI2 = 'PI2';
ConstNode.RECIPROCAL_PI = 'RECIPROCAL_PI';
ConstNode.RECIPROCAL_PI2 = 'RECIPROCAL_PI2';
ConstNode.LOG2 = 'LOG2';
ConstNode.EPSILON = 'EPSILON';

ConstNode.prototype = Object.create( TempNode.prototype );
ConstNode.prototype.constructor = ConstNode;
ConstNode.prototype.nodeType = "Const";

ConstNode.rDeclaration = /^([a-z_0-9]+)\s([a-z_0-9]+)\s?\=?\s?(.*?)(\;|$)/i;
ConstNode.rDefine = /^([a-z_0-9]+)\s?(.*?)$/i;

ConstNode.prototype.getType = function ( builder ) {

	return builder.getTypeByFormat( this.type );

};

ConstNode.prototype.eval = function ( src, useDefine ) {

	src = ( src || '' ).trim();

	var name, type, value = "";
	
	if (useDefine === undefined && src.indexOf("#define") === 0) {
		
		var matchDefine = src.substr(8).match( ConstNode.rDefine );
		
		name = matchDefine[1];
		value = matchDefine[2];

		this.useDefine = true;
		
	} else {
	
		var match = src.match( ConstNode.rDeclaration );

		this.useDefine = !! useDefine;

		if ( match && match.length > 1 ) {

			type = match[ 1 ];
			name = match[ 2 ];
			value = match[ 3 ];

		} else {

			name = src;
			type = 'fv1';

		}
		
	}

	this.name = name;
	this.type = type;
	this.value = value;

};

ConstNode.prototype.build = function ( builder, output ) {

	if ( output === 'source' ) {

		if ( this.value ) {

			if ( this.useDefine ) {

				return '#define ' + this.name + ' ' + this.value;

			}

			return 'const ' + this.type + ' ' + this.name + ' = ' + this.value + ';';

		}

	} else {

		builder.include( this );

		return builder.format( this.name, this.getType( builder ), output );

	}

};

ConstNode.prototype.generate = function ( builder, output ) {

	return builder.format( this.name, this.getType( builder ), output );

};

ConstNode.prototype.toJSON = function ( meta ) {

	var data = this.getJSONNode( meta );

	if ( ! data ) {

		data = this.createJSONNode( meta );

		data.name = this.name;
		data.out = this.type;

		if ( this.value ) data.value = this.value;
		if ( data.useDefine === true ) data.useDefine = true;

	}

	return data;

};

export { ConstNode };