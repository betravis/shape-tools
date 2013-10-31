/**
 * Show Shapes Bookmarklet
 * Copyright (C) 2012
 */
if (!window.showShapesBookmarklet) {
(function() { // begin function scope/invocation

var shapeInsideProperties = [
    'shapeInside',
    'webkitShapeInside'
    /* no other current implementations */
];

var shapeOutsideProperties = [
    'shapeOutside',
    'webkitShapeOutside'
];

var ShapeInfo = function(elem) {
    this.elem = elem;
    this.style = getComputedStyle(elem);

    this.unitsMap = generateUnitsMap();
    this.bounds = generateBounds();
    this.shapeInside = parseShape(this.style.)
}

function propertyGetter(properties) {
    return function() {
        var shapeInfo = this;
        properties.forEach(function(property) {
            if (shapeInfo.style.hasOwnProperty(property))
                return shapeInfo.style[property];
        });
        return undefined;
    }
}

function propertySetter(properties) {
    return function(value) {
        var shapeInfo = this;
        properties.forEach(function(property) {
            if (shapeInfo.style.hasOwnProperty(property))
                return shapeInfo.style[property] = value;
        });
    }
}

ShapeInfo.prototype.getShapeInside = propertyGetter(shapeInsideProperties);
ShapeInfo.prototype.setShapeInside = propertySetter(shapeInsideProperties);
ShapeInfo.prototype.getShapeOutside = propertyGetter(shapeOutsideProperties);
ShapeInfo.prototype.setShapeOutside = propertySetter(shapeOutsideProperties);

ShapeInfo.prototype.generateUnitsMap = function() {
    var units = [
        'em', 'ex', 'ch', 'rem', 'vw', 'vh', 'vmin', 'vmax',
        'cm', 'mm', 'in', 'px', 'pt', 'pc'
    ];
    var div = document.createElement('div');
    this.elem.appendChild(div);
    var style = getComputedStyle(div);
    var result = {};
    units.forEach(function(unit) {
        div.style.fontSize = '1' + unit;
        // computed font size is in px
        result[unit] = parseFloat(style.fontSize);
    });
    this.elem.removeChild(div);
}

ShapeInfo.HORIZONTAL = "horizontal";
ShapeInfo.VERTICAL = "vertical";

ShapeInfo.prototype.toPixels = function(length, direction /* ShapeInfo constant or Number dimension */) {
    if (typeof direction === 'undefined')
        direction = ShapeInfo.HORIZONTAL;
    var percentageBasis;
    if (direction === ShapeInfo.HORIZONTAL)
        percentageBasis = this.bounds.width;
    else if (direction === ShapeInfo.VERTICAL)
        percentageBasis = this.bounds.height;
    else
        percentageBasis = direction;

    var number, unit;
    /* [match, capture1, capture2] */
    var split = /([\-0-9\.]*)([a-z%]*)/.exec(length);
    number = parseFloat(split[1]);
    unit = split[2];
    if (unit === '%')
        return number * percentageBasis;
    return number * this.unitsMap[unit];
}

/* Bounds in viewport coordinates */
ShapeInfo.prototype.generateBounds = function() {
    var shapeRect = elem.getBoundingClientRect();
    var shapeRect = {
        x: shapeRect.left,
        y: shapeRect.top,
        width: shapeRect.width,
        height: shapeRect.height
    }
    
    if (style.boxSizing === 'border-box')
        return shapeRect;

    var borderLeft = this.toPixels(style.borderLeftWidth, elem.width);
    var borderRight = this.toPixels(style.borderRightWidth, elem.width);

    var borderTop = this.toPixels(style.borderTopWidth, elem.height);
    var borderBottom = this.toPixels(style.borderBottomWidth, elem.height);

    shapeRect.x += borderLeft;
    shapeRect.y += borderTop;
    shapeRect.width -= (borderLeft + borderRight);
    shapeRect.height -= (borderTop + borderBottom);
}

ShapeInfo.prototype.parseShape = function(shape) {
    shape = shape.split(/[()]/);

    if (shape.length <= 1)
        return; /* nothing to show here, possible for auto or outside-shape */

    var command = shape[0],
        args = shape[1].split(',');
    args = args.map(function(arg) {
        return arg.trim(0);
    });

    var result;
    switch(command) {
        case 'rectangle':
            result = {
                shape: 'rectangle',
                x: toPixels(args[0], ShapeInfo.HORIZONTAL),
                y: this.toPixels(args[1], ShapeInfo.VERTICAL),
                width: this.toPixels(args[2], ShapeInfo.HORIZONTAL),
                height: this.toPixels(args[3], ShapeInfo.VERTICAL),
                rx: args.length < 5 ? 0 : this.toPixels(args[4], ShapeInfo.HORIZONTAL),
                ry: args.length < 6 ? result.rx : this.toPixels(args[5], ShapeInfo.VERTICAL),
                bounds: shapeViewportBox
            };
            break;
        case 'inset-rectangle':
            result = {
                shape: 'inset-rectangle',
                top: this.toPixels(args[0], ShapeInfo.VERTICAL),
                right: this.toPixels(args[1], ShapeInfo.HORIZONTAL),
                bottom: this.toPixels(args[2], ShapeInfo.VERTICAL),
                left: this.toPixels(args[3], ShapeInfo.HORIZONTAL),
                rx: args.length < 5 ? 0 : this.toPixels(args[4], ShapeInfo.HORIZONTAL),
                ry: args.length < 6 ? result.rx : this.toPixels(args[5], ShapeInfo.VERTICAL),
                bounds: shapeViewportBox
            };
            break;
        case 'circle':
            result = {
                shape: 'circle',
                cx: this.toPixels(args[0], ShapeInfo.HORIZONTAL),
                cy: this.toPixels(args[1], ShapeInfo.VERTICAL),
                r: this.toPixels(args[2], Math.sqrt((ShapeInfo.HORIZONTAL * ShapeInfo.HORIZONTAL + ShapeInfo.VERTICAL * ShapeInfo.VERTICAL) / 2),
                bounds: shapeViewportBox
            };
            break;
        case 'ellipse':
            result = {
                shape: 'ellipse',
                cx: this.toPixels(args[0], ShapeInfo.HORIZONTAL),
                cy: this.toPixels(args[1], ShapeInfo.VERTICAL),
                rx: this.toPixels(args[2], ShapeInfo.HORIZONTAL),
                ry: this.toPixels(args[3], ShapeInfo.VERTICAL),
                bounds: shapeViewportBox
            };
            break;
        case 'polygon':
            result = {
                shape: 'polygon',
                fillRule: (args[0].search(/nonzero|evenodd/i) >= 0) ? args.shift() : 'nonzero',
                points: args.map(function(point) {
                    point = point.split(/\s+/);
                    point[0] = this.toPixels(point[0], ShapeInfo.HORIZONTAL);
                    point[1] = this.toPixels(point[1], ShapeInfo.VERTICAL);
                }),
                bounds: shapeViewportBox
            };
            break;
        case 'url':
            result = {
                shape: 'image',
                url: args[0],
                bounds: shapeViewportBox
            };
            break;
        default:
            result = null;
    }
    return result;
}

function shapeInsideToSVG(shapeInside, elem, style) {

    var unitsMap = unitsToPixelsMap(elem);

    shapeInside = shapeInside.split(/[()]/);
    var command = shapeInside[0], args, result = '';
    if (shapeInside.length > 1)
        args = shapeInside[1].split(/\s*,\s*/);
    switch(command) {
        case 'rectangle':
            var rx = "", ry = "";
            if (args.length > 4) {
                rx = "rx='" + args[4] + "'";
                ry = "ry='" + (args.length > 5 ? args[5] : args[4]) + "'";
            }
            result = format("<rect x='{0}' y='{1}' width='{2}' height='{3}' {4} {5} />", args[0], args[1], args[2], args[3], rx, ry);
            break;
        case 'circle':
            result = format("<circle cx='{0}' cy='{1}' r='{2} />", args[0], args[1], args[2]);
            break;
        case 'ellipse':
            result = format("<ellipse cx='{0}' cy='{1}' rx='{2}' ry='{3}' />", args[0], args[1], args[2], args[3]);
            break;
        case 'polygon':
            var fillRule = (args[0].search(/nonzero|evenodd/i) >= 0 ? args.shift() : "nonzero");
            var points = args.map(function(curr, index, arr) {
                curr = curr.replace(/\s+/, ',');
                curr = curr.replace(/(-?\d+(?:\.\d+)?)(px|%)/g, function($0, $1, $2, offset) {
                    var digit = parseFloat($1);
                    switch ($2) {
                        case '%':
                            digit *= (offset ? elem.offsetHeight : elem.offsetWidth) / 100;
                        case 'px':
                        default:
                    }
                    return digit.toString();
                });
                return curr;
            });
            points = points.join(' ');
            result = format("<polygon fill-rule='{0}' points='{1}' />", fillRule, points);
            break;
        default:
            return null;
    }
    /* eventually need to do font size & fill */
    return "<svg xmlns='http://www.w3.org/2000/svg' style='display:block' width='100%' height='100%'><g fill='blue'>" + result + "</g></svg>";
}
function showShapeInside(elem, style, shape) {
    var svg = shapeInsideToSVG(shape, elem, style);
    if (!svg)
        return;
    if (style.getPropertyValue('position') == 'static')
        elem.style.setProperty('position', 'relative');
    var div = document.createElement('div');
    div.setAttribute('class', 'shape-bookmarklet-overlay');
    div.setAttribute('style', 'width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.5');
    div.innerHTML = svg;
    elem.appendChild(div);
}
function showShapeOutside(elem, style, shape) {
    if (style.getPropertyValue('position') == 'static')
        elem.style.setProperty('position', 'relative');
    elem.style.setProperty('overflow', 'visible');
    shapeOutsideToSVG(shape, elem, style);
}
function showShapes() {
    var elems = document.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var style = getComputedStyle(elem);
        if (!style)
            return;
        var shapeInside = style.getPropertyValue('-webkit-shape-inside');
        if (shapeInside == 'outside-shape')
            shapeInside = style.getPropertyValue('-webkit-shape-outside');
        if (shapeInside != 'auto')
            showShapeInside(elem, style, shapeInside);
        var shapeOutside = style.getPropertyValue('-webkit-shape-outside');
        if (shapeOutside != 'auto')
            showShapeOutside(elem, style, shapeOutside);
    }
}
var shapesOn = false;
function startBookmarklet() {
    showShapes();
    shapesOn = true;
}
function endBookmarklet() {
    var elems = document.getElementsByClassName('shape-bookmarklet-overlay');
    /* elems updates with modifications */
    while (elems.length) {
        var elem = elems[0];
        elem.parentNode.removeChild(elem);
    }
    shapesOn = false;
}
    window.showShapesBookmarklet = function() { shapesOn ? endBookmarklet() : startBookmarklet(); }
    startBookmarklet();
}()

})() // end function scope / invocation   
} // end if(!window.showShapesBookmarklet)
