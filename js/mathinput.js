(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var ERR_NOT_FOUND				=	1;
	var ERR_UNMATCHED_PAREN	= 2;

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
								this.type = "numeral";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Letter: function(val) {						//takes children: none
								this.type = "letter";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Operator: function(op) {					//takes children: none
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
								this.type = "numeral";
								this.value = val;

								this.getOpenMath = function() {
									if(this.value.indexOf('.') != -1)
										return "<OMF dec='"+this.value+"'/>";
									return "<OMI>"+this.value+"</OMI>";
								};
							},
							Operator: function(symbol, children) {			//takes children: Numeral, Operator
								this.type = "operator";
								this.symbol = symbol;
								this.children = children;

								this.getOpenMath = function() {
									var opName = (this.symbol == "+" ? "plus" : (this.symbol == "-" ? "minus" : "times"));

									return "<OMA><OMS cd='arith1' name='"+opName+"'/>"
										+ this.children[0].getOpenMath()
										+ this.children[1].getOpenMath()
										+ "</OMA>";
								};
							},
							Error: function(message) {
								this.type = "error";

								this.getOpenMath = function() {
									return "<OME>[FIND OUT HOW ERRORS ARE RECORDED]</OME>";
								};
							}
						},

						/*******************************************************************
						 * function:		buildOperator()
						 *
						 * description:	if literalExpression contains an operator (outside
						 *							of any parentheticals), parses and returns as a
						 *							semantic expression
						 *							NB success=true does not mean that there were no
						 *							errors in OpenMath processing (i.e. it is possible
						 *							for a successful run to return an OME), just that
						 *							it succeeded in finding and processing an operator.
						 *
						 * arguments:		literalExpression:	scope.expression.literal.nodeTypes.Expression
						 *
						 * return:			success:	BOOLEAN
						 *							error:		UNDEFINED / INT
						 *							node:			scope.expression.semantic.nodeTypes.[any]
						 ******************************************************************/
						buildOperator: function(literalExpression) {
							var context = scope.expression.semantic;
							var operator = literalExpression.splitAtOperator();

							if(!operator.success) {
								switch(operator.error) {
									case ERR_NOT_FOUND:		return {success: false, error: ERR_NOT_FOUND};
								}
							}
							
							var semanticExpressions	= context.buildMultiple(operator.parts).nodes;

							for(var i = 0; i < semanticExpressions.length; i++)
								if(semanticExpressions[i].type == "error")
									return {success: true, node: semanticExpressions[i]};

							var returnNode = new context.nodeTypes.Operator(operator.symbol, semanticExpressions);

							return {success: true, node: returnNode};
						},

						/*******************************************************************
						 * function:		buildParenthetical()
						 *
						 * description:	if literalExpression contains a valid pair
						 *							of parentheses, parses and returns as a
						 *							semantic expression
						 *
						 * arguments:		literalExpression:	scope.expression.literal.nodeTypes.Expression
						 *
						 * return:			success:	BOOLEAN
						 *							error:		UNDEFINED / INT
						 *							node:			scope.expression.semantic.nodeTypes.[any]
						 ******************************************************************/
						buildParenthetical: function(literalExpression) {
							var context = scope.expression.semantic;
							var parenthetical = literalExpression.splitAtParenthetical();

							if(!parenthetical.success) {
								switch(parenthetical.error) {
									case ERR_NOT_FOUND:					return {success: false, error: ERR_NOT_FOUND};
									case ERR_UNMATCHED_PAREN:		return {success: true, node: new context.nodeTypes.Error("Unmatched parenthesis.")};
								}
							}
							
							var semanticExpressions	= context.buildMultiple(parenthetical.parts).parts;

							for(var i = 0; i < semanticExpressions.length; i++)
								if(semanticExpressions[i].type == "error")
									return semanticExpressions[i];

							var returnNode = null;
							switch(semanticExpressions.length) {
								case 1:	returnNode = semanticExpressions[0];																						break;
								case 2:	returnNode = new context.nodeTypes.Operator("*", semanticExpressions);					break;
								case 3:	returnNode = new context.nodeTypes.Operator("*", semanticExpressions.pop(),
																			new context.nodeTypes.Operator("*", semanticExpressions));				break;
							}

							return {success: true, node: returnNode};
						},

						/*******************************************************************
						 * function:		build()
						 *
						 * description:	takes `literalExpression`, parses fully and returns
						 *							a semantic expression
						 *
						 * arguments:		literalExpression:	scope.expression.literal.nodeTypes.Expression
						 *
						 * return:			success:	BOOLEAN
						 *							error:		UNDEFINED / INT
						 *							node:			scope.expression.semantic.nodeTypes.[any]
						 ******************************************************************/
						build: function(literalExpression) {
							var semanticExpression = null;

							semanticExpression = scope.expression.semantic.buildOperator(literalExpression);
							if(semanticExpression.success)
								return semanticExpression.node;

							/*semanticExpression = scope.expression.semantic.buildParenthetical(literalExpression);
							if(semanticExpression.success)
								return semanticExpression.node;*/
							
							if(literalExpression.getLength() == 0)
								return new scope.expression.semantic.nodeTypes.Error("Empty node.");

							var curSemanticNodeContents = "";
							for(var i = 0; i < literalExpression.getLength(); i++) {
								var literalNode = literalExpression.getNode(i);
								switch(literalNode.type) {
									case "numeral":
										curSemanticNodeContents += literalNode.getVal();
										break;
								}
							}

							return new scope.expression.semantic.nodeTypes.Numeral(curSemanticNodeContents);
						},

						/*******************************************************************
						 * function:		buildMultiple()
						 *
						 * description:	takes `literalExpressions`, runs each element
						 *							through build() and returns the array of semantic
						 *							expressions
						 *
						 * arguments:		literalExpression:	scope.expression.literal.nodeTypes.Expression
						 *
						 * return:			success:	BOOLEAN
						 *							error:		UNDEFINED / INT
						 *							nodes:		[scope.expression.semantic.nodeTypes.[any]]
						 ******************************************************************/
						buildMultiple: function(literalExpressions) {
							var semanticExpressions = [];

							for(var i = 0; i < literalExpressions.length; i++)
								semanticExpressions[i] = scope.expression.semantic.build(literalExpressions[i]);
							
							return {success: true, nodes: semanticExpressions};
						}
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
