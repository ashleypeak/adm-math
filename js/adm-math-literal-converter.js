(function() {
	var module = angular.module("admMathLiteralConverter", ["admMathCore"]);

	module.service("admSemanticNumeral", function() {
		this.build = function(value) {
			return {
				expressionType: "semantic",
				type: "numeral",
				value: String(value),

				getOpenMath: function() {
					if(this.value.indexOf('.') != -1)
						return "<OMF dec='"+this.value+"'/>";
					return "<OMI>"+this.value+"</OMI>";
				}
			};
		};
	});

	module.service("admSemanticVariable", function() {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "variable",
				name: name,

				getOpenMath: function() {
					return "<OMV name='"+this.name+"'/>";
				}
			};
		};
	});

	module.service("admSemanticOperator", function() {
		this.build = function(symbol, children) {
			return {
				expressionType: "semantic",
				type: "operator",
				symbol: symbol,
				children: children,

				assertHasValidChildren: function() {
					for(var i = 0; i < 2; i++) {
						if(!this.children[i])																		throw "errInvalidArguments";
						if(!this.children[i].hasOwnProperty("expressionType"))	throw "errInvalidArguments";
						if(this.children[i].expressionType != "semantic")				throw "errInvalidArguments";
					}
				},

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='"+opName+"'/>"
						+ this.children[0].getOpenMath()
						+ this.children[1].getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticUnaryMinus", function() {
		this.build = function(child) {
			return {
				expressionType: "semantic",
				type: "unaryMinus",
				child: child,

				assertHasValidChildren: function() {
					if(!this.child)																		throw "errInvalidArguments";
					if(!this.child.hasOwnProperty("expressionType"))	throw "errInvalidArguments";
					if(this.child.expressionType != "semantic")				throw "errInvalidArguments";
				},

				getOpenMath: function() {
					var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

					return "<OMA><OMS cd='arith1' name='unary_minus'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticExponent", function() {
		this.build = function(base, exponent) {
			return {
				expressionType: "semantic",
				type: "exponent",
				base: typeof base !== "undefined" ? base : null,
				exponent: typeof exponent !== "undefined" ? exponent : null,

				assertHasValidChildren: function() {
					if(this.base === null || this.exponent === null)	throw "errInvalidArguments";
					if(this.base.type == "error")											throw "errInvalidArguments";
					if(this.exponent.type == "error")									throw "errInvalidArguments";
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='power'/>"
						+ this.base.getOpenMath()
						+ this.exponent.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticDivision", function() {
		this.build = function(numerator, denominator) {
			return {
				expressionType: "semantic",
				type: "division",
				numerator: typeof numerator !== "undefined" ? numerator : null,
				denominator: typeof denominator !== "undefined" ? denominator : null,

				assertHasValidChildren: function() {
						if(this.numerator === null || this.denominator === null)	throw "errInvalidArguments";
						if(this.numerator.type == "error")												throw "errInvalidArguments";
						if(this.denominator.type == "error")											throw "errInvalidArguments";
				},

				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='divide'/>"
						+ this.numerator.getOpenMath()
						+ this.denominator.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticRoot", function() {
		this.build = function(index, radicand) {
			return {
				expressionType: "semantic",
				type: "squareRoot",
				index: typeof index !== "undefined" ? index : null,
				radicand: typeof radicand !== "undefined" ? radicand : null,

				assertHasValidChildren: function() {
						if(this.index === null || this.radicand === null)	throw "errInvalidArguments";
						if(this.index.type == "error")										throw "errInvalidArguments";
						if(this.radicand.type == "error")									throw "errInvalidArguments";
				},

				//the order is right. fuck openmath.
				getOpenMath: function() {
					return "<OMA><OMS cd='arith1' name='root'/>"
						+ this.radicand.getOpenMath()
						+ this.index.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticFunction", function() {
		this.build = function(name, child) {
			return {
				expressionType: "semantic",
				type: "function",
				name: name,
				child: typeof child !== "undefined" ? child : null,

				assertHasValidChildren: function() {
						if(this.child === null)					throw "errInvalidArguments";
						if(this.child.type == "error")	throw "errInvalidArguments";
				},

				getOpenMath: function() {
					var cd;

					switch(this.name) {
						case "abs":	cd = "arith1";	break;
						default:		cd = "transc1";
					}

					return "<OMA><OMS cd='"+cd+"' name='"+this.name+"'/>"
						+ this.child.getOpenMath()
						+ "</OMA>";
				}
			};
		};
	});

	module.service("admSemanticConstant", function() {
		this.build = function(name) {
			return {
				expressionType: "semantic",
				type: "constant",
				name: name,

				getOpenMath: function() {
					return "<OMS cd='nums1' name='"+this.name+"'/>";
				}
			};
		};
	});

	module.service("admSemanticError", function() {
		this.build = function(message) {
			return {
				expressionType: "semantic",
				type: "error",
				message: message,

				getOpenMath: function() {
					return "<OME>"+message+"[FIND OUT HOW ERRORS ARE RECORDED]</OME>";
				}
			};
		};
	});

	module.service("admSemanticNode", ["admSemanticNumeral", "admSemanticVariable", "admSemanticOperator", "admSemanticUnaryMinus",
		 "admSemanticExponent", "admSemanticDivision", "admSemanticRoot", "admSemanticFunction", "admSemanticConstant", "admSemanticError",
		 function(admSemanticNumeral, admSemanticVariable, admSemanticOperator, admSemanticUnaryMinus, admSemanticExponent,
			 admSemanticDivision, admSemanticRoot, admSemanticFunction, admSemanticConstant, admSemanticError) {
		this.build = function(type) {
			switch(type) {
				case "numeral":			return admSemanticNumeral.build(arguments[1]);
				case "variable":		return admSemanticVariable.build(arguments[1]);
				case "operator":		return admSemanticOperator.build(arguments[1], arguments[2]);
				case "unaryMinus":	return admSemanticUnaryMinus.build(arguments[1]);
				case "exponent":		return admSemanticExponent.build(arguments[1], arguments[2]);
				case "division":		return admSemanticDivision.build(arguments[1], arguments[2]);
				case "root":				return admSemanticRoot.build(arguments[1], arguments[2]);
				case "function":		return admSemanticFunction.build(arguments[1], arguments[2]);
				case "constant":		return admSemanticConstant.build(arguments[1]);
				case "error":				return admSemanticError.build(arguments[1]);
			}
		};
	}]);

	module.factory("admLiteralParser", ["admSemanticNode", function(admSemanticNode) {
		/*******************************************************************
		 * function:		assertNotEmpty()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if the collection is empty
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertNotEmpty(nodes) {
			if(nodes.length === 0) throw "errEmptyExpression";
		}

		/*******************************************************************
		 * function:		assertParenthesesMatched()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if there are any unmatched
		 *							parentheses
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertParenthesesMatched(nodes) {
			var depth = 0;

			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				
				depth += (nodes[i].isStart ? 1 : -1);
				if(depth < 0)	throw "errUnmatchedParenthesis";
			}

			if(depth > 0)	throw "errUnmatchedParenthesis";
		}

		/*******************************************************************
		 * function:		parseExponents()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Exponent
		 *							with an equivalent semantic.nodeTypes.Exponent
		 *							leaves the semantic node's `base` as null
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "exponent")						continue;
				
				var semanticExp = build(nodes[i].exponent.getNodes());
				nodes.splice(i, 1, admSemanticNode.build("exponent", null, semanticExp));
			}
		}

		/*******************************************************************
		 * function:		applyExponents()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there is a semantic.nodeTypes.exponent,
		 *							fills its `base` with the preceding node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function applyExponents(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "semantic")	continue;
				if(nodes[i].type != "exponent")						continue;

				if(i === 0) throw "errMissingBase";

				nodes[i].base = nodes[i-1];
				nodes[i].assertHasValidChildren();
				nodes.splice(i-1, 1);
			}
		}

		/*******************************************************************
		 * function:		parseParentheses()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal subexpressions surrounded
		 *							by parentheses with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseParentheses(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				if(!nodes[i].isStart)											continue;

				var subExpressionNodes = [];
				for(var j = i+1; nodes[j].type != "parenthesis" || !nodes[j].isEnd; j++)
					subExpressionNodes.push(nodes[j]);

				var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`
				var semanticNode = build(subExpressionNodes);
				if(semanticNode.type == "error")	throw "errEmptyExpression";

				nodes.splice(i, literalLength, semanticNode);
			}
		}

		/*******************************************************************
		 * function:		parseDivision()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Exponent
		 *							with an equivalent semantic.nodeTypes.Exponent
		 *							leaves the semantic node's `base` as null
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseDivision(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "division")						continue;

				var semanticNumerator = build(nodes[i].numerator.getNodes());
				var semanticDenominator = build(nodes[i].denominator.getNodes());

				var semanticDiv = admSemanticNode.build("division", semanticNumerator, semanticDenominator);
				semanticDiv.assertHasValidChildren();

				nodes.splice(i, 1, semanticDiv);
			}
		}

		/*******************************************************************
		 * function:		parseRoots()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literalSquareRoots and literalRoots
		 *							with an equivalent semanticRoots
		 *							WARNING: currently only works on literalSquareRoot
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseRoots(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "squareRoot")					continue;
				
				var semanticIndex = admSemanticNode.build("numeral", "2");
				var semanticRadicand = build(nodes[i].radicand.getNodes());
				var semanticRoot = admSemanticNode.build("root", semanticIndex, semanticRadicand);
				semanticRoot.assertHasValidChildren();

				nodes.splice(i, 1, semanticRoot);
			}
		}


		/*******************************************************************
		 * function:		replaceMulticharacterSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and replaces
		 *							each instance of admLiteralLetters making up the
		 *							symbol matched by `pattern` with an admSemanticNode
		 *							called with arguments `args`
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		`nodes` [admLiteralNode | admSemanticNode]
		 *							`nodeString` STRING
		 *								a string representation of `nodes` to aid searching
		 *							`pattern` REGEX
		 *								a regex pattern describing the symbol
		 *							`args` ARRAY
		 *								arguments with which admSemanticNode.build is called
		 *
		 * return:			STRING
		 *								nodeString, updated to reflect new changes
		 ******************************************************************/
		function replaceMulticharacterSymbols(nodes, nodeString, pattern, args) {
			var matches;
			while(matches = pattern.exec(nodeString)) {
				var pos = matches.index;
				var len = matches[0].length;

				var newNode = admSemanticNode.build.apply(null, args);

				nodes.splice(pos, len, newNode);
				nodeString = nodeString.slice(0, pos) + "_" + nodeString.slice(pos+len);
			}

			return nodeString;
		}

		/*******************************************************************
		 * function:		parseMulticharacterSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces admLiteralLetters making up multicharacter
		 *							symbols (like 'sin') with admSemanticNodes
		 *							also some single character symbols like 'e' - basically
		 *							anything which shouldn't be turned into a variable
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseMulticharacterSymbols(nodes) {
			var nodeString = "";
			angular.forEach(nodes, function(node, index) {
				if(node.expressionType != "literal")	nodeString += "_";
				else if(node.type != "letter")				nodeString += "_";
				else																	nodeString += node.getVal();
			});

			//if one symbol is a substring of another, the longer symbol MUST go first
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /sin/, ["function", "sin"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /cos/, ["function", "cos"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /tan/, ["function", "tan"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /ln/, ["function", "ln"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /pi/, ["constant", "pi"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /e/, ["constant", "e"]);
		}

		/*******************************************************************
		 * function:		applyMulticharacterSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there is a multicharacter admSemanticNode
		 *							like 'sin', fill its `child` with the following
		 *							node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function applyMulticharacterSymbols(nodes) {
			//has to run right-to-left or else you get things like sincosx => sin(cos)x instead of => sin(cos(x))
			for(var i = nodes.length-1; i >= 0; i--) {
				if(nodes[i].expressionType != "semantic")	continue;
				if(nodes[i].type != "function")						continue;
				if(nodes[i].child !== null)								continue; //some functions are parsed by parseFunctions()

				if(i+1 == nodes.length) throw "errMissingArgument";

				nodes[i].child = nodes[i+1];
				nodes[i].assertHasValidChildren();
				nodes.splice(i+1, 1);
			}
		}
		
		/*******************************************************************
		 * function:		parseNumerals()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Numeral
		 *							with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseNumerals(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "numeral")						continue;

				var numeral = "";
				for(var j = i; nodes[j] && nodes[j].expressionType == "literal" && nodes[j].type == "numeral"; j++)
						numeral += nodes[j].getVal();

				if(numeral === "")																			throw "errNotFound";
				if(numeral.indexOf(".") != numeral.lastIndexOf("."))		throw "errMalformedNumeral";

				var semanticNum = admSemanticNode.build("numeral", numeral);
				nodes.splice(i, numeral.length, semanticNum);
			}
		}

		/*******************************************************************
		 * function:		parseVariables()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal.nodeTypes.Letter
		 *							with semantic.nodeTypes.Variable
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseVariables(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "letter")							continue;

				var semanticVar = admSemanticNode.build("variable", nodes[i].getVal()); 
				nodes.splice(i, 1, semanticVar);
			}
		}

		/*******************************************************************
		 * function:		parseSymbols()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralSymbols with
		 *							admSemanticConstants
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseSymbols(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "symbol")							continue;

				var semanticSymbol = admSemanticNode.build("constant", nodes[i].getVal()); 
				nodes.splice(i, 1, semanticSymbol);
			}
		}

		/*******************************************************************
		 * function:		parseFunctions()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralFunctions with
		 *							admSemanticFunctions
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseFunctions(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "function")						continue;

				var semanticChild = build(nodes[i].child.getNodes());
				var semanticFunction = admSemanticNode.build("function", nodes[i].name, semanticChild);
				semanticFunction.assertHasValidChildren();

				nodes.splice(i, 1, semanticFunction);
			}
		}

		/*******************************************************************
		 * function:		parseImpliedMultiplication()
		 *
		 * description:	takes mixed collection of nodes `nodes` and,
		 *							wherever there are two semantic.nodeTypes.[any]
		 *							side-by-side, replaces them with a multiplication
		 *							semantic node
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseImpliedMultiplication(nodes) {
			for(var i = 0; i < nodes.length-1; i++) {
				if(nodes[i].expressionType != "semantic")		continue;
				if(nodes[i+1].expressionType != "semantic")	continue;

				var opNode = admSemanticNode.build("operator", "*", [nodes[i], nodes[i+1]]);
				opNode.assertHasValidChildren();

				nodes.splice(i, 2, opNode);
				i--;	//necessary if there are two implied times in a row e.g. "2ab"
			}
		}
		
		/*******************************************************************
		 * function:		parseOperators()
		 *
		 * description:	takes mixed collection of nodes `nodes` and replaces
		 *							all literal.nodeTypes.Operator whose getVal() matches
		 *							`condition` with appropriate semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *							condition:	REGEX
		 *
		 * return:			none
		 ******************************************************************/
		function parseOperators(nodes, condition) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(!condition.test(nodes[i].getVal()))		continue;

				if(i == nodes.length-1)									throw "errInvalidArguments";
				if(i === 0 && nodes[i].getVal() != "-")	throw "errInvalidArguments";

				//if operator is a unary minus
				if(i === 0 && nodes[i].getVal() == "-") {
					var opNode = admSemanticNode.build("unaryMinus", nodes[i+1]);
					opNode.assertHasValidChildren();

					nodes.splice(i, 2, opNode);
				} else {
					var opNode = admSemanticNode.build("operator", nodes[i].getVal(), [nodes[i-1], nodes[i+1]]);
					opNode.assertHasValidChildren();

					nodes.splice(i-1, 3, opNode);
				}

				i--;
			}
		}

		/*******************************************************************
		 * function:		build()
		 *
		 * description:	takes mixed collection of nodes `nodes` and parses
		 *							into a single semantic node
		 *
		 * arguments:		nodes:	[admLiteralNode | admSemanticNode]
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function build(nodes) {
			var newNodes = nodes.slice(); //use slice() to copy by value, not reference
			
			try {
				assertNotEmpty(newNodes);
				assertParenthesesMatched(newNodes);
				parseParentheses(newNodes);
				parseDivision(newNodes);
				parseRoots(newNodes);
				parseExponents(newNodes);							//create exponent semantic nodes, leave base empty for now
				parseMulticharacterSymbols(newNodes);	//parse symbols made of multiple characters, like sin, cos, pi
				parseNumerals(newNodes);
				parseVariables(newNodes);
				parseSymbols(newNodes);
				parseFunctions(newNodes);

				applyExponents(newNodes);							//fill in bases of exponent semantic nodes
				applyMulticharacterSymbols(newNodes);
				parseImpliedMultiplication(newNodes);
				parseOperators(newNodes, /[*]/);
				parseOperators(newNodes, /[+\-]/);
			} catch(e) {
				switch(e) {
					case "errNotFound":							return admSemanticNode.build("error", "Missing number.");
					case "errUnmatchedParenthesis":	return admSemanticNode.build("error", "Unmatched parenthesis.");
					case "errMalformedNumeral":			return admSemanticNode.build("error", "Malformed Number.");
					case "errInvalidArguments":			return admSemanticNode.build("error", "Invalid arguments.");
					case "errEmptyExpression":			return admSemanticNode.build("error", "Empty expression.");
					case "errMissingBase":					return admSemanticNode.build("error", "Exponent has no base.");
					case "errMissingArgument":			return admSemanticNode.build("error", "Function has no argument.");
					default:												return admSemanticNode.build("error", "Unidentified error.");
				}
			}

			if(newNodes.length > 1) admSemanticNode.build("error", "Irreducible expression.");
			return newNodes[0];
		}

		return {
			toOpenMath: function(nodes) {
				var semantic = build(nodes);

				if(semantic.type == "error")	throw semantic.error;

				var openmath = "<OMOBJ>";
				openmath += semantic.getOpenMath();
				openmath += "</OMOBJ>";

				return openmath;
			}
		};
	}]);
})();
