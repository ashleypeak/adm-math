(function() {
	var module = angular.module("admMathPlot", ["admMathParser"]);

	module.service("admPlotUtils", ["admOpenmathParser", "admLatexParser", function(admOpenmathParser, admLatexParser) {
		/*******************************************************************
		 * function:		parsePoint()
		 *
		 * description:	takes a STRING `point` of form '(x, y)' and returns
		 *							the x and y coordinates of that point, or NULL on
		 *							failure.
		 *
		 * arguments:		`point` STRING
		 *
		 * return:			{x: FLOAT, y: FLOAT} | NULL
		 ******************************************************************/
		this.parsePoint = function(point) {
			var parsedPoint = null;
			
			var matches = point.match(/^\((-?[\d.]+),\s*(-?[\d.]+)\)$/);
			if(matches !== null) {
				parsedPoint = {
					x: parseFloat(matches[1]),
					y: parseFloat(matches[2])
				};
			}
			
			return parsedPoint;
		}
		
		/*******************************************************************
		 * function:		toCanvasPos()
		 *
		 * description:	takes `pos` OBJECT (which is in graph coordinates),
		 *							and converts it to canvas coordinates (in pixels,
		 *							measured from top left.
		 *
		 * arguments:		`pos` OBJECT {x: FLOAT, y: FLOAT}
		 *
		 * return:			{x: INT, y: INT} | NULL
		 ******************************************************************/
		this.toCanvasCoords = function(pos, centre, scale) {
			if(pos === null)
				return null;
			
			var canvasPos = pos;
			canvasPos.x *= scale.x;
			canvasPos.y *= -scale.y;
			
			canvasPos.x += centre.x;
			canvasPos.y += centre.y;
			
			canvasPos.x = Math.round(canvasPos.x);
			canvasPos.y = Math.round(canvasPos.y);
			
			return canvasPos;
		}
		
		/*******************************************************************
		 * function:		parseExpression()
		 *
		 * description:	takes `expression`, converts it from whatever format
		 *							it's in (given by `format`) and returns anchor
		 *							admSemanticNode
		 *
		 * arguments:		`expression` STRING | admSemanticNode
		 *							`format` STRING
		 *
		 * return:			admSemanticNode | NULL
		 ******************************************************************/
		this.parseExpression = function(expression, format) {
			if(typeof expression === "undefined")
				return null;
			
			var expressionParsed = null;
			
			switch(format) {
				case "adm":				expressionParsed = expression;																		break;
				case "openmath":	expressionParsed = admOpenmathParser.getAdmSemantic(expression);	break;
				case "latex":			expressionParsed = admLatexParser.getAdmSemantic(expression);			break;
			}
			
			return expressionParsed;
		}
	}]);
	
	module.directive("admPlot", function() {
		return {
			restrict: "A",
			scope: {
				width: "@",
				height: "@",
				xMin: "@admXMin",
				xMax: "@admXMax",
				yMin: "@admYMin",
				yMax: "@admYMax",
				noGridlines: "@admNoGridlines"
			},
			controller: function($scope, $element, $attrs) {
				var controller = this;

				this.xMin = typeof $scope.xMin !== "undefined" ? parseFloat($scope.xMin) : -10;
				this.xMax = typeof $scope.xMax !== "undefined" ? parseFloat($scope.xMax) : 10;
				this.yMin = typeof $scope.yMin !== "undefined" ? parseFloat($scope.yMin) : -10;
				this.yMax = typeof $scope.xMax !== "undefined" ? parseFloat($scope.yMax) : 10;
				this.noGridlines = typeof $scope.noGridlines !== "undefined" ? $scope.noGridlines : false;

				this.context	= $element[0].getContext('2d');
				this.width		= parseInt($attrs.width);
				this.height		= parseInt($attrs.height);
				this.centre		= {};
				this.range		= {x: this.xMax - this.xMin,
													y: this.yMax - this.yMin};
				this.scale		= {x: this.width / this.range.x,
													y: this.height / this.range.y};
				this.step			= this.range.x / this.width;

				if(this.xMin > 0)				this.centre.x = 0;
				else if(this.xMax < 0)	this.centre.x = this.width;
				else										this.centre.x = this.width * ((0 - this.xMin) / this.range.x);

				if(this.yMin > 0)				this.centre.y = this.height;
				else if(this.yMax < 0)	this.centre.y = 0;
				else										this.centre.y = this.height - (this.height * ((0 - this.yMin) / this.range.y));

				this.drawAxes = function() {
					this.context.strokeStyle = "#b0b0b0";
					this.context.fillStyle = "#000000";
					this.context.lineWidth = 2;
				
					//draw x axis (and grid lines)
					this.context.beginPath();
					this.context.moveTo(0, this.centre.y);
					this.context.lineTo(this.width, this.centre.y);
					this.context.stroke();
				
					if(!this.noGridlines) {
						for(var i = this.xMin; i <= this.xMax; i++) {
							if(i == 0) //don't draw in x=0 if it's on the centre line
								continue;

							if(this.xMax-this.xMin > 10) //if there are more than ten markings
								if((i-this.xMin)%(Math.round((this.xMax-this.xMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.strokeStyle = "#f0f0f0";
							this.context.beginPath();
							this.context.moveTo(this.scale.x*(i-this.xMin), 0);
							this.context.lineTo(this.scale.x*(i-this.xMin), this.height);
							this.context.stroke();
							
							this.context.strokeStyle = "#b0b0b0";
							this.context.beginPath();
							this.context.moveTo(this.scale.x*(i-this.xMin), this.centre.y+7);
							this.context.lineTo(this.scale.x*(i-this.xMin), this.centre.y-7);
							this.context.stroke();
						}
					}
				
					//draw y axis (and grid lines)
					this.context.beginPath();
					this.context.moveTo(this.centre.x, 0);
					this.context.lineTo(this.centre.x, this.height);
					this.context.stroke();
				
					if(!this.noGridlines) {
						for(var i = this.yMin; i <= this.yMax; i++) {
							if(i == 0) //don't draw in y=0 if it's on the centre line
								continue;

							if(this.yMax-this.yMin > 10) //if there are more than ten markings
								if((i-this.yMin)%(Math.round((this.yMax-this.yMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.strokeStyle = "#f0f0f0";
							this.context.beginPath();
							this.context.moveTo(0, this.height - this.scale.y*(i-this.yMin));
							this.context.lineTo(this.width, this.height - this.scale.y*(i-this.yMin));
							this.context.stroke();
							
							this.context.strokeStyle = "#b0b0b0";
							this.context.beginPath();
							this.context.moveTo(this.centre.x+7, this.height - this.scale.y*(i-this.yMin));
							this.context.lineTo(this.centre.x-7, this.height - this.scale.y*(i-this.yMin));
							this.context.stroke();
						}
					}

					//draw labels
					if(!this.noGridlines) {
						for(var i = this.xMin; i <= this.xMax; i++) {
							if(i == 0) //don't draw in x=0 if it's on the centre line
								continue;

							if(this.xMax-this.xMin > 10) //if there are more than ten markings
								if((i-this.xMin)%(Math.round((this.xMax-this.xMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.fillText(Math.round(i*100)/100, this.scale.x*(i-this.xMin)-4, this.centre.y-7-5);
						}

						for(var i = this.yMin; i <= this.yMax; i++) {
							if(i == 0) //don't draw in y=0 if it's on the centre line
								continue;

							if(this.yMax-this.yMin > 10) //if there are more than ten markings
								if((i-this.yMin)%(Math.round((this.yMax-this.yMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.fillText(i, this.centre.x+7+5, this.height-this.scale.y*(i-this.yMin)+4);
						}
					}
				}

				this.drawAxes();
			}
		};
	});
	
	module.directive("admPlotFunction", ["admOpenmathParser", "admLatexParser", "admPlotUtils", function(admOpenmathParser, admLatexParser, admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				rule: "=?admRule",
				format: "@?admFormat",
				colour: "@admColour",
				domainMin: "@admDomainMin",
				domainMax: "@admDomainMax",
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.format)			scope.format = "latex";
				if(!scope.colour)			scope.colour = "#000000";
				if(!scope.domainMin)	scope.domainMin = plotCtrl.xMin;
				if(!scope.domainMax)	scope.domainMax = plotCtrl.xMax;

				scope.domainMin = parseFloat(scope.domainMin);
				scope.domainMax = parseFloat(scope.domainMax);
				
				scope.ruleParsed = admPlotUtils.parseExpression(scope.rule, scope.format);;
				
				function plot() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);		//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(scope.domainMin, scope.ruleParsed.plot(scope.domainMin));
						
						for(var x = scope.domainMin+plotCtrl.step; x <= scope.domainMax; x += plotCtrl.step)
							plotCtrl.context.lineTo(x, scope.ruleParsed.plot(x));
					plotCtrl.context.restore();
					
					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
				
				if(scope.ruleParsed && scope.ruleParsed.type !== "error")
					plot();
			}
		};
	}]);
	
	module.directive("admPlotLabel", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				content: "=?admContent",
				format: "@?admFormat",
				pos: "@admPos",
				textSize: "@admTextSize",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.format)		scope.format = "latex";
				if(!scope.textSize)	scope.textSize = 25;
				if(!scope.colour)		scope.colour = "#000000";
				
				scope.contentParsed = admPlotUtils.parseExpression(scope.content, scope.format);
				scope.pos = admPlotUtils.parsePoint(scope.pos);
				scope.pos = admPlotUtils.toCanvasCoords(scope.pos, plotCtrl.centre, plotCtrl.scale);
				
				var fontFamily = "Arial"
				
				if(scope.contentParsed && scope.contentParsed.type !== "error") {
					plotCtrl.context.strokeStyle = scope.colour;
					
					scope.contentParsed.writeOnCanvas(plotCtrl.context, scope.pos, scope.textSize, fontFamily);
				}
			}
		};
	}]);
})();
