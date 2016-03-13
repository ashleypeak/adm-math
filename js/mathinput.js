(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var ERR_NOT_FOUND					=	1;
	var ERR_UNMATCHED_PAREN		= 2;
	var ERR_MALFORMED_NUMERAL	= 3;
	var ERR_INVALID_ARGUMENTS = 4;
	var ERR_EMPTY_EXPRESSION	= 5;

	var app = angular.module("mathInputApp", []);

	app.directive("admMathInput", ["$interval", function($interval) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				format: "=?",
				name: "="
			},
			link: function(scope, element) {
				scope.format = angular.isDefined(scope.format) ? scope.format : "openmath";

				scope.control = {
					focus: function() {
						scope.cursor.goToEnd();
					},
					blur: function() {
						scope.cursor.hide();
					},
					keypress: function(e) {
						var character = String.fromCharCode(e.which);

						if(/[a-zA-Z0-9.+\-*]/.test(character))
							scope.expression.literal.insert(character);
						
						/*switch(e.keyCode) {
							case $.ui.keyCode.ENTER:
								miSubmit();
								break;
						}*/
					},
					keydown: function(e) {
						//key has been captured and processed, prevent default action
						var captured = true;
						
						switch(e.keyCode) {
							case 8:		/*backspace*/			scope.expression.literal.backspace();		break;
							case 37:	/*left arrow*/		scope.cursor.moveLeft();								break;
							case 39:	/*right arrow*/		scope.cursor.moveRight();								break;
							default:										captured = false;
						}

						if(captured)
							return false;
					},
					nodeClick: function(nodeIndex) {
						scope.cursor.goToPos(nodeIndex+1);
					}
				};

				scope.cursor = {
					position: null,
					visible: false,
					flashInterval: null,
					show: function() {
						scope.cursor.hide();
						scope.cursor.visible = true;
						
						scope.cursor.flashInterval = $interval(function() {
							scope.cursor.visible = !scope.cursor.visible;
						}, CURSOR_FLASHPERIOD);
					},
					hide: function() {
						scope.cursor.visible = false;
						$interval.cancel(scope.cursor.flashInterval);
					},
					moveLeft: function() {
						scope.cursor.position = Math.max(scope.cursor.position - 1, 0);
						scope.cursor.show();
					},
					moveRight: function() {
						scope.cursor.position = Math.min(scope.cursor.position + 1, scope.expression.literal.getLength());
						scope.cursor.show();
					},
					goToStart: function() {
						scope.cursor.position = 0;
						scope.cursor.show();
					},
					goToPos: function(pos) {
						scope.cursor.position = pos;
						scope.cursor.show();
					},
					goToEnd: function() {
						scope.cursor.position = scope.expression.literal.getLength();
						scope.cursor.show();
					}
				};

				scope.expression = {
					literal: {
						nodeTypes: {
							Expression: function(nodes) {			//takes children: Numeral, Letter, Operator, Division, Exponent
								this.expressionType = "literal";
								this.type = "expression";
								this.nodes = typeof nodes !== "undefined" ? nodes : [];
								
								this.getVal = function() { return null; }

								this.createNode = function(nodeVal) {
									var node = null;

									if(/[0-9.]/.test(nodeVal))		node = new scope.expression.literal.nodeTypes.Numeral(nodeVal);
									if(/[a-zA-Z]/.test(nodeVal))	node = new scope.expression.literal.nodeTypes.Letter(nodeVal);
									if(/[+\-*]/.test(nodeVal))		node = new scope.expression.literal.nodeTypes.Operator(nodeVal);

									return node;
								};
								
								this.insert = function(pos, nodeVal) {
									var node = this.createNode(nodeVal);

									this.nodes.splice(pos, 0, node);
								};

								this.deleteAt = function(pos) {
									this.nodes.splice(pos, 1);
								};

								this.getLength = function() {
									return this.nodes.length;
								};

								this.getNodes = function() {
									return this.nodes;
								};

								this.getNode = function(index) {
									return this.nodes[index];
								};

								/*******************************************************************
								 * function:		find()
								 *
								 * description:	find the first node in `this` whose getVal()
								 *							matches `nodeVal`
								 *
								 * arguments:		nodeVal:	STRING
								 *
								 * return:			success:	BOOLEAN
								 *							error:		UNDEFINED / INT
								 *							position:	INT
								 ******************************************************************/
								this.find = function(nodeVal) {
									for(var i = 0; i < this.getLength(); i++)
										if(this.getNode(i).getVal() == nodeVal)
											return {success: true, position: i};
									return {success: false, error: ERR_NOT_FOUND};
								};

								/*******************************************************************
								 * function:		split()
								 *
								 * description:	splits `this` into an array of two parts at `pos`,
								 *							removing `charsToDelete` characters after the split,
								 *							e.g.:
								 *							"1+2".split(1, 1)	=>	[1, 2]
								 *							"(1)(2)".split(3)	=>	[(1), (2)]
								 *
								 * arguments:		pos:						INT
								 *							charsToDelete:	INT
								 *
								 * return:			success:	BOOLEAN
								 *							error:		UNDEFINED / INT
								 *							parts:		[scope.expression.literal.nodeTypes.expression]
								 ******************************************************************/
								this.split = function(pos, charsToDelete) {
									var charsToDelete = typeof charsToDelete !== "undefined" ? charsToDelete : 0;

									var parts = [];
									parts[0] = new scope.expression.literal.nodeTypes.Expression(this.nodes.slice(0, pos));
									parts[1] = new scope.expression.literal.nodeTypes.Expression(this.nodes.slice(pos + charsToDelete));

									return {success: true, parts: parts};
								};

								/*******************************************************************
								 * function:		splitAtOperator()
								 *
								 * description:	if `this` contains an operator (outside
								 *							of any parentheticals), splits into a pair of
								 *							expressions around operator and returns, e.g.
								 *							a*b		=>	[a, b]
								 *							a+b		=>	[a, b]
								 *
								 * arguments:		none
								 *
								 * return:			success:	BOOLEAN
								 *							error:		UNDEFINED / INT
								 *							symbol:		"+" | "-" | "*"
								 *							parts:		[scope.expression.literal.nodeTypes.expression]
								 ******************************************************************/
								this.splitAtOperator = function() {
									var _this = this;
									var opFind = null;

									//this doesn't work because the `return` just returns the forEach
									//function. find a way to return properly.
									//also _this=this may not be needed. see if it can be removed
									/*var operators = ["+", "-", "*"];
									angular.forEach(operators, function(op) {
										opFind = _this.find(op);
										if(opFind.success) {
											var splitExpression = _this.split(opFind.position, 1);
											return {success: true, symbol: op, parts: splitExpression.parts};
										}
									});*/
									opFind = this.find("+");
									if(opFind.success) {
										var splitExpression = this.split(opFind.position, 1);
										return {success: true, symbol: "+", parts: splitExpression.parts};
									}
									opFind = this.find("-");
									if(opFind.success) {
										var splitExpression = this.split(opFind.position, 1);
										return {success: true, symbol: "-", parts: splitExpression.parts};
									}
									opFind = this.find("*");
									if(opFind.success) {
										var splitExpression = this.split(opFind.position, 1);
										return {success: true, symbol: "*", parts: splitExpression.parts};
									}

									return {success: false, error: ERR_NOT_FOUND};
								};

								/*******************************************************************
								 * function:		splitAtParenthetical()
								 *
								 * description:	if `this` contains a valid pair of parentheses,
								 *							splits into an array of expressions and returns,
								 *							e.g.:
								 *							a(b)c		=>	[a, b, c]
								 *							a(b)		=>	[a, b]
								 *							(a)b		=>	[a, b]
								 *							if unmatched parentheses are found, returns error
								 *
								 * arguments:		none
								 *
								 * return:			success:	BOOLEAN
								 *							error:		UNDEFINED / INT
								 *							parts:		[scope.expression.semantic.nodeTypes.Expression]
								 ******************************************************************/
								this.splitAtParenthetical = function() {
								};
							},
							Numeral: function(val) {					//takes children: none
								this.expressionType = "literal";
								this.type = "numeral";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Letter: function(val) {						//takes children: none
								this.expressionType = "literal";
								this.type = "letter";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Operator: function(op) {					//takes children: none
								this.expressionType = "literal";
								this.type = "operator";
								this.operator = op;
								this.getVal = function() {	return op;	};
							}
						},
						tree: null,
						insert: function(nodeVal) {
							scope.expression.literal.tree.insert(scope.cursor.position, nodeVal);
							scope.cursor.moveRight();
						},
						getLength: function() {
							return scope.expression.literal.tree.getLength();
						},
						backspace: function() {
							if(scope.cursor.position > 0) {
								scope.expression.literal.tree.deleteAt(scope.cursor.position - 1);
								scope.cursor.moveLeft();
							}
						},
						getTree: function() {
							return scope.expression.literal.tree;
						}
					},
					semantic: {
						nodeTypes: {
							Numeral: function(val) {									//takes children: none
								this.expressionType = "semantic";
								this.type = "numeral";
								this.value = val;

								this.getOpenMath = function() {
									if(this.value.indexOf('.') != -1)
										return "<OMF dec='"+this.value+"'/>";
									return "<OMI>"+this.value+"</OMI>";
								};
							},
							Variable: function(name) {									//takes children: none
								this.expressionType = "semantic";
								this.type = "variable";
								this.name = name;

								this.getOpenMath = function() {
									return "<OMV name='"+this.name+"'/>";
								};
							},
							Operator: function(symbol, children) {			//takes children: Numeral, Operator
								this.expressionType = "semantic";
								this.type = "operator";
								this.symbol = symbol;
								this.children = children;

								this.assertHasValidChildren = function() {
									for(var i = 0; i < 2; i++) {
										if(!this.children[i])																		throw ERR_INVALID_ARGUMENTS;
										if(!this.children[i].hasOwnProperty("expressionType"))	throw ERR_INVALID_ARGUMENTS;
										if(this.children[i].expressionType != "semantic")				throw ERR_INVALID_ARGUMENTS;
									}
								}

								this.getOpenMath = function() {
									var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

									return "<OMA><OMS cd='arith1' name='"+opName+"'/>"
										+ this.children[0].getOpenMath()
										+ this.children[1].getOpenMath()
										+ "</OMA>";
								};
							},
							Error: function(message) {
								this.expressionType = "semantic";
								this.type = "error";
								this.message = message;

								this.getOpenMath = function() {
									return "<OME>"+message+"[FIND OUT HOW ERRORS ARE RECORDED]</OME>";
								};
							}
						},

						/*******************************************************************
						 * function:		assertNotEmpty()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							throws an exception if the collection is empty
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						assertNotEmpty: function(nodes) {
							if(nodes.length == 0)	throw ERR_EMPTY_EXPRESSION;
						},

						/*******************************************************************
						 * function:		assertParenthesesMatched()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							throws an exception if there are any unmatched
						 *							parentheses
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						assertParenthesesMatched: function(nodes) {
						},

						/*******************************************************************
						 * function:		parseNumerals()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							replaces all literal.nodeTypes.Numeral
						 *							with appropriate semantic nodes
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseNumerals: function(nodes) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType == "literal" && nodes[i].type == "numeral") {
									var numeral = "";
									
									for(var j = i; nodes[j] && nodes[j].expressionType == "literal" && nodes[j].type == "numeral"; j++)
											numeral += nodes[j].getVal();

									if(numeral == "")																				throw ERR_NOT_FOUND;
									if(numeral.indexOf(".") != numeral.lastIndexOf("."))		throw ERR_MALFORMED_NUMERAL;

									nodes.splice(i, numeral.length, new this.nodeTypes.Numeral(numeral));
								}
							}
						},
						
						/*******************************************************************
						 * function:		parseVariables()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							replaces all literal.nodeTypes.Letter
						 *							with semantic.nodeTypes.Variable
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseVariables: function(nodes) {
							for(var i = 0; i < nodes.length; i++)
								if(nodes[i].expressionType == "literal" && nodes[i].type == "letter")
									nodes.splice(i, 1, new this.nodeTypes.Variable(nodes[i].getVal()));
						},

						/*******************************************************************
						 * function:		parseImpliedMultiplication()
						 *
						 * description:	takes mixed collection of nodes `nodes` and,
						 *							wherever there are two semantic.nodeTypes.[any]
						 *							side-by-side, replaces them with a multiplication
						 *							semantic node
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:			[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseImpliedMultiplication: function(nodes) {
							for(var i = 0; i < nodes.length-1; i++) {
								if(nodes[i].expressionType == "semantic" && nodes[i+1].expressionType == "semantic") {
									var opNode = new this.nodeTypes.Operator("*", [nodes[i], nodes[i+1]]);
									opNode.assertHasValidChildren();

									nodes.splice(i, 2, opNode);
									i--;	//necessary if there are two implied times in a row e.g. "2ab"
								}
							}
						},
						
						/*******************************************************************
						 * function:		parseOperators()
						 *
						 * description:	takes mixed collection of nodes `nodes` and replaces
						 *							all literal.nodeTypes.Operator whose getVal() matches
						 *							`condition` with appropriate semantic nodes
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:			[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *							condition:	REGEX
						 *
						 * return:			none
						 ******************************************************************/
						parseOperators: function(nodes, condition) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType == "literal" && condition.test(nodes[i].getVal())) {
									if(i == 0 || i == nodes.length-1)	throw ERR_INVALID_ARGUMENTS;

									var opNode = new this.nodeTypes.Operator(nodes[i].getVal(), [nodes[i-1], nodes[i+1]]);
									opNode.assertHasValidChildren();

									nodes.splice(i-1, 3, opNode);
									i--;
								}
							}
						},

						/*******************************************************************
						 * function:		build()
						 *
						 * description:	takes `literalExpression`, parses fully and returns
						 *							a semantic expression
						 *
						 * arguments:		literalExpression:	scope.expression.literal.nodeTypes.Expression
						 *
						 * return:			scope.expression.semantic.nodeTypes.[any]
						 ******************************************************************/
						build: function(literalExpression) {
							var nodes = literalExpression.getNodes().slice(); //copy node array

							try {
								this.assertNotEmpty(nodes);
								this.assertParenthesesMatched(nodes);
								//parse division
								//parse brackets
								//parse exponents 1 (create node with empty base)
								//parse multichar symbols 1 (sin, cos etc)
								this.parseNumerals(nodes);						//numbers
								this.parseVariables(nodes);						//variables
								//
								//parse exponents 2
								//parse multichars 2
								this.parseImpliedMultiplication(nodes);
								this.parseOperators(nodes, /[*]/);		//explicit *
								this.parseOperators(nodes, /[+\-]/);	//explicit +/-
							} catch(e) {
								switch(e) {
									case ERR_NOT_FOUND:					return new this.nodeTypes.Error("Missing number.");
									case ERR_MALFORMED_NUMERAL:	return new this.nodeTypes.Error("Malformed Number.");
									case ERR_INVALID_ARGUMENTS:	return new this.nodeTypes.Error("Invalid arguments.");
									case ERR_EMPTY_EXPRESSION:	return new this.nodeTypes.Error("Empty expression.");
								}
							}

							if(nodes.length > 1)	return new this.nodeTypes.Error("Irreducible expression.");
							return nodes[0];
						},
					}
				};
				scope.expression.literal.tree = new scope.expression.literal.nodeTypes.Expression();

				scope.output = {
					/*******************************************************************
					 * function:		get()
					 *
					 * description:	returns an OpenMath representation of the equation
					 *							in the math input field
					 *
					 * arguments:		none
					 *
					 * return:			success:	BOOLEAN
					 *							error:		UNDEFINED / INT
					 *							openmath:	STRING
					 ******************************************************************/
					get: function() {
						var literalTree = scope.expression.literal.getTree();
						var semanticTree = scope.expression.semantic.build(literalTree);

						var outputStr = "<OMOBJ>";
						outputStr += semanticTree.getOpenMath();
						outputStr += "</OMOBJ>";

						return {success: true, openmath: outputStr};
					}
				};

				element.on('$destroy', function() {
					//cancel the cursor flash interval
					scope.cursor.hide();
				});
			},
			templateUrl: "templates/adm-math-input.htm"
		};
	}]);

	app.controller("TestFormController", function() {
	});
})();
