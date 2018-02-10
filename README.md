# adm-math

An Angular.js library for manipulating mathematical expressions

## Installation

To install using bower:

```
$ bower install https://github.com/wyattpeak/adm-math.git
```

## Components


### adm-math-input

A mathematical expression input field

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="bower_components/adm-math/css/adm-math.css">
<script type="text/javascript" src="bower_components/angular/angular.js"></script>
<script type="text/javascript" src="bower_components/angular-sanitize/angular-sanitize.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-literal-converter.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-openmath-converter.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-input.js"></script>
```

Then include the module in your Angular.js module:

```javascript
var myApp = angular.module("myApp", ["admMathInput"]);
```

And wherever you want a math input, add

```html
<adm-math-input></adm-math-input>
```

#### Attributes

##### adm-format
_Optional_

Type: `String`

Defines output format.

Values:
* 'openmath' - _(default)_ Use [OpenMath](http://openmath.org/) format
* 'latex' - Use [LaTeX](https://www.latex-project.org/) math mode format
* 'adm' - Use [ADM](http://github.com/wyattpeak/adm-math) admSemanticNode format (verbose object literal, not for storage)

##### name
_Optional_

Type: `String`

The name of the form element containing output.

##### ng-model
_Optional_

Type: `Variable`

A two-way-bound variable containing a representation of the mathematical expression in the format defined by admFormat.

Guarantees semantic equivalence but not literal equivalence to input (e.g. may render '(1)(2)' as '1*2').

##### ng-model-adm
_Optional_

Type: `Variable`

A read-only variable containing an admSemanticNode representation of the mathematical expression.

##### ng-model-openmath
_Optional_

Type: `Variable`

A read-only variable containing an OpenMath representation of the mathematical expression.

##### ng-model-latex
_Optional_

Type: `Variable`

A read-only variable containing a LaTeX representation of the mathematical expression.

##### adm-focus
_Optional_

Type: `Function`

A function (local to the scope of the parent controller) which is to be called the the input field gains focus.

##### adm-blur
_Optional_

Type: `Function`

A function (local to the scope of the parent controller) which is to be called the the input field loses focus.

##### adm-hook
_Optional_

Type: `Variable`

A label used by and `admInputControl` to programmatically insert characters.
For example, the following button would insert the character &pi; into an `admInputField` with `admHook="field1"`

```html
<button adm-input-control adm-target="field1" adm-symbol="pi">&pi;</button>
```

A full list of supported values for `adm-symbol` follows:
* `plus` A plus symbol
* `minus` A minus symbol
* `times` A times symbol
* `divide` An empty fraction
* `squareRoot` An empty square root
* `pi` The symbol &pi;
* `e` The constant e
* `infinity` The symbol &infin;
* `sin` The function sin()
* `cos` The function cos()
* `tan` The function tan()
* `ln` A natural logarithm
* `absolute` An empty absolute function | |
* `log10` A base-10 logarithm
* `log` A logarithm with an empty base
* `power` An exponent field
* `exponent` The constant e raised to an empty exponent field
* `root` An empty root with an empty field for an index
* `/^[0-9.a-zA-Z+\-*()\^\/\|]$/` The result that a similar keypress would give

---

### adm-math-bind

A binding to display OpenMath and ADM formatted equations

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="bower_components/adm-math/css/adm-math.css">
<script type="text/javascript" src="bower_components/angular/angular.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-literal-converter.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-openmath-converter.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-bind.js"></script>
```

Then include the module in your Angular.js module:

```javascript
var myApp = angular.module("myApp", ["admMathBind"]);
```

In order to display math, just add one of the two binding attributes to any HTML element

```html
<span adm-openmath-bind="openmathVar"></span>
```

#### Attributes

##### adm-openmath-bind
Type: `Variable`

Bind an openmath string for display

##### adm-literal-bind
Type: `Variable`

Bind an ADM literal equation representation for display

---

### adm-math-openmath-converter

A set of services for converting OpenMath into other formats

#### Usage

First include the module files:

```html
<script type="text/javascript" src="bower_components/angular/angular.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-literal-converter.js"></script>
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-openmath-converter.js"></script>
```

Then include the module in your Angular.js module:

```javascript
var myApp = angular.module("myApp", ["admMathOpenmathConverter"]);
```

In order to convert OpenMath to another format, just use one of the services below's `convert()` function:

```javascript
var latex = admOpenmathLatexConverter.convert(openmath);
```

#### Services

##### admOpenmathLatexConverter
Convert an OpenMath string to LaTeX

##### admOpenmathLiteralConverter
Convert an OpenMath string to an ADM literal object
