# adm-math-input

An Angular.js-based mathematical expression input field

## Installation

To install using bower:

```
bower install https://github.com/wyattpeak/adm-math-input.git
```

## Usage

You'll first have to include the module files:

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
<adm-math-input adm-format="'latex'" adm-name="" adm-value="mathval"></adm-math-input>
```

## Parameters
> **NB** All parameters are interpolated by Angular.js, so strings must be enclosed in quotation marks, e.g.
> `<adm-math-input adm-format="'latex'"></adm-math-input>`


#### adm-format
_Optional_

Type: `String`

Defines output format

Values:
* 'openmath' - _(default)_ Use [OpenMath](http://openmath.org/) format
* 'latex' - Use [LaTeX](https://www.latex-project.org/) math mode format


#### adm-name
_Optional_

Type: `String`

The name of the form element containing output


#### adm-value
_Optional_

Type: `Variable`

A variable bound to the form element output, useful if you want to access the output without submitting the form.
