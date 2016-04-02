# adm-math-input

An Angular.js-based mathematical expression input field

## Installation

To install using bower:

```
bower install https://github.com/wyattpeak/adm-math-input.git
```

## Usage

First include the module files:

```html
<link rel="stylesheet" href="bower_components/adm-math-input/css/adm-math-input.css">
<script type="text/javascript" src="bower_components/adm-math-input/js/adm-math-input.js"></script>
```

Then include the module in your Angular.js module:

```javascript
var myApp = angular.module("myApp", ["admMathInput"]);
```

And wherever you want a math input, add

```html
<adm-math-input></adm-math-input>
```

## Attributes

#### adm-format
_Optional_

Type: `String`

Defines output format.

Values:
* 'openmath' - _(default)_ Use [OpenMath](http://openmath.org/) format
* 'latex' - _(unimplemented)_ Use [LaTeX](https://www.latex-project.org/) math mode format
* 'adm' - _(unimplemented)_ Use [ADM](http://github.com/wyattpeak/adm-math) literal format (suitable only for display, not for storage)

#### adm-name
_Optional_

Type: `String`

The name of the form element containing output.

#### ng-model
_Optional_

Type: `Variable`

A two-way-bound variable containing a representation of the mathematical expression in the format defined by admFormat.

`admFormat='adm'` is the only format which will give a perfect two-way model, the others are approximations, however it is not suitable for storage.
