(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var ERR_NOT_FOUND							=	1;
	var ERR_UNMATCHED_PARENTHESIS	= 2;
	var ERR_MALFORMED_NUMERAL			= 3;
	var ERR_INVALID_ARGUMENTS 		= 4;
	var ERR_EMPTY_EXPRESSION			= 5;
	var ERR_MISSING_BASE					= 6;

	var mathInput = angular.module("admMathInput", []);

	mathInput.run(["$templateCache", function($templateCache) {
		var expressionTemplate = "";
		expressionTemplate += "<span>";
		expressionTemplate += "<span";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === 0 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick(-1)\">&nbsp;</span>";
		expressionTemplate += "<span";
		expressionTemplate += " ng-repeat=\"node in expression.nodes track by $index\"";
		expressionTemplate += " ng-switch on=\"node.type\">";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"exponent\"";
		expressionTemplate += " class=\"exponent\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.exponent\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"division\"";
		expressionTemplate += " class=\"division\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<span class=\"numerator\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.numerator\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "<span class=\"denominator\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.denominator\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-default";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible),";
		expressionTemplate += "  'exponent': node.type == 'exponent'}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">{{node.getVal()}}</span>";

		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		var inputTemplate = "";
		inputTemplate += "<div";
		inputTemplate += "	class=\"mathinput\"";
		inputTemplate += " tabindex=\"0\"";
		inputTemplate += " ng-keypress=\"control.keypress($event)\"";
		inputTemplate += "	ng-keydown=\"control.keydown($event)\"";
		inputTemplate += " ng-focus=\"control.focus()\"";
		inputTemplate += " ng-blur=\"control.blur()\">";
		inputTemplate += "<adm-math-expression";
		inputTemplate += " cursor=\"cursor\"";
		inputTemplate += " expression=\"expression.literal.tree\"";
		inputTemplate += " control=\"control\"></adm-math-expression>";
		inputTemplate += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{value}}\" />";
		inputTemplate += "</div>";
		
		$templateCache.put("adm-math-expression.htm", expressionTemplate);
		$templateCache.put("adm-math-input.htm", inputTemplate);
	}]);

	mathInput.directive("admMathExpression", function() {
		return {
			restrict: "E",
			replace: true,
			scope: {
				cursor: "=",
				expression: "=",
				control: "="
			},
			templateUrl: "adm-math-expression.htm",
			link: function(scope) {
			}
		};
	});

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

				/*******************************************************************
				 * object:			control{}
				 *
				 * description:	contains all functions used to handle user input
				 *							and interaction with the math input field
				 *
				 * variables:		none
				 * 
				 * functions:		`focus`			returns none
				 *							`blur`			returns none
				 *							`keypress`	returns none
				 *							`keydown`		returns BOOLEAN | none
				 *							`nodeClick`	returns none
				 ******************************************************************/
				scope.control = {
					/*******************************************************************
					 * function:		focus()
					 *
					 * description:	run on ngFocus of math input field
					 *							place cursor at end of field
					 *							relevant when user tabs into field or clicks
					 *							somewhere in field which is not on a node, otherwise
					 *							overridden by nodeClick()
					 *							THOUGHT:	How is it overridden? Doesn't the entire
					 *												focus bubbling chain run after the entire
					 *												click bubbling chain?
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					focus: function() {
						scope.cursor.expression = scope.expression.literal.tree;
						scope.cursor.goToEnd();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngBlur of math input field
					 *							hides the cursor
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					blur: function() {
						scope.cursor.hide();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngKeypress of math input field
					 *							if `e`.which is a valid character, inserts it into
					 *							expression
					 *
					 * arguments:		e:	Event
					 *
					 * return:			none
					 ******************************************************************/
					keypress: function(e) {
						var character = String.fromCharCode(e.which);
						if(/[a-zA-Z0-9.+\-*()\^]/.test(character))
							scope.cursor.insert(character);

						scope.output.write();
					},

					/*******************************************************************
					 * function:		blur()
					 *
					 * description:	run on ngKeydown of math input field
					 *							principally used when preventDefault is needed
					 *							i.e. on backspace and '/' (quickfind in firefox)
					 *
					 * arguments:		e:	Event
					 *
					 * return:			BOOLEAN | none
					 ******************************************************************/
					keydown: function(e) {
						//key has been captured and processed, prevent default action
						var captured = true;
						
						switch(e.keyCode) {
							case 8:		/*backspace*/				scope.cursor.backspace();								break;
							case 37:	/*left arrow*/			scope.cursor.moveLeft();								break;
							case 38:	/*up arrow*/				scope.cursor.moveUp();									break;
							case 39:	/*right arrow*/			scope.cursor.moveRight();								break;
							case 40:	/*down arrow*/			scope.cursor.moveDown();								break;
							case 191:	/*forward slash*/		scope.cursor.insert("/");								break;
							default:											captured = false;
						}

						if(captured) {
							scope.output.write();

							e.preventDefault();
							return false;
						}
					},

					/*******************************************************************
					 * function:		nodeClick()
					 *
					 * description:	run when an individual node element is clicked
					 *							moves cursor over the node at `nodeIndex` rather
					 *							than at the end of the math input field
					 *
					 * arguments:		nodeIndex	INT
					 *
					 * return:			none
					 ******************************************************************/
					nodeClick: function(nodeIndex) {
						//due to differing indices, position must be 1 higher than nodeIndex
						var position = nodeIndex + 1;
						scope.cursor.goToPos(nodeIndex+1);
					}
				};

				/*******************************************************************
				 * object:			cursor{}
				 *
				 * description:	contains all functions used to move the cursor
				 *							around the math input field, and relevant state
				 *							variables
				 *
				 * variables:		`expression`		scope.literal.nodeTypes.Expression
				 *							`position`			INT
				 *							`visible`				BOOL
				 *							`flashInterval`	Angular `promise`
				 * 
				 * functions:		`show`										returns none
				 *							`hide`										returns none
				 *							`insert`									returns none
				 *							`backspace`								returns none
				 *							`tryMoveIntoParent`				returns none
				 *							`tryMoveIntoExponent`			returns none
				 *							`tryMoveIntoDivision`			returns none
				 *							`tryMoveIntoNumerator`		returns none
				 *							`tryMoveIntoDenominator`	returns none
				 *							`moveLeft`								returns none
				 *							`moveUp`									returns none
				 *							`moveRight`								returns none
				 *							`moveDown`								returns none
				 *							`goToPos`									returns none
				 *							`goToEnd`									returns none
				 ******************************************************************/
				scope.cursor = {
					expression: null,			//the scope.literal.nodeTypes.Expression which the cursor is currently in
					position: null,				//the position of the cursor within `expression`
					visible: false,				//flag for whether the cursor should be visible (alternates for cursor flash)
					flashInterval: null,	//handler for cursor flashing interval

					/*******************************************************************
					 * function:		show()
					 *
					 * description:	show the cursor and start its flashing
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					show: function() {
						this.hide();
						this.visible = true;
						
						this.flashInterval = $interval(function() {
							scope.cursor.visible = !scope.cursor.visible;
						}, CURSOR_FLASHPERIOD);
					},

					/*******************************************************************
					 * function:		hide()
					 *
					 * description:	hide the cursor, and cancel flashing to avoid memory
					 *							leak
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					hide: function() {
						this.visible = false;
						$interval.cancel(this.flashInterval);
					},

					/*******************************************************************
					 * function:		insert()
					 *
					 * description:	insert character `character` after the node under
					 *							the cursor
					 *
					 * arguments:		character CHAR
					 *
					 * return:			none
					 ******************************************************************/
					insert: function(character) {
						this.expression.insert(this.position, character);
						this.moveRight();
					},

					/*******************************************************************
					 * function:		backspace()
					 *
					 * description:	delete node under cursor, if there is one
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					backspace: function() {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						if(this.position == 0)	return;

						this.expression.deleteAt(nodeIndex);
						this.moveLeft();
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoParent()
					 *
					 * description:	moves the cursor into the parent node, if it exists.
					 *							used when the cursor is at one terminus of its
					 *							current expression, and so can't move any further.
					 *							moves into parent before or after the current node
					 *							depending on `relativePosition`.
					 *
					 * arguments:		relativePosition: STRING ("before"|"after")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoParent: function(relativePosition) {
						if(this.expression.parentNode === null)	return false;

						//every expression except the root expression (scope.literal.tree)
						//has a parentNode (exponent or division), while every node of course
						//has a parent expression. we want to move into that expression
						var parentNode = this.expression.parentNode;
						var parentExpression = parentNode.parentNode;

						this.expression = parentExpression;
						this.position = this.expression.findNode(parentNode);
						this.position += (relativePosition == "after" ? 1 : 0);
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoExponent()
					 *
					 * description:	if the cursor is over an Exponent node, moves the
					 *							cursor inside the exponent expression, to the
					 *							start or end according to `terminus`.
					 *
					 * arguments:		terminus: STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoExponent: function(terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;

						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/	return false;
						if(this.expression.getNode(nodeIndex).type != "exponent")	return false;

						this.expression = this.expression.getNode(nodeIndex).exponent;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());

						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDivision()
					 *
					 * description:	if the cursor is over a Division node, moves the
					 *							cursor inside the numerator or denominator expression,
					 *							depending on `expression`, and to the start or end
					 *							of that expression according to `terminus`.
					 *
					 * arguments:		expression:	STRING ("numerator"|"denominator")
					 *							terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDivision: function(expression, terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;

						//if moving left, only try to enter node after scrolling PAST it
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;
						
						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/	return false;
						if(this.expression.getNode(nodeIndex).type != "division")	return false;

						var divisionNode = this.expression.getNode(nodeIndex);
						switch(expression) {
							case "numerator":			this.expression = divisionNode.numerator;			break;
							case "denominator":		this.expression = divisionNode.denominator;		break;
						}

						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoNumerator()
					 *
					 * description:	if the cursor is in a denominator, moves the cursor
					 *							up to the corresponding numerator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoNumerator: function(terminus) {
						if(this.expression.parentNode == null)									return false;
						if(this.expression.parentNode.type != "division")				return false;

						var divisionNode = this.expression.parentNode;
						if(this.expression.id !== divisionNode.denominator.id)	return false;

						this.expression = divisionNode.numerator;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDenominator()
					 *
					 * description:	if the cursor is in a numerator, moves the cursor
					 *							up to the corresponding denominator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDenominator: function(terminus) {
						if(this.expression.parentNode == null)								return false;
						if(this.expression.parentNode.type != "division")			return false;

						var divisionNode = this.expression.parentNode;
						if(this.expression.id !== divisionNode.numerator.id)	return false;

						this.expression = divisionNode.denominator;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		moveLeft()
					 *
					 * description:	attempts to move the cursor one character to the
					 *							left
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveLeft: function() {
						if(this.position == 0)	return this.tryMoveIntoParent("before");

						this.position--;
						this.tryMoveIntoExponent("end") || this.tryMoveIntoDivision("numerator", "end");
						this.show();
					},
					
					/*******************************************************************
					 * function:		moveUp()
					 *
					 * description:	attempts to move the cursor one *logical movement
					 *							unit* up. (currently just moves from denominator
					 *							of fraction to numerator)
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveUp: function() {
						this.tryMoveIntoNumerator("end");
						this.show();
					},
					
					/*******************************************************************
					 * function:		moveRight()
					 *
					 * description:	attempts to move the cursor one character to the
					 *							right
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveRight: function() {
						if(this.position == this.expression.getLength())	return this.tryMoveIntoParent("after");
						
						this.position++;
						this.tryMoveIntoExponent("start") || this.tryMoveIntoDivision("numerator", "start");
						this.show();
					},

					/*******************************************************************
					 * function:		moveDown()
					 *
					 * description:	attempts to move the cursor one *logical movement
					 *							unit* down. (currently just moves from numerator
					 *							of fraction to denominator)
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					moveDown: function() {
						this.tryMoveIntoDenominator("end");
						this.show();
					},

					/*******************************************************************
					 * function:		goToPos()
					 *
					 * description:	place cursor at position `pos` in expression.
					 *
					 * arguments:		pos: INT
					 *
					 * return:			none
					 ******************************************************************/
					goToPos: function(pos) {
						this.position = pos;
						this.show();
					},

					/*******************************************************************
					 * function:		goToEnd()
					 *
					 * description:	place cursor at end of expression
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					goToEnd: function() {
						this.position = this.expression.getLength();
						this.show();
					}
				};

				scope.expression = {
					literal: {
						nodeTypes: {
							Expression: function(parentNode) {			//takes children: Numeral, Letter, Operator, Division, Exponent
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = typeof parentNode !== "undefined" ? parentNode : null;
								this.expressionType = "literal";
								this.type = "expression";
								this.nodes = [];
								
								this.getVal = function() {	return null;	};

								this.createNode = function(nodeVal) {
									var node = null;

									if(/[0-9.]/.test(nodeVal))		node = new scope.expression.literal.nodeTypes.Numeral(this, nodeVal);
									if(/[a-zA-Z]/.test(nodeVal))	node = new scope.expression.literal.nodeTypes.Letter(this, nodeVal);
									if(/[+\-*]/.test(nodeVal))		node = new scope.expression.literal.nodeTypes.Operator(this, nodeVal);
									if(/[()]/.test(nodeVal))			node = new scope.expression.literal.nodeTypes.Parenthesis(this, nodeVal);
									if(/[\^]/.test(nodeVal))			node = new scope.expression.literal.nodeTypes.Exponent(this);
									if(/[\/]/.test(nodeVal))			node = new scope.expression.literal.nodeTypes.Division(this);

									return node;
								};
								
								this.insert = function(pos, nodeVal) {
									var node = this.createNode(nodeVal);

									this.nodes.splice(pos, 0, node);

									return node;
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

								this.findNode = function(node) {
									for(var i = 0; i < this.nodes.length; i++)
										if(this.nodes[i].id == node.id)
											return i;
								};
							},
							Numeral: function(parentNode, val) {					//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "numeral";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Letter: function(parentNode, val) {						//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "letter";
								this.value = val;
								this.getVal = function() {	return this.value;	};
							},
							Parenthesis: function(parentNode, paren) {		//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "parenthesis";
								this.isStart = (paren == "(" ? true : false);
								this.isEnd = !this.isStart;
								this.getVal = function() {	return (this.isStart ? "(" : ")");	};
							},
							Operator: function(parentNode, op) {					//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "operator";
								this.operator = op;
								this.getVal = function() {	return this.operator;	};
							},
							Exponent: function(parentNode) {						//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "exponent";
								this.exponent = new scope.expression.literal.nodeTypes.Expression(this);
								this.getVal = function() {	return null;	};
							},
							Division: function(parentNode) {						//takes children: none
								this.id = scope.expression.literal.nodeNextId++;
								this.parentNode = parentNode;
								this.expressionType = "literal";
								this.type = "division";
								this.numerator = new scope.expression.literal.nodeTypes.Expression(this);
								this.denominator = new scope.expression.literal.nodeTypes.Expression(this);
								this.getVal = function() {	return null;	};
							}
						},
						nodeNextId: 1,
						tree: null
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
							Exponent: function(base, exponent) {
								this.expressionType = "semantic";
								this.type = "exponent";
								this.base = typeof base !== "undefined" ? base : null;
								this.exponent = typeof exponent !== "undefined" ? exponent : null;

								this.assertHasValidChildren = function() {
										if(this.base == null || this.exponent == null)		throw ERR_INVALID_ARGUMENTS;
										if(this.base.type == "error")											throw ERR_INVALID_ARGUMENTS;
										if(this.exponent.type == "error")									throw ERR_INVALID_ARGUMENTS;
								}

								this.getOpenMath = function() {
									return "<OMA><OMS cd='arith1' name='power'>"
										+ this.base.getOpenMath()
										+ this.exponent.getOpenMath()
										+ "</OMA>";
								};
							},
							Division: function(numerator, denominator) {
								this.expressionType = "semantic";
								this.type = "division";
								this.numerator = typeof numerator !== "undefined" ? numerator : null;
								this.denominator = typeof denominator !== "undefined" ? denominator : null;

								this.assertHasValidChildren = function() {
										if(this.numerator == null || this.denominator == null)	throw ERR_INVALID_ARGUMENTS;
										if(this.numerator.type == "error")											throw ERR_INVALID_ARGUMENTS;
										if(this.denominator.type == "error")										throw ERR_INVALID_ARGUMENTS;
								}

								this.getOpenMath = function() {
									return "<OMA><OMS cd='arith1' name='divide'>"
										+ this.numerator.getOpenMath()
										+ this.denominator.getOpenMath()
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
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "parenthesis")				continue;
								
								depth += (nodes[i].isStart ? 1 : -1);
								if(depth < 0)	throw ERR_UNMATCHED_PARENTHESIS;
							}

							if(depth > 0)	throw ERR_UNMATCHED_PARENTHESIS;
						},

						/*******************************************************************
						 * function:		parseExponents()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							replaces all literal.nodeTypes.Exponent
						 *							with an equivalent semantic.nodeTypes.Exponent
						 *							leaves the semantic node's `base` as null
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseExponents: function(nodes) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "exponent")						continue;
								
								var semanticExponent = this.build(nodes[i].exponent.getNodes().slice());
								nodes.splice(i, 1, new this.nodeTypes.Exponent(null, semanticExponent));
							}
						},

						/*******************************************************************
						 * function:		applyExponents()
						 *
						 * description:	takes mixed collection of nodes `nodes` and,
						 *							wherever there is a semantic.nodeTypes.exponent,
						 *							fills its `base` with the preceding node
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						applyExponents: function(nodes) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType != "semantic")	continue;
								if(nodes[i].type != "exponent")						continue;

								if(i == 0)	throw ERR_MISSING_BASE;

								nodes[i].base = nodes[i-1];
								nodes[i].assertHasValidChildren();
								nodes.splice(i-1, 1);
							}
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
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "parenthesis")				continue;
								if(!nodes[i].isStart)											continue;

								var subExpressionNodes = [];
								for(var j = i+1; nodes[j].type != "parenthesis" || !nodes[j].isEnd; j++)
									subExpressionNodes.push(nodes[j]);

								var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`
								var semanticNode = this.build(subExpressionNodes);
								if(semanticNode.type == "error")	throw ERR_EMPTY_EXPRESSION;

								nodes.splice(i, literalLength, semanticNode);
							}
						},

						/*******************************************************************
						 * function:		parseDivision()
						 *
						 * description:	takes mixed collection of nodes `nodes` and
						 *							replaces all literal.nodeTypes.Exponent
						 *							with an equivalent semantic.nodeTypes.Exponent
						 *							leaves the semantic node's `base` as null
						 *							WARNING: mutates `nodes`
						 *
						 * arguments:		nodes:		[scope.expression.literal.nodeTypes.[any] | scope.expression.semantic.nodeTypes.[any]]
						 *
						 * return:			none
						 ******************************************************************/
						parseDivision: function(nodes) {
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "division")						continue;

								var semanticNumerator = this.build(nodes[i].numerator.getNodes().slice());
								var semanticDenominator = this.build(nodes[i].denominator.getNodes().slice());

								var semanticDivision = new this.nodeTypes.Division(semanticNumerator, semanticDenominator);
								semanticDivision.assertHasValidChildren();

								nodes.splice(i, 1, semanticDivision);
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
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "numeral")						continue;

								var numeral = "";
								for(var j = i; nodes[j] && nodes[j].expressionType == "literal" && nodes[j].type == "numeral"; j++)
										numeral += nodes[j].getVal();

								if(numeral == "")																				throw ERR_NOT_FOUND;
								if(numeral.indexOf(".") != numeral.lastIndexOf("."))		throw ERR_MALFORMED_NUMERAL;

								var semanticNumeral = new this.nodeTypes.Numeral(numeral);
								nodes.splice(i, numeral.length, semanticNumeral);
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
							for(var i = 0; i < nodes.length; i++) {
								if(nodes[i].expressionType != "literal")	continue;
								if(nodes[i].type != "letter")							continue;

								var semanticVariable = new this.nodeTypes.Variable(nodes[i].getVal()); 
								nodes.splice(i, 1, semanticVariable);
							}
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
								if(nodes[i].expressionType != "semantic")		continue;
								if(nodes[i+1].expressionType != "semantic")	continue;

								var opNode = new this.nodeTypes.Operator("*", [nodes[i], nodes[i+1]]);
								opNode.assertHasValidChildren();

								nodes.splice(i, 2, opNode);
								i--;	//necessary if there are two implied times in a row e.g. "2ab"
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
								if(nodes[i].expressionType != "literal")	continue;
								if(!condition.test(nodes[i].getVal()))		continue;

								if(i == 0 || i == nodes.length-1)	throw ERR_INVALID_ARGUMENTS;

								var opNode = new this.nodeTypes.Operator(nodes[i].getVal(), [nodes[i-1], nodes[i+1]]);
								opNode.assertHasValidChildren();

								nodes.splice(i-1, 3, opNode);
								i--;
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
								this.parseParentheses(nodes);
								this.parseDivision(nodes);
								this.parseExponents(nodes);		//create exponent semantic nodes, leave base empty for now
								//parse multichar symbols 1 (sin, cos etc)
								this.parseNumerals(nodes);
								this.parseVariables(nodes);

								this.applyExponents(nodes);		//fill in bases of exponent semantic nodes
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
									case ERR_MISSING_BASE:					return new this.nodeTypes.Error("Exponent has no base.");
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
						var literalTree = scope.expression.literal.tree;
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
