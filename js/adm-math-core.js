(function() {
	var module = angular.module("admMathCore", []);

	module.service("admLiteralExpression", function() {
		this.build = function(id, parentNode) {
			return {
				id: id,
				parentNode: (typeof parentNode !== "undefined") ? parentNode : null,
				expressionType: "literal",
				type: "expression",
				nodes: [],
				
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	},

				insert: function(pos, node) {
					this.nodes.splice(pos, 0, node);

					return node;
				},

				deleteAt: function(pos) {
					this.nodes.splice(pos, 1);
				},

				getLength: function() {
					return this.nodes.length;
				},

				getNodes: function() {
					return this.nodes;
				},

				getNode: function(index) {
					return this.nodes[index];
				},

				findNode: function(node) {
					for(var i = 0; i < this.nodes.length; i++)
						if(this.nodes[i].id == node.id)
							return i;
				}
			};
		};
	});

	module.service("admLiteralNumeral", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "numeral",
				value: value,
				getVal: function() {	return this.value;	},
				getDisplay: function() {	return this.value;	}
			};
		};
	});

	module.service("admLiteralLetter", function() {
		this.build = function(id, parentNode, value) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "letter",
				value: value,
				getVal: function() {	return this.value;	},
				getDisplay: function() {	return this.value;	}
			};
		};
	});

	module.service("admLiteralSymbol", function() {
		this.build = function(id, parentNode, name) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "symbol",
				name: name,
				getVal: function() {	return this.name;	},
				getDisplay: function() {
					switch(name) {
						case "pi":	return "&pi;";
					}
				}
			};
		};
	});

	module.service("admLiteralParenthesis", function() {
		this.build = function(id, parentNode, paren) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "parenthesis",
				isStart: (paren == "(" ? true : false),
				isEnd: !this.isStart,
				getVal: function() {	return (this.isStart ? "(" : ")");	},
				getDisplay: function() {	return (this.isStart ? "(" : ")");	}
			};
		};
	});

	module.service("admLiteralOperator", function() {
		this.build = function(id, parentNode, operator) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "operator",
				operator: operator,
				getVal: function() {	return this.operator;	},
				getDisplay: function() {
					switch(this.operator) {
						case "*":	return "\&times\;";
						default:	return this.operator;
					}
				}
			};
		};
	});

	module.service("admLiteralExponent", function() {
		this.build = function(id, parentNode, exponentNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "exponent",
				exponent: exponentNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralDivision", function() {
		this.build = function(id, parentNode, numeratorNode, denominatorNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "division",
				numerator: numeratorNode,
				denominator: denominatorNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralSquareRoot", function() {
		this.build = function(id, parentNode, radicandNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "squareRoot",
				radicand: radicandNode,
				getVal: function() {	return null;	},
				getDisplay: function() {	return null;	}
			};
		};
	});

	module.service("admLiteralFunction", function() {
		this.build = function(id, parentNode, name, childNode) {
			return {
				id: id,
				parentNode: parentNode,
				expressionType: "literal",
				type: "function",
				name: name,
				child: childNode,
				getVal: function() {	return null;	},
				getDisplay: function() {
					var start, end;
					
					switch(this.name) {
						case "abs":	start = "|";						end="|";	break;
						default:		start = this.name+"(";	end=")";	break;
					}

					return {
						start: start,
						end: end
					};
				}
			};
		};
	});

	module.factory("admLiteralNode", ["admLiteralExpression", "admLiteralNumeral", "admLiteralLetter", "admLiteralSymbol",
		 "admLiteralParenthesis", "admLiteralOperator", "admLiteralExponent", "admLiteralDivision", "admLiteralSquareRoot",
		 "admLiteralFunction",
		 function(admLiteralExpression, admLiteralNumeral, admLiteralLetter, admLiteralSymbol, admLiteralParenthesis, admLiteralOperator,
			 admLiteralExponent, admLiteralDivision, admLiteralSquareRoot, admLiteralFunction) {
		var id = 0;

		return {
			buildBlankExpression: function(parentNode) {
				return admLiteralExpression.build(id++, parentNode);
			},
			build: function(parentNode, nodeVal) {
				if(/^[0-9.]$/.test(nodeVal))				{ return admLiteralNumeral.build(id++, parentNode, nodeVal); }
				else if(/^[a-zA-Z]$/.test(nodeVal))	{ return admLiteralLetter.build(id++, parentNode, nodeVal); }
				else if(/^[+\-*]$/.test(nodeVal))		{ return admLiteralOperator.build(id++, parentNode, nodeVal); }
				else if(/^[()]$/.test(nodeVal))			{ return admLiteralParenthesis.build(id++, parentNode, nodeVal); }
				else if(/^[\^]$/.test(nodeVal)) {
					var exponent = admLiteralExpression.build(id++, null);
					
					var node = admLiteralExponent.build(id++, parentNode, exponent);
					node.exponent.parentNode = node;

					return node;
				}
				else if(/^[\/]$/.test(nodeVal)) {
					var numerator = admLiteralExpression.build(id++, null);
					var denominator = admLiteralExpression.build(id++, null);

					var node = admLiteralDivision.build(id++, parentNode, numerator, denominator);
					node.numerator.parentNode = node;
					node.denominator.parentNode = node;

					return node;
				}
			},
			buildByName: function(parentNode, nodeName) {
				switch(nodeName) {
					case "pi":	return admLiteralSymbol.build(id++, parentNode, "pi");
					case "sin":
					case "cos":
					case "tan":
					case "abs":
					case "ln":
						var node = admLiteralFunction.build(id++, parentNode, nodeName, null);
						node.child = admLiteralExpression.build(id++, node);

						return node;
					case "squareRoot":
						var node = admLiteralSquareRoot.build(id++, parentNode, null);
						node.radicand = admLiteralExpression.build(id++, node);

						return node;
				}
			}
		};
	}]);
})();
