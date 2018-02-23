/*******************************************************************
* NOTE: This converter ABSOLUTELY DOES NOT convert all OpenMath or
*				LaTeX. It converts a very small subset. It will convert
*				anything that is output but an admMathInput, but nothing
*				else is guaranteed.
*******************************************************************/

(function() {
	var module = angular.module("admMathParser", ["admMathLiteral", "admMathSemantic"]);

	module.factory("admXmlParser", function() {
		/*******************************************************************
		 * function:		parseDefault()
		 *
		 * description:	parses XML contained in `xmlString` into a DOM
		 *							document in most browsers
		 *
		 * arguments:		`xmlString` STRING
		 *
		 * return:			DOM Document
		 ******************************************************************/
		function parseDefault(xmlString) {
			var domParser = new window.DOMParser();
			var xmlDocument = domParser.parseFromString(xmlString, "text/xml");

			return xmlDocument;
		}

		/*******************************************************************
		 * function:		parseActivex()
		 *
		 * description:	parses XML contained in `xmlString` into a DOM
		 *							document in early versions of Internet Explorer
		 *
		 * arguments:		`xmlString` STRING
		 *
		 * return:			DOM Document
		 ******************************************************************/
		function parseActivex(xmlString) {
			var xmlDocument = new window.ActiveXObject("Microsoft.XMLDOM");
			xmlDocument.async = "false";
			xmlDocument.loadXML(xmlString);

			return xmlDocument;
		}

		return {
			/*******************************************************************
			 * function:		parse()
			 *
			 * description:	parses XML contained in `xmlString` into a DOM
			 *							document
			 *
			 * arguments:		`xmlString` STRING
			 *
			 * return:			DOM Document
			 ******************************************************************/
			parse: function(xmlString) {
				if(typeof window.DOMParser !== "undefined")			return parseDefault(xmlString);
				if(typeof window.ActiveXObject !== "undefined")	return parseActivex(xmlString);

				throw new Error("No XML parser found");
			}
		};
	});

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
		 * function:		assertPipesMatched()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							throws an exception if there are an uneven number
		 *							of | characters
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function assertPipesMatched(nodes) {
			var matched = true;
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "pipe")								continue;
				
				matched = !matched;
			}

			if(!matched)	throw "errUnmatchedPipe";
		}
		
		/*******************************************************************
		 * function:		parseRelations()
		 *
		 * description:	takes mixed collection of nodes `nodes` and replaces
		 *							all admLiteralRelation nodes with an
		 *							admSemanticRelation
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *							condition:	REGEX
		 *
		 * return:			none
		 ******************************************************************/
		function parseRelations(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "relation")						continue;
				
				var leftNode = build(nodes.slice(0, i));
				var rightNode = build(nodes.slice(i+1));
				
				var relNode = admSemanticNode.build("relation", nodes[i].symbol, [leftNode, rightNode]);
				relNode.assertHasValidChildren();
				
				nodes.splice(0, nodes.length, relNode);

				return;
			}
		}
		
		/*******************************************************************
		 * function:		collectList()
		 *
		 * description:	takes mixed collection of nodes `nodes` and an index
		 *							`index` where there is known to be a comma.
		 *							search forward and back to find the parentheses
		 *							containing the list, and return the indices of
		 *							the opening and closing parens.
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *							index:		INT
		 *
		 * return:			[INT, INT]
		 ******************************************************************/
		function collectList(nodes, index) {
			var start = null;
			var end = null;
			
			//go backwards, find the left paren around the list
			var depth = 1;
			for(var i = index-1; i >= 0; i--) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				
				depth += (nodes[i].isStart ? -1 : 1);
				
				if(depth == 0) {
					start = i;
					break;
				}
			}
			
			//go forwards, find the right paren around the list
			depth = 1;
			for(var i = index+1; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "parenthesis")				continue;
				
				depth += (nodes[i].isStart ? 1 : -1);
				
				if(depth == 0) {
					end = i;
					break;
				}
			}
			
			if(start === null || end === null)
				throw "errInvalidList";
			
			return [start, end];
		}
		
		/*******************************************************************
		 * function:		parseList()
		 *
		 * description:	takes mixed collection of nodes `nodes` and, if it
		 *							has any commas, parse it as a list, replacing all
		 *							literal subexpressions between the commas with parsed
		 *							semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseList(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "comma")	continue;
				
				var [start, end] = collectList(nodes, i);
				
				var members = []; //the list of semantic nodes which will comprise the admSemanticList.members
				var elementNodes = []; //the list of literal nodes which will be combined into a single semantic element
				
				var depth = 0; //don't collect commas inside brackets, they're sublists
				for(var j = start+1; j < end; j++) {
					if(nodes[j].expressionType == "literal" && nodes[j].type == "comma" && depth == 0) {
						var elementNode = build(elementNodes);
						members.push(elementNode);
						
						elementNodes = [];
					} else {
						elementNodes.push(nodes[j]);
						
						if(nodes[j].expressionType != "literal")	continue;
						if(nodes[j].type != "parenthesis")				continue;
						depth += (nodes[j].isStart ? 1 : -1);
					}
				}
				
				var elementNode = build(elementNodes);
				members.push(elementNode);
				
				var listNode = admSemanticNode.build("list", members);
				listNode.assertHasValidChildren();
				
				nodes.splice(start, end-start+1, listNode); //splice takes (start, length), not (start, end)
				
				i = start;
			}
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
		 * function:		parsePipes()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all literal subexpressions surrounded
		 *							by pipes with absolute semantic nodes
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parsePipes(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "pipe")								continue;

				var subExpressionNodes = [];
				for(var j = i+1; nodes[j].type != "pipe"; j++)
					subExpressionNodes.push(nodes[j]);

				var literalLength = subExpressionNodes.length+2; //number of nodes that have to be replaced in `nodes`

				var semanticChild = build(subExpressionNodes);
				var semanticAbs = admSemanticNode.build("function", "abs", semanticChild);
				semanticAbs.assertHasValidChildren();

				nodes.splice(i, literalLength, semanticAbs);
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
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseRoots(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")											continue;
				if(nodes[i].type != "squareRoot" && nodes[i].type != "root")	continue;
				
				var semanticIndex;
				if(nodes[i].type == "squareRoot")	semanticIndex = admSemanticNode.build("numeral", "2");
				else															semanticIndex = build(nodes[i].index.getNodes());

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
		 Pipes*
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
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /π/, ["constant", "pi"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /e/, ["constant", "e"]);
			nodeString = replaceMulticharacterSymbols(nodes, nodeString, /abs/, ["function", "abs"]);
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
				if(nodes[i].child !== null)								continue; //some functions are parsed by parseNamedFunctions()

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
		 * function:		parsePrimes()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							remove all admLiteralPrimes, while increasing the
		 *							number of primes on the admSemanticVariable to the
		 *							left.
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parsePrimes(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "prime")							continue;
				
				if(i == 0)																	throw "errMisplacedPrime";
				if(nodes[i-1].expressionType != "semantic")	throw "errMisplacedPrime";
				if(nodes[i-1].type != "variable")						throw "errMisplacedPrime";
				
				nodes[i-1].prime++;

				nodes.splice(i, 1); //just remove the prime node
				
				i--;
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
		 * function:		parseNamedFunctions()
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
		function parseNamedFunctions(nodes) {
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
		 * function:		parseLogarithms()
		 *
		 * description:	takes mixed collection of nodes `nodes` and
		 *							replaces all admLiteralLogarithms with
		 *							admSemanticLogarithms
		 *							WARNING: mutates `nodes`
		 *
		 * arguments:		nodes:		[admLiteralNode | admSemanticNode]
		 *
		 * return:			none
		 ******************************************************************/
		function parseLogarithms(nodes) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i].expressionType != "literal")	continue;
				if(nodes[i].type != "logarithm")					continue;

				var semanticBase = build(nodes[i].base.getNodes());
				var semanticArgument = build(nodes[i].argument.getNodes());
				var semanticLogarithm = admSemanticNode.build("logarithm", semanticBase, semanticArgument);
				semanticLogarithm.assertHasValidChildren();

				nodes.splice(i, 1, semanticLogarithm);
			}
		}

		/*******************************************************************
		 * function:		parseFunctions()
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
		function parseFunctions(nodes) {
			for(var i = 0; i < nodes.length-1; i++) {
				if(nodes[i].expressionType != "semantic")		continue;
				if(nodes[i+1].expressionType != "semantic")	continue;
				
				if(nodes[i].type == "variable" && (nodes[i].name == "f" || nodes[i].name == "g")) {
					var functionName = nodes[i].name;
					
					for(var j = 0; j < nodes[i].prime; j++)
						functionName += "'";
					
					var fnNode = admSemanticNode.build("function", functionName, nodes[i+1]);
					fnNode.assertHasValidChildren();
					
					nodes.splice(i, 2, fnNode);
					i--;	//necessary if there are two implied times in a row e.g. "2ab"
				}
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
		 *							into a single semantic node. Adds an admSemanticWrapper
		 *							around it if `hasParent` is false
		 *
		 * arguments:		nodes:			[admLiteralNode | admSemanticNode]
		 *							hasParent:	BOOLEAN
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function build(nodes, hasParent) {
			hasParent = (typeof hasParent !== "undefined") ? hasParent : true;
			var newNodes = nodes.slice(); //use slice() to copy by value, not reference
			
			try {
				assertNotEmpty(newNodes);
				assertParenthesesMatched(newNodes);
				assertPipesMatched(newNodes);
				parseRelations(newNodes);
				parseList(newNodes);
				parseParentheses(newNodes);
				parsePipes(newNodes);
				parseDivision(newNodes);
				parseRoots(newNodes);
				parseExponents(newNodes);							//create exponent semantic nodes, leave base empty for now
				parseMulticharacterSymbols(newNodes);	//parse symbols made of multiple characters, like sin, cos, pi
				parseNumerals(newNodes);
				parseVariables(newNodes);
				parsePrimes(newNodes);
				parseSymbols(newNodes);
				parseNamedFunctions(newNodes);
				parseLogarithms(newNodes);

				applyExponents(newNodes);							//fill in bases of exponent semantic nodes
				applyMulticharacterSymbols(newNodes);
				
				parseFunctions(newNodes);
				
				parseImpliedMultiplication(newNodes);
				parseOperators(newNodes, /[*]/);
				parseOperators(newNodes, /[+\-]/);
			} catch(e) {
				switch(e) {
					case "errNotFound":							return admSemanticNode.build("error", "Missing number.");
					case "errUnmatchedParenthesis":	return admSemanticNode.build("error", "Unmatched parenthesis.");
					case "errUnmatchedPipe":				return admSemanticNode.build("error", "Unmatched pipe.");
					case "errInvalidList":					return admSemanticNode.build("error", "Invalid list.");
					case "errMalformedNumeral":			return admSemanticNode.build("error", "Malformed Number.");
					case "errInvalidArguments":			return admSemanticNode.build("error", "Invalid arguments.");
					case "errEmptyExpression":			return admSemanticNode.build("error", "Empty expression.");
					case "errMissingBase":					return admSemanticNode.build("error", "Exponent has no base.");
					case "errMissingArgument":			return admSemanticNode.build("error", "Function has no argument.");
					case "errMisplacedPrime":				return admSemanticNode.build("error", "There is a prime (') in an illegal position.");
					default:												return admSemanticNode.build("error", "Unidentified error.");
				}
			}

			if(newNodes.length > 1) return admSemanticNode.build("error", "Irreducible expression.");
			
			if(hasParent)
				return newNodes[0];
			return admSemanticNode.build("wrapper", newNodes[0]);
		}

		return {
			getAdmSemantic: function(literalNode) {
				var literalNodes = literalNode.getNodes();
				
				var semantic = build(literalNodes, false);
				
				return semantic;
			}
		};
	}]);
	
	module.factory("admOpenmathParser", ["admXmlParser", "admSemanticNode", function(xmlParser, admSemanticNode) {
		/*******************************************************************
		 * function:		convertArith1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `arith1`
		 *							as node `xmlNode`, converts to an admSemanticNode
		 *							and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertArith1(xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "abs":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.abs takes one child.");

					var childNode = convertNode(xmlNode.childNodes[1]);
					var absNode = admSemanticNode.build("function", "abs", childNode);

					return absNode;
				case "plus":
				case "minus":
				case "times":
					var opName = omsNode.attributes.name.nodeValue;
					var symbol = (opName == "plus" ? "+" : (opName == "minus" ? "-" : "*"));
					
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1."+opName+" takes two children.");

					var childNodes = [
						convertNode(xmlNode.childNodes[1]),
						convertNode(xmlNode.childNodes[2])
					];
					var opNode = admSemanticNode.build("operator", symbol, childNodes);

					return opNode;
				case "divide":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.divide takes two children.");

					var numeratorNode = convertNode(xmlNode.childNodes[1]);
					var denominatorNode = convertNode(xmlNode.childNodes[2]);
					var divisionNode = admSemanticNode.build("division", numeratorNode, denominatorNode);

					return divisionNode;
				case "power":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.power takes two children.");

					var baseNode = convertNode(xmlNode.childNodes[1]);
					var exponentNode = convertNode(xmlNode.childNodes[2]);
					var powerNode = admSemanticNode.build("exponent", baseNode, exponentNode);

					return powerNode;
				case "root":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.root takes two children.");

					var indexNode = convertNode(xmlNode.childNodes[2]);
					var radicandNode = convertNode(xmlNode.childNodes[1]);
					var rootNode = admSemanticNode.build("root", indexNode, radicandNode);

					return rootNode;
				case "unary_minus":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.unary_minus takes one child.");

					var childNode = convertNode(xmlNode.childNodes[1]);
					var minusNode = admSemanticNode.build("unaryMinus", childNode);

					return minusNode;
			}

			throw new Error("OMA references unimplemented symbol arith1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertTransc1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `transc1`
		 *							as node `xmlNode`, converts to an admSemanticNode
		 *							returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertTransc1(xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "exp":
					if(xmlNode.childNodes.length != 2)	throw new Error("transc1.exp takes one child.");

					var baseNode = admSemanticNode.build("constant", "e");
					var exponentNode = convertNode(xmlNode.childNodes[1]);
					var powerNode = admSemanticNode.build("exponent", baseNode, exponentNode);

					return powerNode;
				case "log":
					if(xmlNode.childNodes.length != 3)	throw new Error("transc1.log takes two children.");

					var baseNode = convertNode(xmlNode.childNodes[1]);
					var argumentNode = convertNode(xmlNode.childNodes[2]);
					var logNode = admSemanticNode.build("logarithm", baseNode, argumentNode);

					return logNode;
				case "ln":
				case "sin":
				case "cos":
				case "tan":
					var functionName = omsNode.attributes.name.nodeValue;

					var childNode = convertNode(xmlNode.childNodes[1]);
					var functionNode = admSemanticNode.build("function", functionName, childNode);

					return functionNode;
			}

			throw new Error("OMA references unimplemented symbol transc1."+omsNode.attributes.name.nodeValue);
		}
		
		/*******************************************************************
		 * function:		convertList1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `list1`
		 *							as node `xmlNode`, converts to an admSemanticNode
		 *							returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertList1(xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "list":
					if(xmlNode.childNodes.length < 3)	throw new Error("transc1.exp takes at least three children.");
					
					var memberNodes = [];
					
					for(var i = 1; i < xmlNode.childNodes.length; i++) {
						var node = convertNode(xmlNode.childNodes[i]);
						memberNodes.push(node);
					}

					var listNode = admSemanticNode.build("list", memberNodes);

					return listNode;
			}

			throw new Error("OMA references unimplemented symbol list1."+omsNode.attributes.name.nodeValue);
		}
		
		/*******************************************************************
		 * function:		convertRelation1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `relation1`
		 *							as node `xmlNode`, converts to an admSemanticNode
		 *							returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertRelation1(xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "eq":
				case "lt":
				case "gt":
				case "leq":
				case "geq":
					var symbolName = omsNode.attributes.name.nodeValue;
					
					if(xmlNode.childNodes.length != 3)	throw new Error("relation1."+symbolName+" takes two children.");
					
					var symbol = {"eq": "=", "lt": "<", "gt": ">", "leq": "leq", "geq": "geq"}[symbolName];

					var childNodes = [
						convertNode(xmlNode.childNodes[1]),
						convertNode(xmlNode.childNodes[2])
					];
					
					var relNode = admSemanticNode.build("relation", symbol, childNodes);

					return relNode;
			}

			throw new Error("OMA references unimplemented symbol relation1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNums1()
		 *
		 * description:	takes an OMS in content dictionary `nums1` as node
		 *							node `xmlNode`, converts to an admSemanticNode
		 *							and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertNums1(xmlNode) {
			switch(xmlNode.attributes.name.nodeValue) {
				case "e":
					return admSemanticNode.build("constant", "e");
				case "pi":
					return admSemanticNode.build("constant", "pi");
				case "infinity":
					return admSemanticNode.build("constant", "infinity");
			}

			throw new Error("OMA references unimplemented symbol nums."+xmlNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMOBJ()
		 *
		 * description:	takes an OMOBJ node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMOBJ(xmlNode) {
			if(xmlNode.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			var childNode = convertNode(xmlNode.childNodes[0]);
			var semanticNode = admSemanticNode.build("wrapper", childNode);

			return semanticNode;
		}

		/*******************************************************************
		 * function:		convertOMI()
		 *
		 * description:	takes an OMI node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMI(xmlNode) {
			if(xmlNode.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			var semanticNode = admSemanticNode.build("numeral", xmlNode.childNodes[0].nodeValue);

			return semanticNode;
		}

		/*******************************************************************
		 * function:		convertOMF()
		 *
		 * description:	takes an OMF node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMF(xmlNode) {
			if(xmlNode.childNodes.length !== 0)								throw new Error("Node has incorrect number of children.");
			if(typeof xmlNode.attributes.dec == "undefined")	throw new Error("OMF must have attribute `dec`.");

			var semanticNode = admSemanticNode.build("numeral", xmlNode.attributes.dec.nodeValue);

			return semanticNode;
		}

		/*******************************************************************
		 * function:		convertOMV()
		 *
		 * description:	takes an OMV node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMV(xmlNode) {
			if(xmlNode.childNodes.length !== 0)								throw new Error("Node has incorrect number of children.");
			if(typeof xmlNode.attributes.name == "undefined")	throw new Error("OMV must have attribute `name`.");
			
			var varName = xmlNode.attributes.name.nodeValue;
			var varParts = null;
			
			if((varParts = /^(.+)_prime(\d+)$/.exec(varName)) !== null) {
				var semanticNode = admSemanticNode.build("variable", varParts[1]);
				semanticNode.prime = parseInt(varParts[2]);
				
				return semanticNode;
			} else {
				var semanticNode = admSemanticNode.build("variable", varName);
				
				return semanticNode;
			}	
		}

		/*******************************************************************
		 * function:		convertOMA()
		 *
		 * description:	takes an OMA node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMA(xmlNode) {
			if(xmlNode.childNodes.length === 0) throw new Error("OMA requires at least one child.");

			omsNode = xmlNode.childNodes[0];
			if(omsNode.nodeName !== "OMS")										throw new Error("OMA must have OMS as first child.");
			if(typeof omsNode.attributes.cd == "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof omsNode.attributes.name == "undefined")	throw new Error("OMS must define a name.");

			switch(omsNode.attributes.cd.nodeValue) {
				case "arith1":		return convertArith1(xmlNode);
				case "transc1":		return convertTransc1(xmlNode);
				case "list1":			return convertList1(xmlNode);
				case "relation1":	return convertRelation1(xmlNode);
			}

			throw new Error("OMA references unimplemented content dictionary: "+omsNode.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMS()
		 *
		 * description:	takes an OMS node `xmlNode` (that isn't being use to
		 *							define an OMA),  converts to an admSemanticNode
		 *							and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertOMS(xmlNode) {
			if(typeof xmlNode.attributes.cd == "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof xmlNode.attributes.name == "undefined")	throw new Error("OMS must define a name.");

			switch(xmlNode.attributes.cd.nodeValue) {
				case "nums1":	return convertNums1(xmlNode);
			}

			throw new Error("OMS references unimplemented content dictionary: "+xmlNode.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNode()
		 *
		 * description:	takes any OpenMath node `xmlNode`, converts to an
		 *							admSemanticNode and returns
		 *
		 * arguments:		`xmlNode` DOM Element
		 *
		 * return:			admSemanticNode
		 ******************************************************************/
		function convertNode(xmlNode) {
			switch(xmlNode.nodeName) {
				case "OMOBJ":	return convertOMOBJ(xmlNode);
				case "OMI":		return convertOMI(xmlNode);
				case "OMF":		return convertOMF(xmlNode);
				case "OMV":		return convertOMV(xmlNode);
				case "OMA":		return convertOMA(xmlNode);
				case "OMS":		return convertOMS(xmlNode);
			}

			throw new Error("Unknown node type: "+xmlNode.nodeName);
		}

		return {
			/*******************************************************************
			 * function:		getAdmSemantic()
			 *
			 * description:	converts OpenMath document in `openmath` to
			 *							admSemanticNode
			 *
			 * arguments:		`openmath` STRING
			 *
			 * return:			admSemanticNode
			 ******************************************************************/
			getAdmSemantic: function(openmath) {
				//remove all whitespace between tags
				openmath = openmath.replace(/>\s+</g, "><");

				var openmathDocument = xmlParser.parse(openmath);

				var omobj = openmathDocument.getElementsByTagName("OMOBJ");
				if(omobj.length != 1)	throw new Error("Document must have one OMOBJ root node.");

				return convertNode(omobj[0]);
			}
		};
	}]);
	
	module.factory("admLatexParser", ["admLiteralNode", "admLiteralParser", function(admLiteralNode, admLiteralParser) {
		/*******************************************************************
		 * function:		findExpression()
		 *
		 * description:	takes a LaTeX string `latex` and extract the first
		 *							'unit' - either a single character or a bracketed
		 *							set of characters. Return that unit (stripped of
		 *							bracketing), the rest of the latex, and a string
		 *							representing bracket type - "", "()", "{}", or "[]"
		 *
		 * arguments:		`latex` STRING
		 *
		 * return:			ARRAY [ STRING, STRING, STRING ]
		 ******************************************************************/
		function findExpression(latex) {
			var bracketType = "";
			var expression = "";
			
			latex = /^\s*(.+)$/.exec(latex)[1]; //trim whitespace
			
			switch(latex[0]) {
				case "{":		bracketType = "{}";	break;
				case "(":		bracketType = "()";	break;
				case "[":		bracketType = "[]";	break;
				default:		return [latex[0], latex.substr(1), ""];
			}
			
			var depth = 1; //number of brackets deep - finish when depth==0;
			for(var i = 1; i < latex.length; i++) {
				switch(latex[i]) {
					case bracketType[0]:	depth++;	break;
					case bracketType[1]:	depth--;	break;
				}
				
				if(depth == 0)
					return [latex.substring(1, i), latex.substr(i+1), bracketType];
			}
			
			throw new Error("Unclosed bracket sequence.");
		}
		
		/*******************************************************************
		 * function:		collectSimple()
		 *
		 * description:	takes a LaTeX string `latex`, already confirmed to
		 *							start with a symbol which is rendered in admLiteral
		 *							as a single node (a so-called 'simple node'), and
		 *							extract it to an admLiteralNode. return the new node'
		 *							and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectSimple(parentLiteralNode, latex) {
			var simpleNode = admLiteralNode.build(parentLiteralNode, latex[0]);
			
			return [simpleNode, latex.substr(1)];
		}
		
		/*******************************************************************
		 * function:		collectExponent()
		 *
		 * description:	takes a LaTeX string `latex`, already confirmed to
		 *							start with a '^', and extract the caret and the
		 *							subsequent exponent string into an admLiteralNode.
		 *							return the new node and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectExponent(parentLiteralNode, latex) {
			latex = latex.substr(1);
			
			var exponentNode = admLiteralNode.build(parentLiteralNode, "^");
			var exponentExpression = null;
			
			[exponentExpression, latex] = findExpression(latex);
			exponentNode.exponent.nodes = collectExpression(exponentNode, exponentExpression);
			
			return [exponentNode, latex];
		}
		
		/*******************************************************************
		 * function:		collectFunction()
		 *
		 * description:	takes a LaTeX string `latex`, which has just had a
		 *							\sin, \cos, etc command removed from the start
		 *							(identified by `command`), grab its argument and
		 *							build into an admLiteralNode
		 *							return that node and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *							`command` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectFunction(parentLiteralNode, latex, command) {
			var functionNode = admLiteralNode.buildByName(parentLiteralNode, command);
			var childExpression = null;
			
			[childExpression, latex] = findExpression(latex);
			functionNode.child.nodes = collectExpression(functionNode, childExpression);
			
			return [functionNode, latex];
		}
		
		/*******************************************************************
		 * function:		collectRoot()
		 *
		 * description:	takes a LaTeX string `latex`, which has just had a
		 *							\sqrt command removed from the start. grab its
		 *							argument and build into an admLiteralNode, then
		 *							return that node and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectRoot(parentLiteralNode, latex) {
			var rootNode = admLiteralNode.buildByName(parentLiteralNode, "root");
			var indexExpression = null;
			var radicandExpression = null;
			
			var bracketType = null;
			[indexExpression, latex, bracketType] = findExpression(latex);
			
			//in latex, \sqrt{a} means square-root(a), \sqrt[a]{b} means a-th-root(b)
			//if the first argument is in square brackets, it's of the second format
			//	and we need to then collect the radicand.
			//if it's not, it's in the first format and we've misidentified the radicand
			//	as the index. move it and set the index to 2.
			if(bracketType === "[]") {
				[radicandExpression, latex] = findExpression(latex);
			} else {
				radicandExpression = indexExpression;
				indexExpression = "2";
			}
			
			rootNode.index.nodes = collectExpression(rootNode, indexExpression);
			rootNode.radicand.nodes = collectExpression(rootNode, radicandExpression);
			
			return [rootNode, latex];
		}
		
		/*******************************************************************
		 * function:		collectRoot()
		 *
		 * description:	takes a LaTeX string `latex`, which has just had a
		 *							\log command removed from the start. grab its
		 *							base and argument and build into an admLiteralNode,
		 *							then return that node and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectLog(parentLiteralNode, latex) {
			var logNode = admLiteralNode.buildByName(parentLiteralNode, "log");
			var baseExpression = null;
			var argumentExpression = null;
			
			if(latex[0] === "_")
				latex = latex.substr(1);
			else
				throw new Error("Log is missing base.");
			
			[baseExpression, latex] = findExpression(latex);
			[argumentExpression, latex] = findExpression(latex);
			
			logNode.base.nodes = collectExpression(logNode, baseExpression);
			logNode.argument.nodes = collectExpression(logNode, argumentExpression);
			
			return [logNode, latex];
		}
		
		/*******************************************************************
		 * function:		collectFraction()
		 *
		 * description:	takes a LaTeX string `latex`, which has just had a
		 *							\frac command removed from the start. grab its
		 *							numerator and denominator and build into an
		 *							admLiteralNode, then return that node and the
		 *							remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectFraction(parentLiteralNode, latex) {
			var fractionNode = admLiteralNode.build(parentLiteralNode, "/");
			var numeratorExpression = null;
			var denominatorExpression = null;
			
			[numeratorExpression, latex] = findExpression(latex);
			[denominatorExpression, latex] = findExpression(latex);
			fractionNode.numerator.nodes = collectExpression(fractionNode, numeratorExpression);
			fractionNode.denominator.nodes = collectExpression(fractionNode, denominatorExpression);
			
			return [fractionNode, latex];
		}
		
		/*******************************************************************
		 * function:		collectCommand()
		 *
		 * description:	takes a LaTeX string `latex`, already confirmed to
		 *							start with a '\', and 1) extract the backslash, the
		 *							subsequent LaTeX command and its arguments, 2) store
		 *							them in an admLiteralNode and 3) return the new node
		 *							and the remaining latex
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNode, STRING ]
		 ******************************************************************/
		function collectCommand(parentLiteralNode, latex) {
			var command = "";
			var commandNode = null;
			
			[, command, latex] = /^\\([a-zA-Z]+)(.*)$/.exec(latex);
			
			switch(command) {
				case "leq":				commandNode = admLiteralNode.buildByName(parentLiteralNode, "leq");					break;
				case "geq":				commandNode = admLiteralNode.buildByName(parentLiteralNode, "geq");					break;
				case "times":			commandNode = admLiteralNode.build(parentLiteralNode, "*");									break;
				case "pi":				commandNode = admLiteralNode.buildByName(parentLiteralNode, "pi");					break;
				case "infty":			commandNode = admLiteralNode.buildByName(parentLiteralNode, "infinity");		break;
				case "sin":
				case "cos":
				case "tan":
				case "ln":				[commandNode, latex] = collectFunction(parentLiteralNode, latex, command);	break;
				case "sqrt":			[commandNode, latex] = collectRoot(parentLiteralNode, latex);								break;
				case "log":				[commandNode, latex] = collectLog(parentLiteralNode, latex);								break;
				case "frac":			[commandNode, latex] = collectFraction(parentLiteralNode, latex);						break;
				
				case "Alpha":		commandNode = admLiteralNode.build(parentLiteralNode, "Α");									break;
				case "Beta":		commandNode = admLiteralNode.build(parentLiteralNode, "Β");									break;
				case "Gamma":		commandNode = admLiteralNode.build(parentLiteralNode, "Γ");									break;
				case "Delta":		commandNode = admLiteralNode.build(parentLiteralNode, "Δ");									break;
				case "Epsilon":	commandNode = admLiteralNode.build(parentLiteralNode, "Ε");									break;
				case "Zeta":		commandNode = admLiteralNode.build(parentLiteralNode, "Ζ");									break;
				case "Eta":			commandNode = admLiteralNode.build(parentLiteralNode, "Η");									break;
				case "Theta":		commandNode = admLiteralNode.build(parentLiteralNode, "Θ");									break;
				case "Iota":		commandNode = admLiteralNode.build(parentLiteralNode, "Ι");									break;
				case "Kappa":		commandNode = admLiteralNode.build(parentLiteralNode, "Κ");									break;
				case "Lambda":	commandNode = admLiteralNode.build(parentLiteralNode, "Λ");									break;
				case "Mu":			commandNode = admLiteralNode.build(parentLiteralNode, "Μ");									break;
				case "Nu":			commandNode = admLiteralNode.build(parentLiteralNode, "Ν");									break;
				case "Xi":			commandNode = admLiteralNode.build(parentLiteralNode, "Ξ");									break;
				case "Omicron":	commandNode = admLiteralNode.build(parentLiteralNode, "Ο");									break;
				case "Pi":			commandNode = admLiteralNode.build(parentLiteralNode, "Π");									break;
				case "Rho":			commandNode = admLiteralNode.build(parentLiteralNode, "Ρ");									break;
				case "Sigma":		commandNode = admLiteralNode.build(parentLiteralNode, "Σ");									break;
				case "Tau":			commandNode = admLiteralNode.build(parentLiteralNode, "Τ");									break;
				case "Upsilon":	commandNode = admLiteralNode.build(parentLiteralNode, "Υ");									break;
				case "Phi":			commandNode = admLiteralNode.build(parentLiteralNode, "Φ");									break;
				case "Chi":			commandNode = admLiteralNode.build(parentLiteralNode, "Χ");									break;
				case "Psi":			commandNode = admLiteralNode.build(parentLiteralNode, "Ψ");									break;
				case "Omega":		commandNode = admLiteralNode.build(parentLiteralNode, "Ω");									break;
				case "alpha":		commandNode = admLiteralNode.build(parentLiteralNode, "α");									break;
				case "beta":		commandNode = admLiteralNode.build(parentLiteralNode, "β");									break;
				case "gamma":		commandNode = admLiteralNode.build(parentLiteralNode, "γ");									break;
				case "delta":		commandNode = admLiteralNode.build(parentLiteralNode, "δ");									break;
				case "epsilon":	commandNode = admLiteralNode.build(parentLiteralNode, "ε");									break;
				case "zeta":		commandNode = admLiteralNode.build(parentLiteralNode, "ζ");									break;
				case "eta":			commandNode = admLiteralNode.build(parentLiteralNode, "η");									break;
				case "theta":		commandNode = admLiteralNode.build(parentLiteralNode, "θ");									break;
				case "iota":		commandNode = admLiteralNode.build(parentLiteralNode, "ι");									break;
				case "kappa":		commandNode = admLiteralNode.build(parentLiteralNode, "κ");									break;
				case "lambda":	commandNode = admLiteralNode.build(parentLiteralNode, "λ");									break;
				case "mu":			commandNode = admLiteralNode.build(parentLiteralNode, "μ");									break;
				case "nu":			commandNode = admLiteralNode.build(parentLiteralNode, "ν");									break;
				case "xi":			commandNode = admLiteralNode.build(parentLiteralNode, "ξ");									break;
				case "omicron":	commandNode = admLiteralNode.build(parentLiteralNode, "ο");									break;
				case "pi":			commandNode = admLiteralNode.build(parentLiteralNode, "π");									break;
				case "rho":			commandNode = admLiteralNode.build(parentLiteralNode, "ρ");									break;
				case "sigma":		commandNode = admLiteralNode.build(parentLiteralNode, "σ");									break;
				case "tau":			commandNode = admLiteralNode.build(parentLiteralNode, "τ");									break;
				case "upsilon":	commandNode = admLiteralNode.build(parentLiteralNode, "υ");									break;
				case "phi":			commandNode = admLiteralNode.build(parentLiteralNode, "φ");									break;
				case "chi":			commandNode = admLiteralNode.build(parentLiteralNode, "χ");									break;
				case "psi":			commandNode = admLiteralNode.build(parentLiteralNode, "ψ");									break;
				case "omega":		commandNode = admLiteralNode.build(parentLiteralNode, "ω");									break;
			}
			
			if(commandNode !== null)
				return [commandNode, latex];
			else
				throw new Error("Unrecognised command.");
		}
		
		/*******************************************************************
		 * function:		collectExpression()
		 *
		 * description:	takes a LaTeX string `latex`, which is presumed to be
		 *							an expression (nodelled by an admLiteralExpression),
		 *							convert it into an array of admLiteralNodes and return
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`latex` STRING
		 *
		 * return:			ARRAY [ admLiteralNodes ]
		 ******************************************************************/
		function collectExpression(parentLiteralNode, latex) {
			var literalNodes = [];
			var newNode = null;
			
			while(latex.length > 0) {
				newNode = null;
				latex = /^\s*(.+)$/.exec(latex)[1]; //trim whitespace
				
				if(/^[0-9.a-zA-Z+\-*()\|,='<>]/.test(latex))	{ [newNode, latex] = collectSimple(parentLiteralNode, latex); }
				else if(/^\^/.test(latex))										{ [newNode, latex] = collectExponent(parentLiteralNode, latex); }
				else if(/^\\/.test(latex))										{ [newNode, latex] = collectCommand(parentLiteralNode, latex); }
				
				if(newNode !== null)
					literalNodes.push(newNode);
				else
					throw new Error("Unrecognised sequence in LaTeX string.");
			}
			
			return literalNodes;
		}
		
		return {
			/*******************************************************************
			 * function:		getAdmSemantic()
			 *
			 * description:	converts LaTeX document in `latex` to
			 *							admSemanticNode
			 *
			 * arguments:		`latex` STRING
			 *
			 * return:			admSemanticNode
			 ******************************************************************/
			getAdmSemantic: function(latex) {
				var literalNode = admLiteralNode.buildBlankExpression(null);
				literalNode.nodes = collectExpression(literalNode, latex);
				
				var semanticNode = admLiteralParser.getAdmSemantic(literalNode);

				return semanticNode;
			}
		};
	}]);
})();
