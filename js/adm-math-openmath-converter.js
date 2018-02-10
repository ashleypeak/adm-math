(function() {
	var module = angular.module("admMathOpenmathConverter", ["admMathCore"]);

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

	module.factory("admOpenmathLatexConverter", ["admXmlParser", function(xmlParser) {
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

					var index = convertNode(node.childNodes[2]);
					if(!/^[0-9]+$/.test(index))	throw new Error("The root of arith1.root must be an integer.");
					
					if(root == "2")
						return "\\sqrt{"+convertNode(node.childNodes[1])+"}";
					return "\\sqrt["+index+"]{"+convertNode(node.childNodes[1])+"}";
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
					if(node.childNodes.length != 2)	throw new Error("transc1.exp takes one child.");
					return "e^{"+convertNode(node.childNodes[1])+"}";
				case "log":
					if(node.childNodes.length != 3)	throw new Error("transc1.log takes two children.");
					return "\\log_{"+convertNode(node.childNodes[1])+"}("+convertNode(node.childNodes[2])+")";
				case "ln":
					if(node.childNodes.length != 2)	throw new Error("transc1.ln takes one child.");
					return "\\ln("+convertNode(node.childNodes[1])+")";
				case "sin":
					if(node.childNodes.length != 2)	throw new Error("transc1.sin takes one child.");
					return "\\sin("+convertNode(node.childNodes[1])+")";
				case "cos":
					if(node.childNodes.length != 2)	throw new Error("transc1.cos takes one child.");
					return "\\cos("+convertNode(node.childNodes[1])+")";
				case "tan":
					if(node.childNodes.length != 2)	throw new Error("transc1.tan takes one child.");
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
			if(node.childNodes.length !== 0)							throw new Error("Node has incorrect number of children.");
			if(typeof node.attributes.dec == "undefined")	throw new Error("OMF must have attribute `dec`.");

			return node.attributes.dec.nodeValue;
		}

		/*******************************************************************
		 * function:		convertOMV()
		 *
		 * description:	takes an OMV node `node`, converts to LaTeX
		 *							and returns
		 *
		 * arguments:		`node` DOM Element
		 *
		 * return:			STRING
		 ******************************************************************/
		function convertOMF(node) {
			if(node.childNodes.length !== 0)								throw new Error("Node has incorrect number of children.");
			if(typeof node.attributes.name == "undefined")	throw new Error("OMV must have attribute `name`.");

			return node.attributes.name.nodeValue;
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
			if(node.childNodes.length === 0)										throw new Error("OMA requires at least one child.");
			omsNode = node.childNodes[0];
			if(omsNode.nodeName != "OMS")												throw new Error("OMA must have OMS as first child.");
			if(typeof omsNode.attributes.cd == "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof omsNode.attributes.name == "undefined")	throw new Error("OMS must define a name.");

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
			if(typeof node.attributes.cd == "undefined")		throw new Error("OMS must define a content dictionary.");
			if(typeof node.attributes.name == "undefined")	throw new Error("OMS must define a name.");

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
				case "OMV":		return convertOMV(node);
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
})();
