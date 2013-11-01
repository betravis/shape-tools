/**
 * Show Shapes Bookmarklet
 * Copyright (C) 2012
 */
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

function ShapeInfo(elem, offsetLeft, offsetTop) {
    if (!offsetLeft) offsetLeft = 0;
    if (!offsetTop) offsetTop = 0;

    this.elem = elem;
    this.style = getComputedStyle(elem);

    this.unitsMap = this.generateUnitsMap();
    this.bounds = this.generateBounds(offsetLeft, offsetTop);
    this.shapeInside = this.parseShape(this.getShapeInside());
    this.shapeOutside = this.parseShape(this.getShapeOutside());
}

ShapeInfo.hasShapes = function(elem) {
    var style = getComputedStyle(elem);
    if (!style)
        return false;
    var shapeInside = getProperty(shapeInsideProperties, style)
    var shapeOutside = getProperty(shapeOutsideProperties, style);
    return (shapeInside && shapeInside.indexOf('(') > 0
        || shapeOutside && shapeOutside.indexOf('(') > 0);
}

function getProperty(properties, style) {
    return properties.reduce(function(prior, property) {
        return prior || style[property];
    }, null);
}

function setProperty(properties, style, value) {
    return properties.reduce(function(prior, property) {
        return prior || (style[property] = value);
    }, null);
}

function propertyGetter(properties) {
    return function() {
        return getProperty(properties, this.style);
    }
}

