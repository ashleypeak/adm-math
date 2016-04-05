(function() {
	var module = angular.module("admMathBind", ["admMathCore", "admMathOpenmathConverter"]);

	module.run(["$templateCache", function($templateCache) {
		var bindTemplate = "";
		bindTemplate += "<span ng-class=\"{'mathoutput': !isInner}\">";
		bindTemplate += "<span ng-repeat=\"node in expression.nodes track by $index\" ng-switch on=\"node.type\">";

		bindTemplate += "<span ng-switch-when=\"exponent\" class=\"superscript\" adm-literal-bind=\"node.exponent\" adm-is-inner=\"true\"></span>";

		bindTemplate += "<span ng-switch-when=\"division\" class=\"division\">";
		bindTemplate += "<span class=\"numerator\" adm-literal-bind=\"node.numerator\" adm-is-inner=\"true\"></span>";
		bindTemplate += "<span class=\"denominator\" adm-literal-bind=\"node.denominator\" adm-is-inner=\"true\"></span>";
		bindTemplate += "</span>";

		bindTemplate += "<span ng-switch-when=\"squareRoot\" class=\"square-root\" adm-literal-bind=\"node.radicand\" adm-is-inner=\"true\">";
		bindTemplate += "</span>";

		bindTemplate += "<span ng-switch-when=\"function\">";
		bindTemplate += "{{node.getDisplay().start}}";
		bindTemplate += "<span adm-literal-bind=\"node.child\" adm-is-inner=\"true\"></span>";
		bindTemplate += "{{node.getDisplay().end}}";
		bindTemplate += "</span>";

		bindTemplate += "<span ng-switch-when=\"logarithm\">";
		bindTemplate += "log";
		bindTemplate += "<span class=\"subscript\" adm-literal-bind=\"node.base\" adm-is-inner=\"true\"></span>";
		bindTemplate += "(";
		bindTemplate += "<span adm-literal-bind=\"node.argument\" adm-is-inner=\"true\"></span>";
		bindTemplate += ")";
		bindTemplate += "</span>";

		bindTemplate += "<span ng-switch-default ng-bind-html=\"node.getDisplay()\"></span>";

		bindTemplate += "</span>";
		bindTemplate += "</span>";

		$templateCache.put("adm-math-bind.htm", bindTemplate);
	}]);

	module.directive("admLiteralBind", function() {
		return {
			restrict: "A",
			scope: {
				literal: "=admLiteralBind",
				isInner: "=?admIsInner"
			},
			templateUrl: "adm-math-bind.htm",
			link: function(scope, element, attrs) {
				scope.isInner = angular.isDefined(scope.isInner) ? scope.isInner : false;

				scope.$watch("literal", function(literal) {
					try {
						scope.expression = literal;
					} catch(e) {}
				});
			}
		};
	});

	module.directive("admOpenmathBind", ["admOpenmathLiteralConverter", function(admOpenmathLiteralConverter) {
		return {
			restrict: "A",
			scope: {
				openmath: "=admOpenmathBind",
				isInner: "=?admIsInner"
			},
			templateUrl: "adm-math-bind.htm",
			link: function(scope, element, attrs) {
				scope.isInner = angular.isDefined(scope.isInner) ? scope.isInner : false;

				scope.$watch("openmath", function(openmath) {
					try {
						scope.expression = admOpenmathLiteralConverter.convert(openmath);
					} catch(e) {}
				});
			}
		};
	}]);
})();
