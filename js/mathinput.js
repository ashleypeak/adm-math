(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var ERR_NOT_FOUND							=	1;
	var ERR_UNMATCHED_PARENTHESIS	= 2;
	var ERR_MALFORMED_NUMERAL			= 3;
	var ERR_INVALID_ARGUMENTS 		= 4;
	var ERR_EMPTY_EXPRESSION			= 5;

	var mathInput = angular.module("mathInput", []);

	mathInput.run(["$templateCache", function($templateCache) {
		var template = "";
		template += "<div class=\"mathinput\" tabindex=\"0\" ng-keypress=\"control.keypress($event)\"";
			template += "	ng-keydown=\"control.keydown($event)\"";
			template += " ng-focus=\"control.focus()\" ng-blur=\"control.blur()\">";
		template += "<span ng-class=\"{'cursor': (cursor.position === 0 && cursor.visible)}\">&nbsp;</span>";
		template += "<span class=\"literal\" ng-repeat=\"node in expression.literal.tree.nodes track by $index\"";
			template += " ng-class=\"{'cursor': (cursor.position === $index+1 && cursor.visible)}\"";
			template += " ng-click=\"control.nodeClick($index)\">{{node.getVal()}}</span>";
		template += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{value}}\" />";
		template += "</div>";
		
		$templateCache.put("adm-math-input.htm", template);
	}]);

	mathInput.directive("admMathInput", ["$interval", function($interval) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				format: "=?admFormat",
				name: "=?admName",
				value: "=?admValue"
			},
			templateUrl: "adm-math-input.htm",
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

						if(/[a-zA-Z0-9.+\-*()]/.test(character))
							scope.expression.literal.insert(character);
						
						/*switch(e.keyCode) {
							case $.ui.keyCode.ENTER:
								miSubmit();
								break;
						}*/

						scope.output.write();
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

						if(captured) {
							scope.output.write();
							return false;
						}
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
									if(/[()]/.test(nodeVal))			node = new scope.expression.literal.nodeTypes.Parenthesis(nodeVal);

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
							Parenthesis: function(paren) {		//takes children: none
								this.expressionType = "literal";
								this.type = "parenthesis";
								this.isStart = (paren == "(" ? true : false);
								this.isEnd = !this.isStart;
								this.getVal = function() {	return (this.isStart ? "(" : ")");	};
							},
							Operator: function(op) {					//takes children: none
								this.expressionType = "literal";
								this.type = "operator";
								this.operator = op;
								this.getVal = function() {	return this.operator;	};
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
							var depth = 0;

							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType == "literal" && nodes[i].type == "parenthesis") {
									depth += (nodes[i].isStart ? 1 : -1);

									if(depth < 0)	throw ERR_UNMATCHED_PARENTHESIS;
								}
							}

							if(depth > 0)	throw ERR_UNMATCHED_PARENTHESIS;
						},

						/*******************************************************************
						 * function:		parseParentheses()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							replaces all literal subexpressions surrounded
						 *							by parentheses with appropriate semantic nodes
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseParentheses: function(nodes) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType == "literal" && nodes[i].type == "parenthesis" && nodes[i].isStart) {
									var subExpressionNodes = [];
									
									for(var j = i+1; nodes[j].type != "parenthesis" || !nodes[j].isEnd; j++)
										subExpressionNodes.push(nodes[j]);

									var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`
									var semanticNode = this.build(subExpressionNodes);
									if(semanticNode.type == "error")	throw ERR_EMPTY_EXPRESSION;

									nodes.splice(i, literalLength, semanticNode);
								}
							}
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
						 * description:	takes mixed collection of nodes `nodes` and parses
						 *							into a single semantic node
						 *
						 * arguments:		nodes:	[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			scope.expression.semantic.nodeTypes.[any]
						 ******************************************************************/
						build: function(nodes) {
							try {
								this.assertNotEmpty(nodes);
								this.assertParenthesesMatched(nodes);
								//parse division
								this.parseParentheses(nodes);
								//parse exponents 1 (create node with empty base)
								//parse multichar symbols 1 (sin, cos etc)
								this.parseNumerals(nodes);
								this.parseVariables(nodes);

								//parse exponents 2
								//parse multichars 2
								this.parseImpliedMultiplication(nodes);
								this.parseOperators(nodes, /[*]/);
								this.parseOperators(nodes, /[+\-]/);
							} catch(e) {
								switch(e) {
									case ERR_NOT_FOUND:							return new this.nodeTypes.Error("Missing number.");
									case ERR_UNMATCHED_PARENTHESIS:	return new this.nodeTypes.Error("Unmatched parenthesis.");
									case ERR_MALFORMED_NUMERAL:			return new this.nodeTypes.Error("Malformed Number.");
									case ERR_INVALID_ARGUMENTS:			return new this.nodeTypes.Error("Invalid arguments.");
									case ERR_EMPTY_EXPRESSION:			return new this.nodeTypes.Error("Empty expression.");
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
					 * return:			STRING
					 ******************************************************************/
					write: function() {
						var literalTree = scope.expression.literal.getTree();
						var literalTreeNodes = literalTree.getNodes().slice(); //use slice() to copy by value, not reference
						var semanticTree = scope.expression.semantic.build(literalTreeNodes);

						var openMath = "<OMOBJ>";
						openMath += semanticTree.getOpenMath();
						openMath += "</OMOBJ>";

						scope.value = openMath;
					}
				};

				element.on('$destroy', function() {
					//cancel the cursor flash interval
					scope.cursor.hide();
				});
			}
		};
	}]);
})();
