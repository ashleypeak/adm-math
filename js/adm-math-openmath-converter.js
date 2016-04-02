(function() {
	var mathOpenmathConverter = angular.module("admMathOpenmathConverter", ["admMathCore"]);

	mathOpenmathConverter.factory("admXmlParser", function() {
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

	mathOpenmathConverter.factory("admOpenmathLatexConverter", ["admXmlParser", function(xmlParser) {
		/*******************************************************************
		 * function:		convertArith1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `arith1`
		 *							as node `node`, converts to LaTeX and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertArith1(node) {
			omsNode = node.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "abs":
					if(node.childNodes.length != 2)	throw new Error("arith1.abs takes one child.");
					return "|"+convertNode(node.childNodes[1])+"|";
				case "plus":
					if(node.childNodes.length != 3)	throw new Error("arith1.plus takes two children.");
					return convertNode(node.childNodes[1])+"+"+convertNode(node.childNodes[2]);
				case "minus":
					if(node.childNodes.length != 3)	throw new Error("arith1.minus takes two children.");
					return convertNode(node.childNodes[1])+"-"+convertNode(node.childNodes[2]);
				case "times":
					if(node.childNodes.length != 3)	throw new Error("arith1.times takes two children.");
					return convertNode(node.childNodes[1])+" \\times "+convertNode(node.childNodes[2]);
				case "divide":
					if(node.childNodes.length != 3)	throw new Error("arith1.divide takes two children.");
					return "\\frac{"+convertNode(node.childNodes[1])+"}{"+convertNode(node.childNodes[2])+"}";
				case "power":
					if(node.childNodes.length != 3)	throw new Error("arith1.power takes two children.");
					return convertNode(node.childNodes[1])+"^{"+convertNode(node.childNodes[2])+"}";
				case "root":
					if(node.childNodes.length != 3)	throw new Error("arith1.root takes two children.");

					var root = convertNode(node.childNodes[2]);
					if(!/^[0-9]+$/.test(root))	throw new Error("The root of arith1.root must be an integer.");
					
					if(root == "2")
						return "\\sqrt{"+convertNode(node.childNodes[1])+"}";
					return "\\sqrt["+root+"]{"+convertNode(node.childNodes[1])+"}";
				case "unary_minus":
					if(node.childNodes.length != 2)	throw new Error("arith1.unary_minus takes one child.");
					return "-"+convertNode(node.childNodes[1]);
			}

			throw new Error("OMA references unimplemented symbol arith1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertTransc1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `transc1`
		 *							as node `node`, converts to LaTeX and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertTransc1(node) {
			omsNode = node.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				case "exp":
					if(node.childNodes.length != 2)	throw new Error("arith1.exp takes one child.");
					return "e^{"+convertNode(node.childNodes[1])+"}";
				case "log":
					if(node.childNodes.length != 3)	throw new Error("arith1.log takes two children.");
					return "\\log_{"+convertNode(node.childNodes[1])+"}("+convertNode(node.childNodes[2])+")";
				case "ln":
					if(node.childNodes.length != 2)	throw new Error("arith1.ln takes one child.");
					return "\\ln("+convertNode(node.childNodes[1])+")";
				case "sin":
					if(node.childNodes.length != 2)	throw new Error("arith1.sin takes one child.");
					return "\\sin("+convertNode(node.childNodes[1])+")";
				case "cos":
					if(node.childNodes.length != 2)	throw new Error("arith1.cos takes one child.");
					return "\\cos("+convertNode(node.childNodes[1])+")";
				case "tan":
					if(node.childNodes.length != 2)	throw new Error("arith1.tan takes one child.");
					return "\\tan("+convertNode(node.childNodes[1])+")";
			}

			throw new Error("OMA references unimplemented symbol transc1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNums1()
		 *
		 * description:	takes an OMS in content dictionary `nums1`
		 *							as node `node`, converts to LaTeX and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertNums1(node) {
			switch(node.attributes.name.nodeValue) {
				case "e":
					return "e";
				case "pi":
					return "\\pi";
				case "infinity":
					return "\\infty";
			}

			throw new Error("OMA references unimplemented symbol nums1."+node.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMOBJ()
		 *
		 * description:	takes an OMOBJ node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMOBJ(node) {
			if(node.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			return convertNode(node.childNodes[0]);
		}

		/*******************************************************************
		 * function:		convertOMI()
		 *
		 * description:	takes an OMI node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMI(node) {
			if(node.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			//childNodes[0] is the text node i.e. the tag value
			return node.childNodes[0].nodeValue;
		}

		/*******************************************************************
		 * function:		convertOMF()
		 *
		 * description:	takes an OMF node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMF(node) {
			if(node.childNodes.length != 0)									throw new Error("Node has incorrect number of children.");
			if(typeof node.attributes.dec === "undefined")	throw new Error("OMF must have attribute `dec`.");

			return node.attributes.dec.nodeValue;
		}

		/*******************************************************************
		 * function:		convertOMA()
		 *
		 * description:	takes an OMA node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMA(node) {
			if(node.childNodes.length == 0)											throw new Error("OMA requires at least one child.");
			omsNode = node.childNodes[0];
			if(omsNode.nodeName !== "OMS")											throw new Error("OMA must have OMS as first child.");
			if(typeof omsNode.attributes.cd === "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof omsNode.attributes.name === "undefined")	throw new Error("OMS must define a name.");

			switch(omsNode.attributes.cd.nodeValue) {
				case "arith1":	return convertArith1(node);
				case "transc1":	return convertTransc1(node);
			}

			throw new Error("OMA references unimplemented content dictionary: "+omsNode.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMS()
		 *
		 * description:	takes an OMS node `node` (that isn't being used to
		 *							define an OMA), converts to LaTeX and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMS(node) {
			if(typeof node.attributes.cd === "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof node.attributes.name === "undefined")	throw new Error("OMS must define a name.");

			switch(node.attributes.cd.nodeValue) {
				case "nums1":	return convertNums1(node);
			}

			throw new Error("OMS references unimplemented content dictionary: "+node.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNode()
		 *
		 * description:	takes any OpenMath node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertNode(node) {
			switch(node.nodeName) {
				case "OMOBJ":	return convertOMOBJ(node);
				case "OMI":		return convertOMI(node);
				case "OMF":		return convertOMF(node);
				case "OMA":		return convertOMA(node);
				case "OMS":		return convertOMS(node);
			}

			throw new Error("Unknown node type: "+node.nodeName);
		}

		return {
			/*******************************************************************
			 * function:		convert()
			 *
			 * description:	converts OpenMath document in `openmath` to LaTeX,
			 *							and returns
			 *
			 * arguments:		`openmath` STRING
			 *
			 * return:			STRING
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

	mathOpenmathConverter.factory("admOpenmathLiteralConverter", ["admXmlParser", "admLiteralNode", function(xmlParser, admLiteralNode) {
		/*******************************************************************
		 * function:		convertArith1()
		 *
		 * description:	takes an OMA with OMS in content dictionary `arith1`
		 *							as node `xmlNode`, converts to an array of
		 *							admLiteralNodes and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertArith1(parentLiteralNode, xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				/*case "abs":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.abs takes one child.");
					return "|"+convertNode(xmlNode.childNodes[1])+"|";*/
				case "plus":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.plus takes two children.");

					var symbolNode = admLiteralNode.build(parentLiteralNode, "+");

					var childLiteralNodes = [
						convertNode(parentLiteralNode, xmlNode.childNodes[1]),
						convertNode(parentLiteralNode, xmlNode.childNodes[2])
					];

					return childLiteralNodes[0].concat(symbolNode).concat(childLiteralNodes[1]);
				case "minus":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.minus takes two children.");

					var symbolNode = admLiteralNode.build(parentLiteralNode, "-");

					var childLiteralNodes = [
						convertNode(parentLiteralNode, xmlNode.childNodes[1]),
						convertNode(parentLiteralNode, xmlNode.childNodes[2])
					];

					return childLiteralNodes[0].concat(symbolNode).concat(childLiteralNodes[1]);
				case "times":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.times takes two children.");

					var symbolNode = admLiteralNode.build(parentLiteralNode, "*");

					var childLiteralNodes = [
						convertNode(parentLiteralNode, xmlNode.childNodes[1]),
						convertNode(parentLiteralNode, xmlNode.childNodes[2])
					];

					return childLiteralNodes[0].concat(symbolNode).concat(childLiteralNodes[1]);
				case "divide":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.divide takes two children.");

					var divisionNode = admLiteralNode.build(parentLiteralNode, "/");

					divisionNode.numerator.nodes = convertNode(divisionNode.numerator, xmlNode.childNodes[1]);
					divisionNode.denominator.nodes = convertNode(divisionNode.denominator, xmlNode.childNodes[2]);

					return [divisionNode];
				case "power":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.power takes two children.");

					var baseLiteralNodes = convertNode(parentLiteralNode, xmlNode.childNodes[1]);
					var exponentNode = admLiteralNode.build(parentLiteralNode, "^");

					exponentNode.exponent.nodes = convertNode(exponentNode.exponent, xmlNode.childNodes[2]);

					return baseLiteralNodes.concat(exponentNode);
				/*case "root":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.root takes two children.");

					var root = convertNode(xmlNode.childNodes[2]);
					if(!/^[0-9]+$/.test(root))	throw new Error("The root of arith1.root must be an integer.");
					
					if(root == "2")
						return "\\sqrt{"+convertNode(xmlNode.childNodes[1])+"}";
					return "\\sqrt["+root+"]{"+convertNode(xmlNode.childNodes[1])+"}";*/
				/*case "unary_minus":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.unary_minus takes one child.");
					return "-"+convertNode(xmlNode.childNodes[1]);*/
			}

			throw new Error("OMA references unimplemented symbol arith1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertTransc1() UNIMPLEMENTED
		 *
		 * description:	takes an OMA with OMS in content dictionary `transc1`
		 *							as node `xmlNode`, converts to an array of
		 *							admLiteralNodes and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertTransc1(parentLiteralNode, xmlNode) {
			omsNode = xmlNode.childNodes[0];

			switch(omsNode.attributes.name.nodeValue) {
				/*case "exp":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.exp takes one child.");
					return "e^{"+convertNode(xmlNode.childNodes[1])+"}";
				case "log":
					if(xmlNode.childNodes.length != 3)	throw new Error("arith1.log takes two children.");
					return "\\log_{"+convertNode(xmlNode.childNodes[1])+"}("+convertNode(xmlNode.childNodes[2])+")";
				case "ln":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.ln takes one child.");
					return "\\ln("+convertNode(xmlNode.childNodes[1])+")";
				case "sin":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.sin takes one child.");
					return "\\sin("+convertNode(xmlNode.childNodes[1])+")";
				case "cos":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.cos takes one child.");
					return "\\cos("+convertNode(xmlNode.childNodes[1])+")";
				case "tan":
					if(xmlNode.childNodes.length != 2)	throw new Error("arith1.tan takes one child.");
					return "\\tan("+convertNode(xmlNode.childNodes[1])+")";*/
			}

			throw new Error("OMA references unimplemented symbol transc1."+omsNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNums1() UNIMPLEMENTED
		 *
		 * description:	takes an OMS in content dictionary `nums1` as node
		 *							node `xmlNode`, converts to an array of
		 *							admLiteralNodes and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertNums1(parentLiteralNode, xmlNode) {
			switch(xmlNode.attributes.name.nodeValue) {
				/*case "e":
					return "e";
				case "pi":
					return "\\pi";
				case "infinity":
					return "\\infty";*/
			}

			throw new Error("OMA references unimplemented symbol nums."+xmlNode.attributes.name.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMOBJ()
		 *
		 * description:	takes an OMOBJ node `xmlNode`, converts to an
		 *							admLiteralNode and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			admLiteralNode
		 ******************************************************************/
		function convertOMOBJ(parentLiteralNode, xmlNode) {
			if(xmlNode.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			var literalNode = admLiteralNode.buildBlankExpression(parentLiteralNode);
			literalNode.nodes = convertNode(literalNode, xmlNode.childNodes[0]);

			return literalNode;
		}

		/*******************************************************************
		 * function:		convertOMI()
		 *
		 * description:	takes an OMI node `xmlNode`, converts to an
		 *							array of admLiteralNode and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertOMI(parentLiteralNode, xmlNode) {
			if(xmlNode.childNodes.length != 1)	throw new Error("Node has incorrect number of children.");

			//childNodes[0] is the text node i.e. the tag value
			var chars = xmlNode.childNodes[0].nodeValue;
			var literalNodes = [];

			angular.forEach(chars, function(c) {
				var node = admLiteralNode.build(parentLiteralNode, c);

				literalNodes.push(node);
			});

			return literalNodes;
		}

		/*******************************************************************
		 * function:		convertOMF()
		 *
		 * description:	takes an OMF node `xmlNode`, converts to an
		 *							array of admLiteralNode and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertOMF(parentLiteralNode, xmlNode) {
			if(xmlNode.childNodes.length != 0)								throw new Error("Node has incorrect number of children.");
			if(typeof xmlNode.attributes.dec === "undefined")	throw new Error("OMF must have attribute `dec`.");

			var chars = xmlNode.attributes.dec.nodeValue;
			var literalNodes = [];

			angular.forEach(chars, function(c) {
				var node = admLiteralNode.build(parentLiteralNode, c);

				literalNodes.push(node);
			});

			return literalNodes;
		}

		/*******************************************************************
		 * function:		convertOMA()
		 *
		 * description:	takes an OMF node `xmlNode`, converts to an
		 *							array of admLiteralNodes and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertOMA(parentLiteralNode, xmlNode) {
			if(xmlNode.childNodes.length == 0)											throw new Error("OMA requires at least one child.");

			omsNode = xmlNode.childNodes[0];
			if(omsNode.nodeName !== "OMS")											throw new Error("OMA must have OMS as first child.");
			if(typeof omsNode.attributes.cd === "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof omsNode.attributes.name === "undefined")	throw new Error("OMS must define a name.");

			switch(omsNode.attributes.cd.nodeValue) {
				case "arith1":	return convertArith1(parentLiteralNode, xmlNode);
				case "transc1":	return convertTransc1(parentLiteralNode, xmlNode);
			}

			throw new Error("OMA references unimplemented content dictionary: "+omsNode.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertOMS()
		 *
		 * description:	takes an OMS node `xmlNode` (that isn't being use to
		 *							define an OMA),  converts to an array of
		 *							admLiteralNodes and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			[admLiteralNode]
		 ******************************************************************/
		function convertOMS(parentLiteralNode, xmlNode) {
			if(typeof xmlNode.attributes.cd === "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof xmlNode.attributes.name === "undefined")	throw new Error("OMS must define a name.");

			switch(xmlNode.attributes.cd.nodeValue) {
				case "nums1":	return convertNums1(parentLiteralNode, xmlNode);
			}

			throw new Error("OMS references unimplemented content dictionary: "+xmlNode.attributes.cd.nodeValue);
		}

		/*******************************************************************
		 * function:		convertNode()
		 *
		 * description:	takes any OpenMath node `xmlNode`, converts to an
		 *							admLiteralNode (if nodeName=='OMOBJ') or an array
		 *							thereof (otherwise) and returns
		 *
		 * arguments:		`parentLiteralNode` admLiteralNode
		 *							`xmlNode` DOM Element
		 *
		 * return:			admLiteralNode | [admLiteralNode]
		 ******************************************************************/
		function convertNode(parentLiteralNode, xmlNode) {
			switch(xmlNode.nodeName) {
				case "OMOBJ":	return convertOMOBJ(parentLiteralNode, xmlNode);
				case "OMI":		return convertOMI(parentLiteralNode, xmlNode);
				case "OMF":		return convertOMF(parentLiteralNode, xmlNode);
				case "OMA":		return convertOMA(parentLiteralNode, xmlNode);
				case "OMS":		return convertOMS(parentLiteralNode, xmlNode);
			}

			throw new Error("Unknown node type: "+xmlNode.nodeName);
		}

		return {
			/*******************************************************************
			 * function:		convert()
			 *
			 * description:	converts OpenMath document in `openmath` to LaTeX,
			 *							and returns
			 *
			 * arguments:		`openmath` STRING
			 *
			 * return:			STRING
			 ******************************************************************/
			convert: function(openmath) {
				//remove all whitespace between tags
				openmath = openmath.replace(/>\s+</g, "><");

				var openmathDocument = xmlParser.parse(openmath);

				var omobj = openmathDocument.getElementsByTagName("OMOBJ");
				if(omobj.length != 1)	throw new Error("Document must have one OMOBJ root node.");

				return convertNode(null, omobj[0]);
			}
		};
	}]);
})();
