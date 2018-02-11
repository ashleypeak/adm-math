/*******************************************************************
* NOTE: This converter ABSOLUTELY DOES NOT convert all OpenMath or
*				LaTeX. It converts a very small subset. It will convert
*				anything that is output but an admMathInput, but nothing
*				else is guaranteed.
*******************************************************************/

(function() {
	var module = angular.module("admMathConverter", ["admMathLiteral", "admMathSemantic"]);

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

	module.factory("admOpenmathSemanticConverter", ["admXmlParser", "admSemanticNode", function(xmlParser, admSemanticNode) {
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

			var semanticNode = admSemanticNode.build("variable", xmlNode.attributes.name.nodeValue);

			return semanticNode;
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
				case "arith1":	return convertArith1(xmlNode);
				case "transc1":	return convertTransc1(xmlNode);
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
			 * function:		convert()
			 *
			 * description:	converts OpenMath document in `openmath` to
			 *							admSemanticNode
			 *
			 * arguments:		`openmath` STRING
			 *
			 * return:			admSemanticNode
			 ******************************************************************/
			convert: function(openmath) {
				//remove all whitespace between tags
				openmath = openmath.replace(/>\s+</g, "><");

				var openmathDocument = xmlParser.parse(openmath);

				var omobj = openmathDocument.getElementsByTagName("OMOBJ");
				if(omobj.length != 1)	throw new Error("Document must have one OMOBJ root node.");

				return convertNode(omobj[0]);
			}
		};
	}]);
	
	module.factory("admLatexSemanticConverter", ["admLiteralNode", "admLiteralParser", function(admLiteralNode, admLiteralParser) {
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
			
			[, command, latex] = /^\\([a-z]+)(.*)$/.exec(latex);
			
			switch(command) {
				case "times":
					commandNode = admLiteralNode.build(parentLiteralNode, "*");
					break;
				case "pi":
					commandNode = admLiteralNode.buildByName(parentLiteralNode, "pi");
					break;
				case "infty":
					commandNode = admLiteralNode.buildByName(parentLiteralNode, "infinity");
					break;
				case "sin":
				case "cos":
				case "tan":
				case "ln":
					[commandNode, latex] = collectFunction(parentLiteralNode, latex, command);
					break;
				case "sqrt":
					[commandNode, latex] = collectRoot(parentLiteralNode, latex);
					break;
				case "log":
					[commandNode, latex] = collectLog(parentLiteralNode, latex);
					break;
				case "frac":
					[commandNode, latex] = collectFraction(parentLiteralNode, latex);
					break;
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
				
				if(/^[0-9.a-zA-Z+\-*()\|]/.test(latex))	{ [newNode, latex] = collectSimple(parentLiteralNode, latex); }
				else if(/^\^/.test(latex))							{ [newNode, latex] = collectExponent(parentLiteralNode, latex); }
				else if(/^\\/.test(latex))							{ [newNode, latex] = collectCommand(parentLiteralNode, latex); }
				
				if(newNode !== null)
					literalNodes.push(newNode);
				else
					throw new Error("Unrecognised sequence in LaTeX string.");
			}
			
			return literalNodes;
		}
		
		return {
			/*******************************************************************
			 * function:		convert()
			 *
			 * description:	converts LaTeX document in `latex` to
			 *							admSemanticNode
			 *
			 * arguments:		`latex` STRING
			 *
			 * return:			admSemanticNode
			 ******************************************************************/
			convert: function(latex) {
				var literalNode = admLiteralNode.buildBlankExpression(null);
				literalNode.nodes = collectExpression(literalNode, latex);
				
				var literalTreeNodes = literalNode.getNodes();
				
				var semanticNode = admLiteralParser.toSemantic(literalTreeNodes);

				return semanticNode;
			}
		};
	}]);
})();
