export class Program {

	constructor() {

		this.body = [];

		this.isProgram = true;

	}

}

export class VariableDeclaration {

	constructor( type, name, init = null ) {

		this.type = type;
		this.name = name;
		this.init = init;

		this.isVariableDeclaration = true;

	}

}

export class FunctionDeclaration {

	constructor( type, name, parameters = [] ) {

		this.type = type;
		this.name = name;
		this.parameters = parameters;
		this.body = [];

		this.isFunctionDeclaration = true;

	}

}

export class Expression {

	constructor( expression ) {

		this.expression = expression;

		this.isExpression = true;

	}

}

export class Operator {

	constructor( type, left, right ) {

		this.type = type;
		this.left = left;
		this.right = right;

		this.isOperator = true;

	}

}

export class Number {

	constructor( value, type = 'float' ) {

		this.type = type;
		this.value = value;

		this.isNumber = true;

	}

}

export class FunctionCall {

	constructor( name, parameters = [] ) {

		this.name = name;
		this.parameters = parameters;

		this.isFunctionCall = true;

	}

}

export class Return {

	constructor( value ) {

		this.value = value;

		this.isReturn = true;

	}

}

export class Accessor {

	constructor( name ) {

		this.name = name;

		this.isAccessor = true;

	}

}
