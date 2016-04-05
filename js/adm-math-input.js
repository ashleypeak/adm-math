(function() {
	var CURSOR_FLASHPERIOD	= 530;

	var module = angular.module("admMathInput", ["ngSanitize", "admMathCore", "admMathOpenmathConverter", "admMathLiteralConverter"]);

	module.run(["$templateCache", function($templateCache) {
		var expressionTemplate = "";
		expressionTemplate += "<span ng-class=\"{'empty-expression': (expression.nodes.length === 0),";
		expressionTemplate += " 'cursor-inside': (cursor.expression == expression)}\">";
		expressionTemplate += "<span";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === 0 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick(-1)\">&nbsp;</span>";
		expressionTemplate += "<span";
		expressionTemplate += " ng-repeat=\"node in expression.nodes track by $index\"";
		expressionTemplate += " ng-switch on=\"node.type\">";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"exponent\"";
		expressionTemplate += " class=\"superscript\"";
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
		expressionTemplate += " ng-switch-when=\"squareRoot\"";
		expressionTemplate += " class=\"root\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.radicand\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"root\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " class=\"superscript\"";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.index\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "<span";
		expressionTemplate += " class=\"root\">";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.radicand\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"function\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "{{node.getDisplay().start}}";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.child\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "{{node.getDisplay().end}}";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-when=\"logarithm\"";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible)}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\">";
		expressionTemplate += "log";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " class=\"subscript\"";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.base\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += "(";
		expressionTemplate += "<adm-math-expression";
		expressionTemplate += " cursor=\"cursor\"";
		expressionTemplate += " expression=\"node.argument\"";
		expressionTemplate += " control=\"control\"></adm-math-expression>";
		expressionTemplate += ")";
		expressionTemplate += "</span>";

		expressionTemplate += "<span";
		expressionTemplate += " ng-switch-default";
		expressionTemplate += " ng-class=\"{'cursor': (cursor.expression == expression && cursor.position === $index+1 && cursor.visible),";
		expressionTemplate += "  'exponent': node.type == 'exponent'}\"";
		expressionTemplate += " ng-click=\"control.nodeClick($index)\" ng-bind-html=\"node.getDisplay()\"></span>";

		expressionTemplate += "</span>";
		expressionTemplate += "</span>";

		var inputTemplate = "";
		inputTemplate += "<div";
		inputTemplate += " class=\"mathinput\"";
		inputTemplate += " ng-class=\"{'mathinput-error': !output.isValid}\"";
		inputTemplate += " tabindex=\"0\"";
		inputTemplate += " ng-keypress=\"control.keypress($event)\"";
		inputTemplate += " ng-keydown=\"control.keydown($event)\"";
		inputTemplate += " ng-focus=\"control.focus()\"";
		inputTemplate += " ng-blur=\"control.blur()\">";
		inputTemplate += "<adm-math-expression";
		inputTemplate += " cursor=\"cursor\"";
		inputTemplate += " expression=\"literalTree\"";
		inputTemplate += " control=\"control\"></adm-math-expression>";
		inputTemplate += "<input type=\"hidden\" name=\"{{name}}\" value=\"{{model}}\" />";
		inputTemplate += "</div>";
		
		$templateCache.put("adm-math-expression.htm", expressionTemplate);
		$templateCache.put("adm-math-input.htm", inputTemplate);
	}]);

	module.directive("admMathExpression", function() {
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
	
	module.directive("admInputControl", function() {
		return {
			restrict: "A",
			scope: {
				target: "=admTarget",
				symbol: "@admSymbol"
			},
			link: function(scope, element, attrs) {
				element.bind("click", function(e) {
					scope.target.addSymbol(scope.symbol);
				});
			}
		};
	});

	module.directive("admMathInput", ["$interval", "admLiteralNode", "admLiteralParser", "admOpenmathLiteralConverter",
			function($interval, admLiteralNode, admLiteralParser, admOpenmathLiteralConverter) {
		return {
			restrict: "E",
			replace: true,
			scope: {
				model: "=?ngModel",
				hook: "=?admHook"
			},
			templateUrl: "adm-math-input.htm",
			link: function(scope, element, attrs) {
				scope.format = angular.isDefined(attrs.admFormat) ? attrs.admFormat : "openmath";
				scope.name = angular.isDefined(attrs.name) ? attrs.name : null;
				scope.literalTree = admLiteralNode.buildBlankExpression(null); //the parent admLiteralExpression of the admMathInput

				scope.hook = {
					addSymbol: function(symbol) {
						var nodes = [];
						switch(symbol) {
							case "plus":				nodes = [admLiteralNode.build(scope.cursor.expression, "+")];									break;
							case "minus":				nodes = [admLiteralNode.build(scope.cursor.expression, "-")];									break;
							case "times":				nodes = [admLiteralNode.build(scope.cursor.expression, "*")];									break;
							case "divide":			nodes = [admLiteralNode.build(scope.cursor.expression, "/")];									break;
							case "squareRoot":	nodes = [admLiteralNode.buildByName(scope.cursor.expression, "squareRoot")];	break;
							case "pi":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "pi")];					break;
							case "e":						nodes = [admLiteralNode.buildByName(scope.cursor.expression, "e")];						break;
							case "infinity":		nodes = [admLiteralNode.buildByName(scope.cursor.expression, "infinity")];		break;
							case "sin":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "sin")];					break;
							case "cos":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "cos")];					break;
							case "tan":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "tan")];					break;
							case "absolute":		nodes = [admLiteralNode.buildByName(scope.cursor.expression, "abs")];					break;
							case "ln":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "ln")];					break;
							case "log":					nodes = [admLiteralNode.buildByName(scope.cursor.expression, "log")];					break;
							case "root":				nodes = [admLiteralNode.buildByName(scope.cursor.expression, "root")];				break;
							case "power":				nodes = [admLiteralNode.build(scope.cursor.expression, "^")];									break;
							case "exponent":
								nodes = [
									admLiteralNode.buildByName(scope.cursor.expression, "e"),
									admLiteralNode.build(scope.cursor.expression, "^")
								];
								break;
							case "log10":
								var node = admLiteralNode.buildByName(scope.cursor.expression, "log");
								node.base.insert(0, admLiteralNode.build(node.base, "1"));
								node.base.insert(1, admLiteralNode.build(node.base, "0"));

								nodes = [node];
								break;
							default:
								if(/^[0-9.a-zA-Z+\-*()\^\/]$/.test(symbol))	nodes = [admLiteralNode.build(scope.cursor.expression, symbol)];
								else																				alert(symbol + ": Symbol not supported.");
						}
						
						angular.forEach(nodes, function(node) {
							scope.cursor.insertNode(node);
						});
						scope.output.write();

						element[0].focus();
					}
				};

				scope.$watch('model', function(newModel, oldModel) {
					if(newModel == scope.output.lastModel) return;

					try {
						if(!!newModel)	scope.literalTree = admOpenmathLiteralConverter.convert(newModel);
						else						scope.literalTree = admLiteralNode.buildBlankExpression(null);

						scope.output.write();
					} catch(e) {
						//just suppress any errors, user can't do anything about them
					}
				});

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
						scope.cursor.expression = scope.literalTree;
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
						if(/[a-zA-Z0-9.+\-*()\^|]/.test(character))
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

						scope.cursor.goToPos(position);
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
				 *							`visible`				BOOLEAN
				 *							`flashInterval`	Angular `promise`
				 * 
				 * functions:		`show`										returns none
				 *							`hide`										returns none
				 *							`insertDivision`					returns none
				 *							`insert`									returns none
				 *							`insertNode`							returns none
				 *							`backspace`								returns none
				 *							`tryMoveIntoParent`				returns BOOLEAN
				 *							`tryMoveIntoExponent`			returns BOOLEAN
				 *							`tryMoveIntoDivision`			returns BOOLEAN
				 *							`tryMoveIntoNumerator`		returns BOOLEAN
				 *							`tryMoveIntoDenominator`	returns BOOLEAN
				 *							`tryMoveIntoSquareRoot`		returns BOOLEAN
				 *							`moveLeft`								returns none
				 *							`moveUp`									returns none
				 *							`moveRight`								returns none
				 *							`moveDown`								returns none
				 *							`goToPos`									returns none
				 *							`goToEnd`									returns none
				 ******************************************************************/
				scope.cursor = {
					expression: null,			//the admLiteralExpression which the cursor is currently in
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
					 * function:		insertDivision()
					 *
					 * description:	insert a division symbol, and move the last logical
					 *							term (highly subjective) into the numerator
					 *
					 * arguments:		none
					 *
					 * return:			none
					 ******************************************************************/
					insertDivision: function() {
						var node = admLiteralNode.build(this.expression, "/");

						//when figuring out what should go in the numerator, don't break up bracketed terms
						var bracketDepth = 0;
						while(this.position > 0) {
							var nodeToCollect = this.expression.getNode(this.position-1);

							if(nodeToCollect.getVal() == ")")	bracketDepth++;
							if(nodeToCollect.getVal() == "(")	bracketDepth--;

							if(bracketDepth < 0)																					break;
							if(/[+\-]/.test(nodeToCollect.getVal()) && bracketDepth == 0)	break;

							nodeToCollect.parentNode = node.numerator;
							node.numerator.insert(0, nodeToCollect);
							this.expression.deleteAt(this.position-1);

							this.position--;
						}
						this.expression.insert(this.position, node);

						this.expression = node.denominator;
						this.position = 0;
					},
					
					/*******************************************************************
					 * function:		insert()
					 *
					 * description:	insert character (typed by user) `character` after
					 *							the node under the cursor
					 *
					 * arguments:		`character` CHAR
					 *								the character to be inserted
					 *
					 * return:			none
					 ******************************************************************/
					insert: function(character) {
						if(character == "/") return this.insertDivision();

						var node = admLiteralNode.build(this.expression, character);

						this.expression.insert(this.position, node);
						this.moveRight();
					},
					
					/*******************************************************************
					 * function:		insertNode()
					 *
					 * description:	insert a prebuilt node directly into 
					 *							the cursor
					 *
					 * arguments:		`node` admLiteralNode
					 *								the node to be inserted
					 *
					 * return:			none
					 ******************************************************************/
					insertNode: function(node) {
						this.expression.insert(this.position, node);
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
						
						if(this.position === 0)	return;

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

						//every expression except the root expression (scope.literalTree)
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
					 * function:		tryMoveIntoChild()
					 *
					 * description:	if the cursor is over a node with a child, moves the
					 *							cursor inside the child expression, to the
					 *							start or end according to `terminus`.
					 *
					 * arguments:		terminus: STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoChild: function(terminus) {
						//due to differing indices, this.position-1 is the node under the cursor
						var nodeIndex = this.position - 1;
						
						//if moving left, only try to enter node after scrolling PAST it
						//otherwise you can't scroll left to the space directly after the node
						if(terminus == "end")	nodeIndex++;

						if(nodeIndex < 0)	/*i.e. if cursor is left of all nodes*/		return false;
						if(nodeIndex >= this.expression.getLength())								return false;
						//if(this.expression.getNode(nodeIndex).type != "function")		return false;

						switch(this.expression.getNode(nodeIndex).type) {
							case "division":		this.expression = this.expression.getNode(nodeIndex).numerator;	break;
							case "exponent":		this.expression = this.expression.getNode(nodeIndex).exponent;	break;
							case "squareRoot":	this.expression = this.expression.getNode(nodeIndex).radicand;	break;
							case "function":		this.expression = this.expression.getNode(nodeIndex).child;			break;
							case "root":
								if(terminus == "start")	this.expression = this.expression.getNode(nodeIndex).index;
								if(terminus == "end")		this.expression = this.expression.getNode(nodeIndex).radicand;
								break;
							case "logarithm":
								if(terminus == "start")	this.expression = this.expression.getNode(nodeIndex).base;
								if(terminus == "end")		this.expression = this.expression.getNode(nodeIndex).argument;
								break;
							default:						return false;
						}

						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoNumerator()
					 *
					 * description:	if the cursor is in a denominator (even if it's an
					 *							ancestor), moves the cursor up to the corresponding
					 *							numerator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoNumerator: function(terminus) {
						var node = this.expression;
						while(true) {
							if(node.parentNode === null)						return false;
							if(node.parentNode.type != "division")	return false;

							var divisionNode = node.parentNode;

							if(node.id != divisionNode.denominator.id) {
								node = divisionNode.parentNode;
								continue;
							}

							this.expression = divisionNode.numerator;
							this.position = (terminus == "start" ? 0 : this.expression.getLength());
							return true;
						}
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoDenominator()
					 *
					 * description:	if the cursor is in a numerator (even if it's an
					 *							ancestor), moves the cursor down to the corresponding
					 *							denominator
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoDenominator: function(terminus) {
						var node = this.expression;
						while(true) {
							if(node.parentNode === null)						return false;
							if(node.parentNode.type != "division")	return false;

							var divisionNode = node.parentNode;

							if(node.id != divisionNode.numerator.id) {
								node = divisionNode.parentNode;
								continue;
							}

							this.expression = divisionNode.denominator;
							this.position = (terminus == "start" ? 0 : this.expression.getLength());
							return true;
						}
					},

					/*******************************************************************
					 * function:		tryMoveIntoLogBase()
					 *
					 * description:	if the cursor is in the argument of a logarithm,
					 *							moves the cursor to the base
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoLogBase: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)						return false;
						if(node.parentNode.type != "logarithm")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.argument.id)			return false;

						this.expression = logNode.base;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},

					/*******************************************************************
					 * function:		tryMoveIntoLogArgument()
					 *
					 * description:	if the cursor is in the base of a logarithm,
					 *							moves the cursor to the argument
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoLogArgument: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)						return false;
						if(node.parentNode.type != "logarithm")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.base.id)					return false;

						this.expression = logNode.argument;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoRootIndex()
					 *
					 * description:	if the cursor is in the radicand of a root,
					 *							moves the cursor to the index
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoRootIndex: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)				return false;
						if(node.parentNode.type != "root")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.radicand.id)	return false;

						this.expression = logNode.index;
						this.position = (terminus == "start" ? 0 : this.expression.getLength());
						return true;
					},
					
					/*******************************************************************
					 * function:		tryMoveIntoRootRadicand()
					 *
					 * description:	if the cursor is in the index of a root,
					 *							moves the cursor to the radicand
					 *
					 * arguments:		terminus:		STRING ("start"|"end")
					 *
					 * return:			BOOLEAN
					 ******************************************************************/
					tryMoveIntoRootRadicand: function(terminus) {
						var node = this.expression;
						if(node.parentNode === null)				return false;
						if(node.parentNode.type != "root")	return false;

						var logNode = node.parentNode;
						if(node.id != logNode.index.id)			return false;

						this.expression = logNode.radicand;
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
						if(this.position === 0)
							return this.tryMoveIntoLogBase("end") || this.tryMoveIntoRootIndex("end") || this.tryMoveIntoParent("before");

						this.position--;
						this.tryMoveIntoChild("end");
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
						if(this.position == this.expression.getLength())
							return this.tryMoveIntoLogArgument("start") || this.tryMoveIntoRootRadicand("start") || this.tryMoveIntoParent("after");
						
						this.position++;
						this.tryMoveIntoChild("start");
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
				scope.cursor.expression = scope.literalTree;

				scope.output = {
					lastModel: null, //used by $watch('value') to determine if ngModel was altered by this class or from outside
					isValid: true,

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
						try {
							var literalTreeNodes = scope.literalTree.getNodes();

							scope.model = this.lastModel = admLiteralParser.toOpenMath(literalTreeNodes);
							this.isValid = true;
						} catch(e) {
							scope.model = this.lastModel = "<OMOBJ><OME>"+e+"[FIND OUT HOW ERRORS ARE RECORDED]</OME></OMOBJ>";
							this.isValid = false;
						}
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
