# adm-math

An Angular.js library for manipulating mathematical expressions

## Installation

To install using bower:

```
bower install https://github.com/wyattpeak/adm-math.git
```

## Components


### adm-math-input

A mathematical expression input field

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="bower_components/adm-math/css/adm-math.css">
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
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
* 'latex' - _(unimplemented)_ Use [LaTeX](https://www.latex-project.org/) math mode format
* 'adm' - _(unimplemented)_ Use [ADM](http://github.com/wyattpeak/adm-math) literal format (suitable only for display, not for storage)

##### adm-name
_Optional_

Type: `String`

The name of the form element containing output.

##### ng-model
_Optional_

Type: `Variable`

A two-way-bound variable containing a representation of the mathematical expression in the format defined by admFormat.

`admFormat='adm'` is the only format which will give a perfect two-way model, the others are approximations, however it is not suitable for storage.

---

### adm-math-bind

A binding to display OpenMath and ADM formatted equations

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="bower_components/adm-math/css/adm-math.css">
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
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
<script type="text/javascript" src="bower_components/adm-math/js/adm-math-core.js"></script>
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
