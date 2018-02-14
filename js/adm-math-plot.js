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
				this.noGridlines = typeof $scope.noGridlines !== "undefined";

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
						for(var i = Math.ceil(this.xMin); i <= this.xMax; i++) {
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
						for(var i = Math.ceil(this.yMin); i <= this.yMax; i++) {
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
						for(var i = Math.ceil(this.xMin); i <= this.xMax; i++) {
							if(i == 0) //don't draw in x=0 if it's on the centre line
								continue;

							if(this.xMax-this.xMin > 10) //if there are more than ten markings
								if((i-this.xMin)%(Math.round((this.xMax-this.xMin)/10)) != 0) //if there are thirty markings, only show every third etc.
									continue;

							this.context.fillText(Math.round(i*100)/100, this.scale.x*(i-this.xMin)-4, this.centre.y-7-5);
						}

						for(var i = Math.ceil(this.yMin); i <= this.yMax; i++) {
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
				rule: "@admRule",
				format: "@admFormat",
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
				
				scope.ruleParsed = admPlotUtils.parseExpression(scope.rule, scope.format);
				
				if(scope.ruleParsed && scope.ruleParsed.type !== "error") {
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
				content: "@admContent",
				format: "@admFormat",
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
					plotCtrl.context.fillStyle = scope.colour;
					plotCtrl.context.strokeStyle = scope.colour;
					
					scope.contentParsed.writeOnCanvas(plotCtrl.context, scope.pos, scope.textSize, fontFamily);
				}
			}
		};
	}]);
	
	module.directive("admPlotPoint", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				pos: "@admPos",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				scope.pos = admPlotUtils.parsePoint(scope.pos);
				scope.pos = admPlotUtils.toCanvasCoords(scope.pos, plotCtrl.centre, plotCtrl.scale);
				
				if(scope.pos !== null) {
					plotCtrl.context.fillStyle = scope.colour;
					plotCtrl.context.beginPath();
					plotCtrl.context.arc(scope.pos.x, scope.pos.y, 4, 0, 2 * Math.PI);
					plotCtrl.context.fill();
				}
			}
		};
	}]);
	
	module.directive("admPlotAsymptote", function() {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				xIntercept: "@admXIntercept",
				yIntercept: "@admYIntercept",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				var startPoint, endPoint;
				if(typeof scope.xIntercept !== "undefined") {
					scope.xIntercept = parseFloat(scope.xIntercept);
					
					startPoint = {x: scope.xIntercept, y: plotCtrl.yMin};
					endPoint = {x: scope.xIntercept, y: plotCtrl.yMax};
				} else if(typeof scope.yIntercept !== "undefined") {
					scope.yIntercept = parseFloat(scope.yIntercept);
					
					startPoint = {x: plotCtrl.xMin, y: scope.yIntercept};
					endPoint = {x: plotCtrl.xMax, y: scope.yIntercept};
				} else {
					//expand this at some point to allow arbitrary asymptotes
				}

				plotCtrl.context.save();
					plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
					plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
			
					plotCtrl.context.beginPath();
					
					plotCtrl.context.moveTo(startPoint.x, startPoint.y);
					plotCtrl.context.lineTo(endPoint.x, endPoint.y);
				plotCtrl.context.restore();

				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.lineWidth = 2;
				plotCtrl.context.setLineDash([10, 5]);
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.stroke();
				plotCtrl.context.setLineDash([]);
			}
		};
	});
	
	module.directive("admPlotUnitCircle", function() {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";

				plotCtrl.context.save();
					plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
					plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
			
					plotCtrl.context.beginPath();
					plotCtrl.context.arc(0, 0, 1, 0, 2*Math.PI);
				plotCtrl.context.restore();

				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.lineWidth = 2;
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.stroke();
			}
		};
	});
	
	module.directive("admPlotRadialLine", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				angle: "@admAngle",
				markAngleFrom: "@admMarkAngleFrom",
				angleLabel: "@admAngleLabel", //ignored if markAngleFrom undefined
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				scope.angle = parseFloat(scope.angle)*Math.PI/180;
				
				if(typeof scope.markAngleFrom === "undefined") {
					scope.markAngle = false;
				} else {
					scope.markAngle = true;
					scope.markAngleFrom = parseFloat(scope.markAngleFrom)*Math.PI/180;
					if(!scope.angleLabel) scope.angleLabel = "\u03b8"; //theta
				}

				function plot() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
				
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(0, 0);
						plotCtrl.context.lineTo(Math.cos(scope.angle), Math.sin(scope.angle));
					plotCtrl.context.restore();

					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.stroke();
				}

				function drawAngleMarking() {
						//draw marking
						plotCtrl.context.beginPath();
						plotCtrl.context.arc(plotCtrl.centre.x, plotCtrl.centre.y, 30, Math.min(scope.angle, scope.markAngleFrom), Math.max(scope.angle, scope.markAngleFrom))
						plotCtrl.context.lineWidth = 1;
						plotCtrl.context.stroke();
						
						//draw label
						var averagedAngle = (scope.angle+scope.markAngleFrom)/2;
						var labelPos = 	{
							x: plotCtrl.centre.x + Math.cos(averagedAngle)*45 - plotCtrl.context.measureText(scope.angleLabel).width/2,
							y: plotCtrl.centre.y + Math.sin(averagedAngle)*45 + 5}
						
						plotCtrl.context.fillText(scope.angleLabel, labelPos.x, labelPos.y);
				}
				
				plotCtrl.context.lineJoin = "round";
				plotCtrl.context.strokeStyle = scope.colour;
				plotCtrl.context.fillStyle = scope.colour;
				plotCtrl.context.font = "15px Arial";
				
				plot();
				if(scope.markAngle)
					drawAngleMarking();
			}
		};
	}]);
	
	module.directive("admPlotLine", ["admPlotUtils", function(admPlotUtils) {
		return {
			require: "^admPlot",
			restrict: "E",
			replace: true,
			template: "",
			scope: {
				start: "@admStart",
				end: "@admEnd",
				congruencyMarker: "@admCongruencyMarker",
				colour: "@admColour"
			},
			link: function(scope, element, attrs, plotCtrl) {
				if(!scope.colour) scope.colour = "#000000";
				
				scope.start = admPlotUtils.parsePoint(scope.start);
				scope.end = admPlotUtils.parsePoint(scope.end);
				
				if(typeof scope.congruencyMarker !== "undefined")
					scope.congruencyMarker = parseInt(scope.congruencyMarker);

				function plot() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
				
						plotCtrl.context.beginPath();
						plotCtrl.context.moveTo(scope.start.x, scope.start.y);
						plotCtrl.context.lineTo(scope.end.x, scope.end.y);
					plotCtrl.context.restore();

					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
				
				function dot(v1, v2) {
					return v1[0]*v2[0] + v1[1]*v2[1];
				}
				
				//all of this from definition dot(a,b) - |a||b|cos(theta)
				function angleBetweenVectors(v1, v2) {
					var dotProd = dot(v1, v2);
					
					var v1Magnitude = Math.sqrt(dot(v1, v1));
					var v2Magnitude = Math.sqrt(dot(v2, v2));
					
					return Math.acos(dotProd / (v1Magnitude * v2Magnitude));
				}
				
				function drawCongruencyMarker() {
					plotCtrl.context.save();
						plotCtrl.context.translate(plotCtrl.centre.x, plotCtrl.centre.y);	//move (0,0) to graph centre
						plotCtrl.context.scale(plotCtrl.scale.x, -plotCtrl.scale.y);			//change scale from pixels to graph units, and invert y axis
						
						//the overall aim of this section is to change the coordinate system so that the line
						//has coordinates (-1, 0) at one end and (1, 0) at the other.
						//then we'll draw congruency markers around about (0, 0);
						
						//we're going to map the origin onto the line's midpoint
						var targetPoint = [scope.start.x+(scope.end.x-scope.start.x)/2, scope.start.y+(scope.end.y-scope.start.y)/2];
						
						//we're going to map the vector (1, 0) to scope.end-targetPoint
						var initVector = [1, 0];
						var targetVector = [scope.end.x-targetPoint[0], scope.end.y-targetPoint[1]];
						
						//rotate the coordinate system
						var angle = angleBetweenVectors(initVector, targetVector);
						plotCtrl.context.rotate(angle);
						
						//the targetPoint needs to be updated with each transform so it continues
						//to point to the target in the new, transformed coordinate system
						targetPoint = [Math.cos(-angle)*targetPoint[0]-Math.sin(-angle)*targetPoint[1],
							Math.sin(-angle)*targetPoint[0]+Math.cos(-angle)*targetPoint[1]];
						
						//scale the coordinate system
						var targetVectorMagnitude = Math.sqrt(dot(targetVector, targetVector));
						plotCtrl.context.scale(targetVectorMagnitude, targetVectorMagnitude);
						
						targetPoint = [targetPoint[0]/targetVectorMagnitude, targetPoint[1]/targetVectorMagnitude];
						
						//finally, translate the coordinate system to the targetPoint
						plotCtrl.context.translate(targetPoint[0], targetPoint[1]);
						
						plotCtrl.context.beginPath();
						
						//draw markers at spacings of 0.04;
						var markerDrawPos = (scope.congruencyMarker-1)*-0.02;
						for(var i = 0; i < scope.congruencyMarker; i++) {
							plotCtrl.context.moveTo(markerDrawPos/targetVectorMagnitude, -0.05/targetVectorMagnitude); //line has to be scaled to targetVectorMagnitude so that different
							plotCtrl.context.lineTo(markerDrawPos/targetVectorMagnitude, 0.05/targetVectorMagnitude); // sized lines have the same sized congruency markers
							
							markerDrawPos += 0.04;
						}
					plotCtrl.context.restore();

					plotCtrl.context.lineJoin = "round";
					plotCtrl.context.lineWidth = 2;
					plotCtrl.context.strokeStyle = scope.colour;
					plotCtrl.context.stroke();
				}
				
				plot();
				if(typeof scope.congruencyMarker != "undefined")
					drawCongruencyMarker();
			}
		};
	}]);
})();
