# adm-math

An AngularJS library for manipulating mathematical expressions

## Installation

To install using [yarn](https://yarnpkg.com/):

```
$ yarn add adm-math
```

## Components


### adm-math-input

A mathematical expression input field

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="node_modules/adm-math/css/adm-math.css">
<script type="text/javascript" src="node_modules/angular/angular.js"></script>
<script type="text/javascript" src="node_modules/angular-sanitize/angular-sanitize.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-literal.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-semantic.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-parser.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-input.js"></script>
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

| Attribute     | Description                                                                                            | Type   | Required | Default   |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------ | -------- | --------- |
| admFormat     | defines output format - accepts "[openmath](http://openmath.org/)", "[latex](https://www.latex-project.org/)" and "[adm](http://github.com/wyattpeak/adm-math)" | STRING | no | "openmath" |
| name          | the name of the form element containing output                                                         | STRING | no       | ""     |
| ngModel       | a two-way-bound variable containing the mathematical expression in the format defined by `admFormat`   | VAR    | no       |        |
| admModelAdm   | a read-only variable containing an admSemanticNode representation of the mathematical expression       | VAR    | no       |        |
| admModelOm    | a read-only variable containing an OpenMath representation of the mathematical expression              | VAR    | no       |        |
| admModelLatex | a read-only variable containing an LaTeX representation of the mathematical expression                 | VAR    | no       |        |
| admFunctions  | an array (see format below) which will be parsed as functions rather than variables                    | STRING | no       | ""     |
| admFocus      | a function (local to parent controller scope) which is called the the input field gains focus          | VAR    | no       |        |
| admBlur       | a function (local to parent controller scope) which is called the the input field loses focus          | VAR    | no       |        |
| admHook       | a label used by and `admInputControl` to programmatically insert characters                            | VAR    | no       |        |

**Note:** Using the format "adm" gives you an admSemanticNode object (verbose object literal, not for storage)

**Note:** The format for `admFunctions` is `[f,g,df,...]` - using this will interpret e.g. "f(x)" as a function, not as "f*x"

##### admHook usage

The following button would insert the character &pi; into an `admMathInput` with `admHook="field1"`

```html
<button adm-input-control adm-target="field1" adm-symbol="pi">&pi;</button>
```

A full list of supported values for `adm-symbol` follows:

| Type          | Symbols                                      |
| ------------- | -------------------------------------------- |
| circular      | `sin` `cos` `tan` `arcsin` `arccos` `arctan` |
| exponential   | `exponent` `ln` `log` `log10`                |
| relations     | `leq` (≤) `geq` (≥)                          |
| constants     | `e` `pi` `infinity`                          |
| miscellaneous | `absolute` `power` `root` `squareRoot`       |
| other symbols | `/^[0-9.a-zA-ZΑ-Ωα-ω+\-*()\^\/\|,='<>~]$/`   |

**Note:** You can make a division button using  `adm-symbol="/"`.

**Note:** When tying primes `a'`, due to the apparent lack of a standard format for primes in OpenMath, it will be stored as `<OMV name='a_prime1'/>`.

**Note:** Typing ~ is stored in OpenMath as the nonexistent symbol `relation1.sim`. To be fixed.

---
### adm-math-plot

A canvas-based plotting tool

#### Usage

First include the module files:

```html
<link rel="stylesheet" href="node_modules/adm-math/css/adm-math.css">
<script type="text/javascript" src="node_modules/angular/angular.js"></script>
<script type="text/javascript" src="node_modules/angular-sanitize/angular-sanitize.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-literal.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-semantic.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-parser.js"></script>
<script type="text/javascript" src="node_modules/adm-math/js/adm-math-plot.js"></script>
```

Then include the module in your Angular.js module:

```javascript
var myApp = angular.module("myApp", ["admMathPlot"]);
```

And wherever you want a plot, add

```html
<canvas adm-plot></canvas>
```

#### Attributes

| Attribute      | Description             | Type         | Required | Default |
| -------------- | ----------------------- | ------------ | -------- | ------- |
| width          | width of canvas         | INT          | yes      |         |
| height         | height of canvas        | INT          | yes      |         |
| admXMin        | leftmost x value        | FLOAT        | no       | -10     |
| admXMax        | rightmost x value       | FLOAT        | no       | 10      |
| admYMin        | bottommost y value      | FLOAT        | no       | -10     |
| admYMax        | topmost y value         | FLOAT        | no       | 10      |
| admNoGridlines | don't plot axes or grid | BOOLEAN      | no       | false   |

#### Subdirectives

These element-level directives go inside your `adm-plot`, and can be used to plot different things:

##### adm-plot-function

Plot a function described by expression in `admRule`.

| Attribute      | Description                                                | Type         | Required | Default             |
| -------------- | ---------------------------------------------------------- | ------------ | -------- | ------------------- |
| admRule        | a description, of format `admFormat`, of the curve to plot | STRING       | yes      |                     |
| admFormat      | format of `admRule`, can be "latex" or "openmath"          | STRING       | no       | "latex"             |
| admColour      | colour of the curve                                        | STRING       | no       | "#000000"           |
| admDomainMin   | the minimum value of the domain                            | FLOAT        | no       | admMathPlot.admXMin |
| admDomainMax   | the maximum value of the domain                            | FLOAT        | no       | admMathPlot.admXMax |

##### adm-plot-label

Write the expression stored in `admContent` on the canvas.

| Attribute      | Description                                                                         | Type                    | Required | Default   |
| -------------- | ----------------------------------------------------------------------------------- | ----------------------- | -------- | --------- |
| admContent     | the expression, of format `admFormat`, to be written on the canvas                  | STRING                  | yes      |           |
| admPos         | the position to write at, in the form "(x,y)" (in graph coordinates)                | STRING "(FLOAT, FLOAT)" | yes      |           |
| admFormat      | format of `admContent`, can be "latex" or "openmath"                                | STRING                  | no       | "latex"   |
| admFunctions   | an array (see format below) which will be parsed as functions rather than variables | STRING                  | no       | ""        |
| admTextSize	   | the size of the text, in pixels                                                     | INT                     | no       | 25        |
| admColour      | the colour of the text                                                              | STRING                  | no       | "#000000" |

**Note:** The format for `admFunctions` is `[f,g,df,...]` - using this will print e.g. "f(x)" as "f(x)", not as "f*x"

##### adm-plot-point

Mark a point at position `adm-pos`.

| Attribute      | Description                                                          | Type                    | Required | Default             |
| -------------- | -------------------------------------------------------------------- | ----------------------- | -------- | ------------------- |
| admPos         | the position to write at, in the form "(x,y)" (in graph coordinates) | STRING "(FLOAT, FLOAT)" | yes      |                     |
| admColour      | the colour of the point                                              | STRING                  | no       | "#000000"           |

##### adm-plot-asymptote

Draw an (vertical or horizontal) asymptote passing through either (`admXIntercept`, 0) or (0, `admYIntercept`).

| Attribute      | Description                                              | Type                | Required | Default             |
| -------------- | -------------------------------------------------------- | ------------------- | -------- | ------------------- |
| admXIntercept  | the x intercept of the, if defined, vertical asymptote   | FLOAT               | no       |                     |
| admYIntercept	 | the y intercept of the, if defined, horizontal asymptote | FLOAT               | no       |                     |
| admColour      | the colour of the asymptote                              | STRING              | no       | "#000000"           |

**Note:** One and only one of `admXIntercept` and `admYIntercept` must be defined.

##### adm-plot-unit-circle

Draw a circle of radius 1 at (0, 0) (in graph coordinates).

| Attribute      | Description                                                          | Type                    | Required | Default             |
| -------------- | -------------------------------------------------------------------- | ----------------------- | -------- | ------------------- |
| admColour      | the colour of the circle                                             | STRING                  | no       | "#000000"           |

##### adm-plot-radial-line

Draw a line out from (0, 0) (in graph coordinates) of length 1 at angle `admAngle` from the positive x direction.

Designed for use in conjunction with `adm-plot-unit-circle`.

| Attribute        | Description                                                                    | Type                | Required | Default             |
| ---------------- | ------------------------------------------------------------------------------ | ------------------- | -------- | ------------------- |
| admAngle         | the angle (in radians), from the positive x direction, of the line             | FLOAT               | yes      |                     |
| admMarkAngleFrom | the angle (in radians), from which the angle of the radial line will be marked | FLOAT               | no       |                     |
| admLabel	       | the label with which the angle will be marked                                  | STRING              | no       | θ                   |
| admColour        | the colour of the line                                                         | STRING              | no       | "#000000"           |

**Note:** The angle of the line will only be marked if `admMarkAngleFrom` is set.

##### adm-plot-line

Draw a line from `admStart` to `admEnd`.

Designed for use in conjunction with `adm-plot-unit-circle`.

| Attribute           | Description                                                                         | Type                    | Required | Default   |
| ------------------- | ----------------------------------------------------------------------------------- | ----------------------- | -------- | --------- |
| admStart            | one end of the line, in the form "(x,y)" (in graph coordinates)                     | STRING "(FLOAT, FLOAT)" | yes      |           |
| admStart            | the other end of the line, in the form "(x,y)" (in graph coordinates)               | STRING "(FLOAT, FLOAT)" | yes      |           |
| admCongruencyMarker | the number of strokes in the congruency marker, showing lines of equivanlent length | INT                     | no       |           |
| admColour           | the colour of the line                                                              | STRING                  | no       | "#000000" |

**Note:** No congruency marker will be drawn if `admCongruencyMarker` is left blank.

##### adm-plot-fill

Fill the space bordered by the child `adm-plot-fill-border`s.

| Attribute   | Description                                                                         | Type                    | Required | Default   |
| ----------- | ----------------------------------------------------------------------------------- | ----------------------- | -------- | --------- |
| admBorders  | the number of child `adm-plot-fill-border`s                                         | INT                     | yes      |           |
| admFormat   | format of child `adm-plot-fill-border`s' `admRule`s, can be "latex" or "openmath"   | STRING                  | no       | "latex"   |
| admColour   | the colour of the filled region                                                     | STRING                  | no       | "#bce8f1" |
| admOpacity  | the opacity of the filled region                                                    | FLOAT                     | no       | 0.7       |

##### adm-plot-fill-border

One of the borders of parent `adm-plot-fill`.

| Attribute  | Description                                                                         | Type                    | Required | Default   |
| ---------- | ----------------------------------------------------------------------------------- | ----------------------- | -------- | --------- |
| admOrder   | 1-indexed order in which these borders will be drawn (see note)                     | INT                     | yes      |           |
| admRule    | a description, of format `^adm-plot-fill`.`admFormat`, of the curve of the border   | STRING                  | no       | "latex"   |
| admStart   | the starting x value of the border (see note)                                       | STRING                  | no       | "#d9edf7" |
| admEnd     | the starting x value of the border (see note)                                       | INT                     | no       | 0.7       |

**Note:** Following these, in `admOrder` order, from `admStart` to `admEnd`, must form a contiguous line. Thus sometimes `admStart` will be to the right of `admEnd`. _`admStart` cannot just be the leftpost point._

##### adm-plot-normal

Draw a normal curve of mean `admMean` and standard deviation `admStdDev`, filled between `admMin` and `admMax` to show some proportion of the curve.

| Attribute      | Description                                     | Type      | Required | Default             |
| -------------- | ----------------------------------------------- | --------- | -------- | ------------------- |
| admMean        | the mean of the distribution                    | FLOAT     | no       | 0                   |
| admStdDev      | the standard deviation of the distribution      | FLOAT     | no       | 1                   |
| admMin         | the leftmost x value end of the filled section  | FLOAT     | no       | admMathPlot.admXMin |
| admMax         | the rightmost x value end of the filled section | FLOAT     | no       | admMathPlot.admXMax |
| admCurveColour | the colour of the curve                         | STRING    | no       | "#31708f"           |
| admFillColour  | the colour of the filled region                 | STRING    | no       | "#d9edf7"           |
| admOpacity     | the opacity of the filled region                | FLOAT     | no       | 0.7                 |