function propertySetter(properties) {
    return function(value) {
        return setProperty(properties, this.elem.style, value);
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
    return result;
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
        return number * percentageBasis / 100;
    return number * this.unitsMap[unit];
}

/* Bounds in viewport coordinates */
ShapeInfo.prototype.generateBounds = function(offsetLeft, offsetTop) {
    var shapeRect = this.elem.getBoundingClientRect();
    var shapeRect = {
        x: shapeRect.left + offsetLeft,
        y: shapeRect.top + offsetTop,
        width: shapeRect.width,
        height: shapeRect.height
    }

    if (this.style.boxSizing === 'border-box')
        return shapeRect;

    var borderLeft = this.elem.clientLeft;
    var borderTop = this.elem.clientTop;

    shapeRect.x += borderLeft;
    shapeRect.y += borderTop;
    shapeRect.width = this.elem.clientWidth;
    shapeRect.height = this.elem.clientHeight;

    return shapeRect;
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

    var result, shapeInfo = this;
    switch(command) {
        case 'rectangle':
            result = {
                shape: 'rectangle',
                x: this.toPixels(args[0], ShapeInfo.HORIZONTAL),
                y: this.toPixels(args[1], ShapeInfo.VERTICAL),
                width: this.toPixels(args[2], ShapeInfo.HORIZONTAL),
                height: this.toPixels(args[3], ShapeInfo.VERTICAL),
                rx: args.length < 5 ? 0 : this.toPixels(args[4], ShapeInfo.HORIZONTAL),
                ry: args.length < 6 ? result.rx : this.toPixels(args[5], ShapeInfo.VERTICAL),
                bounds: this.bounds,
                element: this.elem
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
                bounds: this.bounds,
                element: this.elem
            };
            break;
        case 'circle':
            result = {
                shape: 'circle',
                cx: this.toPixels(args[0], ShapeInfo.HORIZONTAL),
                cy: this.toPixels(args[1], ShapeInfo.VERTICAL),
                r: this.toPixels(args[2], Math.sqrt((ShapeInfo.HORIZONTAL * ShapeInfo.HORIZONTAL + ShapeInfo.VERTICAL * ShapeInfo.VERTICAL) / 2)),
                bounds: this.bounds,
                element: this.elem
            };
            break;
        case 'ellipse':
            result = {
                shape: 'ellipse',
                cx: this.toPixels(args[0], ShapeInfo.HORIZONTAL),
                cy: this.toPixels(args[1], ShapeInfo.VERTICAL),
                rx: this.toPixels(args[2], ShapeInfo.HORIZONTAL),
                ry: this.toPixels(args[3], ShapeInfo.VERTICAL),
                bounds: this.bounds,
                element: this.elem
            };
            break;
        case 'polygon':
            result = {
                shape: 'polygon',
                fillRule: (args[0].search(/nonzero|evenodd/i) >= 0) ? args.shift() : 'nonzero',
                points: args.map(function(point) {
                    point = point.split(/\s+/);
                    return {
                        x: shapeInfo.toPixels(point[0], ShapeInfo.HORIZONTAL),
                        y: shapeInfo.toPixels(point[1], ShapeInfo.VERTICAL)
                    }
                }),
                bounds: this.bounds,
                element: this.elem
            };
            break;
        case 'url':
            result = {
                shape: 'image',
                url: args[0],
                bounds: this.bounds,
                element: this.elem
            };
            break;
        default:
            result = null;
    }
    return result;
}

function drawRoundedRectangle(ctx, fill, x, y, w, h, rx, ry) {
    ctx.beginPath();
    if (rx && ry) {
        var kappa = .5522848;
        var ox = rx * kappa;
        var oy = ry * kappa;
        ctx.moveTo(x + rx, y);
        ctx.lineTo(x + w - rx, y);
        ctx.bezierCurveTo(x + w - rx + ox, y, x + w, y + ry - oy, x + w, y + ry);
        ctx.lineTo(x + w, y + h - ry);
        ctx.bezierCurveTo(x + w, y + h - ry + oy, x + w - rx + ox, y + h, x + w - rx, y + h);
        ctx.lineTo(x + rx, y + h);
        ctx.bezierCurveTo(x + rx - ox, y + h, x, y + h - ry + oy, x, y + h - ry);
        ctx.lineTo(x, y + ry);
        ctx.bezierCurveTo(x, y + ry - oy, x + rx - ox, y, x + rx, y);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function drawCircle(ctx, fill, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function drawEllipse(ctx, fill, cx, cy, rx, ry) {
    var kappa = .5522848;
    var ox = rx * kappa;
    var oy = ry * kappa;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.bezierCurveTo(cx + ox, cy - ry, cx + rx, cy - oy, cx + rx, cy);
    ctx.bezierCurveTo(cx + rx, cy + oy, cx + ox, cy + ry, cx, cy + ry);
    ctx.bezierCurveTo(cx - ox, cy + ry, cx - rx, cy + oy, cx - rx, cy);
    ctx.bezierCurveTo(cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function drawPolygon(ctx, fill, points) {
    ctx.beginPath();
    points.forEach(function(point, i) {
        if (!i)
            ctx.moveTo(point.x, point.y);
        else
            ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function drawShape(context, bounds, shape, fill) {
    var points;
    switch(shape.shape) {
        case 'rectangle':
            drawRoundedRectangle(context, fill, bounds.x + shape.x, bounds.y + shape.y, shape.width, shape.height, shape.rx, shape.ry);
            break;
        case 'circle':
            drawCircle(context, fill, bounds.x + shape.cx, bounds.y + shape.cy, shape.r);
            break;
        case 'ellipse':
            drawEllipse(context, fill, bounds.x + shape.cx, bounds.y + shape.cy, shape.rx, shape.ry);
            break;
        case 'polygon':
            points = shape.points.map(function(point) {
                return {
                    x: point.x + bounds.x,
                    y: point.y + bounds.y
                };
            })
            drawPolygon(context, fill, points);
            break;
        default:
            drawRoundedRectangle(context, fill, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0);
    }
}

function drawShapeInfo(ctx, shapeInfo) {
    var shapeInside = shapeInfo.shapeInside;
    var shapeOutside = shapeInfo.shapeOutside;
    var bounds = shapeInfo.bounds;
    if (shapeOutside)
        drawShape(ctx, bounds, shapeOutside, '#1e90ff');
    if (shapeInside)
        drawShape(ctx, bounds, shapeInside, '#43cd80');
}

var shapes = [];
function draw() {
    var canvas = document.getElementById('show-shapes-canvas');

    // 1 to 1 canvas to pixel mapping
    canvas.width = document.documentElement.offsetWidth;
    canvas.height = document.documentElement.offsetHeight;

    var ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, canvas.width, canvas.height, 'rgba(0, 0, 0, 0.2)');

    shapes.forEach(function(shape) {
        drawShapeInfo(canvas.getContext('2d'), shape);
    });
}

var showing = false;
function toggleOverlay() {
    if (showing)
        removeOverlay();
    else
        addOverlay();
    showing = !showing;
}

function applyStyles(element, styles) {
    for (var property in styles)
        element.style[property] = styles[property];
}

function shapeInfosFor(document, offsetLeft, offsetTop) {
    var result = [];
    var elems = document.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        if (ShapeInfo.hasShapes(elem))
            result.push(new ShapeInfo(elem, offsetLeft, offsetTop));
    }
    return result;
}
function addOverlay() {
    var container = document.createElement('div');
    container.id = 'show-shapes-overlay';
    var styles = {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: '1040' // Bootstrap uses 1030 for a navbar :(
    }, property;
    applyStyles(container, styles);

    var button = document.createElement('button');
    button.innerHTML = 'close';
    styles = {
        position: 'fixed',
        top: '1em',
        right: '1em',
        background: '#1e90ff',
        border: '0',
        padding: '0.5em',
        color: 'white',
        fontSize: '1.2em',
        borderRadius: '0.5em'
    };
    applyStyles(button, styles);
    button.onclick = toggleOverlay;

    var canvas = document.createElement('canvas');
    canvas.id = 'show-shapes-canvas';
    var styles = {
        opacity: '0.7'
    };
    applyStyles(canvas, styles);

    container.appendChild(canvas);
    container.appendChild(button);
    document.body.appendChild(container);

    shapes = [];
    shapes = shapes.concat(shapeInfosFor(document, window.pageXOffset, window.pageYOffset));
    var frames = document.querySelectorAll('iframe'); // this could be done via window.frames, but would be harder to calculate the offsets
    var frame, offset;
    for (var i = 0; i < frames.length; i++) {
        frame = frames[i];
        offset = frame.getBoundingClientRect();
        shapes = shapes.concat(shapeInfosFor(frame.contentDocument, offset.left + window.pageXOffset + frame.clientLeft, offset.top + window.pageYOffset + frame.clientTop));
    }

    window.addEventListener('resize', draw, false);

    draw();
}

function removeOverlay() {
    window.removeEventListener('resize', draw);
    var overlay = document.getElementById('show-shapes-overlay');
    document.body.removeChild(overlay);
    shapes = [];
}

window.ShowShapes = {
    'toggleOverlay': toggleOverlay,
    'ShapeInfo': ShapeInfo
}
})() // end function scope / invocation   
