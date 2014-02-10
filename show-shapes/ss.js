/**
 * Show Shapes Bookmarklet
 * Copyright (C) 2012
 */
 var ShowShapes = (function() { // begin function scope/invocation

/**
 * ShapeValue may contain { shape, box, url }
 * Format for { shape } property value, with coordinates resolved against the reference box
 * { type: 'circle', cx: 10, cy: 10, r: 10 }
 * { type: 'ellipse', cx: 10, cy: 10, rx: 10, ry: 10 }
 * { type: 'inset', x, y, width, height, insets: [10, 10, 10, 10], radii: [[5, 5], [5, 5], [5, 5], [5, 5]] }
 * { type: 'polygon', fill-rule: 'evenodd', points: [{x, y}] }
 * Format for { box } property value, the reference box for shapes. Coordinates are relative to the border box.
 * { x: 10, y: 10, width: 10, height: 10, radii: [[5, 5], [5, 5], [5, 5], [5, 5]] }
 * Format for { url } property value
 * { url: 'http://www.abc.com/123.png' }
 **/
/* params: {
 *   text,
 *   units: { 'px', '%', 'em', etc... }
 *   borderBox: { x, y, width, height, radii: [[2], [2], [2], [2]] },
 *   margins: [4],
 *   borders: [4],
 *   paddings: [4],
 * }
 */
function ShapeValue(params) {
    if (!(params && params.text && params.units && params.borderBox &&
        params.margins && params.borders && params.paddings)) {
        console.log('Not all parameters were specified to ShapeValue, supplying dummy data');
        return;
    }
    this.url = this.parseUrl(params.text);
    this.box = this.parseBox(this.url ? 'content-box' : params.text, params.borderBox, params.margins, params.borders, params.paddings);
    this.shape = this.parseBasicShape(params.text, this.box, params.units);
}

ShapeValue.prototype.parseUrl = function(text) {
    var url = /url\(.*\)/.exec(text);
    if (url)
        return url[0];
    return null;
};

function adjustBounds(bounds, sign, offsets) {
    var top = offsets.reduce(function(prev, curr) { return prev + curr[0]; }, 0);
    var right = offsets.reduce(function(prev, curr) { return prev + curr[1]; }, 0);
    var bottom = offsets.reduce(function(prev, curr) { return prev + curr[2]; }, 0);
    var left = offsets.reduce(function(prev, curr) { return prev + curr[3]; }, 0);

    bounds.x -= sign * left;
    bounds.y -= sign * top;
    bounds.width += sign * (left + right);
    bounds.height += sign * (top + bottom);
}

function adjustRadii(radii, sign, offsets) {
    var top = offsets.reduce(function(prev, curr) { return prev + curr[0]; }, 0);
    var right = offsets.reduce(function(prev, curr) { return prev + curr[1]; }, 0);
    var bottom = offsets.reduce(function(prev, curr) { return prev + curr[2]; }, 0);
    var left = offsets.reduce(function(prev, curr) { return prev + curr[3]; }, 0);

    // Still need to max these with 0
    radii[0][0] = Math.max(radii[0][0] + sign * left, 0);
    radii[0][1] = Math.max(radii[0][1] + sign * top, 0);

    radii[1][0] = Math.max(radii[1][0] + sign * right, 0);
    radii[1][1] = Math.max(radii[1][1] + sign * top, 0);

    radii[2][0] = Math.max(radii[2][0] + sign * right, 0);
    radii[2][1] = Math.max(radii[2][1] + sign * bottom, 0);

    radii[3][0] = Math.max(radii[3][0] + sign * left, 0);
    radii[3][1] = Math.max(radii[3][1] + sign * bottom, 0);
}

ShapeValue.prototype.parseBox = function(text, borderBox, margins, borders, paddings) {
    var box = /margin-box|border-box|padding-box|content-box/.exec(text);
    if (!box)
        return null;
    else
        box = box[0];
    // deep copy radii
    var result = { text: box, x: borderBox.x, y: borderBox.y, width: borderBox.width, height: borderBox.height, radii: JSON.parse(JSON.stringify(borderBox.radii)) };
    switch (box) {
        case 'content-box':
            adjustBounds(result, -1, [paddings, borders]);
            adjustRadii(result.radii, -1, [paddings, borders]);
            break;
        case 'padding-box':
            adjustBounds(result, -1, [borders]);
            adjustRadii(result.radii, -1, [borders]);
            break;
        case 'border-box':
            break;
        case 'margin-box':
            adjustBounds(result, 1, [margins]);
            adjustRadii(result.radii, 1, [margins]);
            break;
    }
    return result;
};

function pluck(arr, index) {
    return arr.map(function(item) {
        return item[index];
    });
}

ShapeValue.prototype.printShape = function() {
    if (this.shape) {
        switch(this.shape.type) {
            case 'inset':
                return 'inset(' + this.shape.insets.join(' ') +
                    ' round ' + pluck(this.shape.radii, 0).join(' ') +
                    ' / ' + pluck(this.shape.radii, 1).join(' ') + ')';
            case 'circle':
                return 'circle(' + this.shape.r + ' at ' + this.shape.cx + ' ' + this.shape.cy + ')';
            case 'ellipse':
                return 'ellipse(' + this.shape.rx + ' ' + this.shape.ry +
                    ' at ' + this.shape.cx + ' ' + this.shape.cy + ')';
            case 'polygon':
                return 'polygon(' + this.shape.fillRule + ', ' +
                    this.shape.points.map(function(point) { return point.x + ' ' + point.y; }).join(', ') +
                    ')';
            default: return 'not yet implemented for ' + this.shape.type;
        }
    }
    return 'no shape specified';
};

ShapeValue.prototype.printBox = function() {
    if (this.box) {
        return this.box.text + ' { x: ' + this.box.x + ', y: ' + this.box.y +
            ', width: ' + this.box.width + ', height: ' + this.box.height +
            ', radii: ' + pluck(this.box.radii, 0).join(' ') + ' / ' + pluck(this.box.radii, 1).join(' ') + ' }';
    }
    return 'no box specified';
};

ShapeValue.prototype.parseBasicShape = function(text, box, units) {
    var shape = /(inset|circle|ellipse|polygon)\((.*)\)/.exec(text);
    if (!shape)
        return null;

    var command = shape[1],
        args = shape[2] ? shape[2] : '';

    switch(command) {
    case 'inset':
        return this.parseInset(args, box, units);
    case 'circle':
        return this.parseCircle(args, box, units);
    case 'ellipse':
        return this.parseEllipse(args, box, units);
    case 'polygon':
        return this.parsePolygon(args, box, units);
    default: return null;
    }
};

function toPixels(length, extent, units) {
    var split = /([\-0-9\.]*)([a-z%]*)/.exec(length);
    split[1] = parseFloat(split[1]);
    if (!split[2])
        return split[1];
    if (split[2] === '%')
        return split[1] * extent / 100;
    return split[1] * units[split[2]];
}

ShapeValue.prototype.parseInset = function(args, box, units) {
    // use the 'ro' in round and '/' as delimiters
    var re = /((?:[^r]|r(?!o))*)?\s*(?:round\s+([^\/]*)(?:\s*\/\s*(.*))?)?/;
    args = re.exec(args);
    var result = {
        type: 'inset',
        insets: [0, 0, 0, 0],
        radii: [[0, 0], [0, 0], [0, 0], [0, 0]]
    };
    if (args && args[1]) {
        var insets = args[1].trim();
        insets = insets.split(/\s+/);
        result.insets[0] = insets[0];
        result.insets[1] = insets.length > 1 ? insets[1] : result.insets[0];
        result.insets[2] = insets.length > 2 ? insets[2] : result.insets[0];
        result.insets[3] = insets.length > 3 ? insets[3] : result.insets[1];
        result.insets[0] = toPixels(result.insets[0], box.height, units);
        result.insets[1] = toPixels(result.insets[1], box.width, units);
        result.insets[2] = toPixels(result.insets[2], box.height, units);
        result.insets[3] = toPixels(result.insets[3], box.width, units);
    }

    var radii;
    if (args && args[2]) {
        radii = args[2].trim();
        radii = radii.split(/\s+/);
        if (radii.length < 2) radii.push(radii[0]);
        if (radii.length < 3) radii.push(radii[0]);
        if (radii.length < 4) radii.push(radii[1]);

        result.radii = radii.map(function(radius) {
            radius = toPixels(radius, box.width, units); 
            return [radius, radius];
        });
    }

    if (args && args[3]) {
        radii = args[3].trim();
        radii = radii.split(/\s+/);
        if (radii.length < 2) radii.push(radii[0]);
        if (radii.length < 3) radii.push(radii[0]);
        if (radii.length < 4) radii.push(radii[1]);

        radii.forEach(function(radius, i) {
            result.radii[i][1] = toPixels(radius, box.height, units); 
        });
    }

    result.x = result.insets[3];
    result.y = result.insets[0];
    result.width = box.width - (result.insets[1] + result.insets[3]);
    result.height = box.height - (result.insets[0] + result.insets[2]);

    return result;
};

function positionOffsetToPixels(offset, extent, units) {
    offset = offset.split(/\s+/);
    var direction = 'TopLeft';
    var length = 0;

    switch(offset[0]) {
    case 'top': case 'left': break;
    case 'bottom': case 'right': direction = 'BottomRight'; break;
    case 'center': length = extent / 2.0; break;
    default: length = toPixels(offset[0], extent, units);
    }

    if (offset.length > 1)
        length = toPixels(offset[1], extent, units);

    return direction === 'TopLeft' ? length : extent - length;
}

function radiusToPixels(r, sides, extent, units) {
    if (r === 'closest-side')
        return Math.min.apply(null, sides);
    else if (r === 'farthest-side')
        return Math.max.apply(null, sides);
    else
        return toPixels(r, extent, units);
}

// Parse but do not resolve yet (shared by circle and ellipse)
ShapeValue.prototype.parseEllipsoid = function(args) {
    // use the 'a' in 'at' as the delimiter
    var re = /((?:[^a]|a(?!t))*)?\s*(?:at\s+(.*))?/;
    args = re.exec(args);

    var result = { };

    if (args && args[1]) {
        var radii = args[1].trim();
        radii = radii.split(/\s+/);
        result.rx = radii[0];
        result.ry = radii.length > 1 ? radii[1] : radii[0];
    } else {
        result.rx = result.ry = 'closest-side';
    }

    var resolvedPositions = [];
    if (args && args[2]) {
        var positions = args[2].trim();
        positions = positions.split(/\s+/);
        var canMergeBack = false;
        positions.forEach(function(position) {
            // if it is an offset
            if (/\d+/.test(position) && canMergeBack)
                resolvedPositions[resolvedPositions.length - 1] += ' ' + position;
            else
                resolvedPositions.push(position);
            // it's a non-center keyword and there are more than two inputs
            canMergeBack = (/top|bottom|left|right/.test(position) && positions.length > 2);
        });
    }
    while(resolvedPositions.length < 2)
        resolvedPositions.push('center');
    if (/top|bottom/.test(resolvedPositions[0]) || /left|right/.test(resolvedPositions[1])) {
        var swap = resolvedPositions[0];
        resolvedPositions[0] = resolvedPositions[1];
        resolvedPositions[1] = swap;
    }
    result.cx = resolvedPositions[0];
    result.cy = resolvedPositions[1];

    return result;
};

ShapeValue.prototype.parseCircle = function(args, box, units) {
    var result = this.parseEllipsoid(args);
    result.type = 'circle';
    result.cx = positionOffsetToPixels(result.cx, box.width, units);
    result.cy = positionOffsetToPixels(result.cy, box.height, units);
    result.r = radiusToPixels(result.rx, [
        Math.abs(result.cx), Math.abs(box.width - result.cx),
        Math.abs(result.cy), Math.abs(box.height - result.cy)
    ], Math.sqrt((box.width * box.width + box.height * box.height) / 2), units);
    delete result.rx;
    delete result.ry;
    return result;
};

ShapeValue.prototype.parseEllipse = function(args, box, units) {
    var result = this.parseEllipsoid(args);
    result.type = 'ellipse';
    result.cx = positionOffsetToPixels(result.cx, box.width, units);
    result.cy = positionOffsetToPixels(result.cy, box.height, units);
    result.rx = radiusToPixels(result.rx, [Math.abs(result.cx), Math.abs(box.width - result.cx)], box.width, units);
    result.ry = radiusToPixels(result.ry, [Math.abs(result.cy), Math.abs(box.height - result.cy)], box.height, units);
    return result;
};

ShapeValue.prototype.parsePolygon = function(args, box, units) {
    args = args.split(/\s*,\s*/);
    var rule = 'nonzero';
    if (args.length > 0 && /nonzero|evenodd/.test(args[0])) {
        rule = args[0].trim();
        args = args.slice(1);
    }
    var points = args.map(function(point) {
        var coords = point.split(/\s+/);
        return { x: toPixels(coords[0], box.width, units), y: toPixels(coords[1], box.height, units) };
    });
    return {
        type: 'polygon',
        'fillRule': rule,
        'points': points
    };
};

var shapeInsideProperties = [
    'shapeInside',
    'webkitShapeInside'
    /* no other current implementations */
];

var shapeOutsideProperties = [
    'shapeOutside',
    'webkitShapeOutside'
];

function addOptionalBox(shapeText, box) {
    if (/^(?:inset|circle|ellipse|polygon)\(.*\)$/.test(shapeText))
        return shapeText + ' ' + box;
    return shapeText;
}

function ShapeInfo(elem, offsetLeft, offsetTop) {
    if (!offsetLeft) offsetLeft = 0;
    if (!offsetTop) offsetTop = 0;

    this.elem = elem;
    this.style = getComputedStyle(elem);

    this.borderBox = {
        x: 0,
        y: 0,
        width: elem.offsetWidth,
        height: elem.offsetHeight,
        // same format as border-radius: tl, tr, br, bl
        radii: [[0, 0], [0, 0], [0, 0], [0, 0]]
    };

    this.unitsMap = this.generateUnitsMap();

    var outer = this;
    var radii = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
    radii.forEach(function(radius, index) {
        radius = outer.style[radius].split(/\s+/);
        outer.borderBox.radii[index][0] = toPixels(radius[0], outer.borderBox.width, outer.unitsMap);
        outer.borderBox.radii[index][1] = toPixels(radius.length > 1 ? radius[1] : radius[0], outer.borderBox.height, outer.unitsMap);
    });

    var parseLength = function(length) { return parseInt(length); };
    this.margins = [this.style.marginTop, this.style.marginRight, this.style.marginBottom, this.style.marginLeft];
    this.margins = this.margins.map(parseLength);
    this.borders = [this.style.borderTop, this.style.borderRight, this.style.borderBottom, this.style.borderLeft];
    this.borders = this.borders.map(parseLength);
    this.paddings = [this.style.paddingTop, this.style.paddingRight, this.style.paddingBottom, this.style.paddingLeft];
    this.paddings = this.paddings.map(parseLength);

    var settings = {
        units: this.unitsMap,
        borderBox: this.borderBox,
        margins: this.margins,
        borders: this.borders,
        paddings: this.paddings
    };

    this.bounds = this.generateBounds(offsetLeft, offsetTop);
    settings.text = addOptionalBox(this.getShapeInside(), 'content-box');
    this.shapeInside = new ShapeValue(settings);
    settings.text = addOptionalBox(this.getShapeOutside(), 'margin-box');
    this.shapeOutside = new ShapeValue(settings);
}

ShapeInfo.hasShapes = function(elem) {
    var style = getComputedStyle(elem);
    if (!style)
        return false;
    var shapeInside = getProperty(shapeInsideProperties, style);
    var shapeOutside = getProperty(shapeOutsideProperties, style);
    return (shapeInside && shapeInside !== 'none' ||
        shapeOutside && shapeOutside !== 'none');
};

function getProperty(properties, style) {
    return properties.reduce(function(prior, property) {
        return prior || style[property];
    }, null);
}

function propertyGetter(properties) {
    return function() {
        return getProperty(properties, this.style);
    };
}

ShapeInfo.prototype.getShapeInside = propertyGetter(shapeInsideProperties);
ShapeInfo.prototype.getShapeOutside = propertyGetter(shapeOutsideProperties);

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
};

/* Bounds in viewport coordinates */
ShapeInfo.prototype.generateBounds = function(offsetLeft, offsetTop) {
    var shapeRect = this.elem.getBoundingClientRect();
    shapeRect = {
        x: shapeRect.left + offsetLeft,
        y: shapeRect.top + offsetTop,
        width: shapeRect.width,
        height: shapeRect.height
    };

    return shapeRect;
};

function drawRoundedRectangle(ctx, fill, x, y, w, h, radii /* tl, tr, br, bl */) {
    ctx.beginPath();
    if (radii) {
        var kappa = 0.5522848;
        var rx = radii[0][0];
        var ry = radii[0][1];
        var ox = rx * kappa;
        var oy = ry * kappa;
        ctx.moveTo(x, y + h - radii[3][1]);
        ctx.lineTo(x, y + ry);
        ctx.bezierCurveTo(x, y + ry - oy, x + rx - ox, y, x + rx, y);

        rx = radii[1][0];
        ry = radii[1][1];
        ox = rx * kappa;
        oy = ry * kappa;
        ctx.lineTo(x + w - rx, y);
        ctx.bezierCurveTo(x + w - rx + ox, y, x + w, y + ry - oy, x + w, y + ry);

        rx = radii[2][0];
        ry = radii[2][1];
        ox = rx * kappa;
        oy = ry * kappa;
        ctx.lineTo(x + w, y + h - ry);
        ctx.bezierCurveTo(x + w, y + h - ry + oy, x + w - rx + ox, y + h, x + w - rx, y + h);

        rx = radii[3][0];
        ry = radii[3][1];
        ox = rx * kappa;
        oy = ry * kappa;
        ctx.lineTo(x + rx, y + h);
        ctx.bezierCurveTo(x + rx - ox, y + h, x, y + h - ry + oy, x, y + h - ry);
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
    var kappa = 0.5522848;
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

function drawShape(context, bounds, shapeValue, fill) {
    var points;
    if (shapeValue.shape) {
        switch(shapeValue.shape.type) {
            case 'inset':
                drawRoundedRectangle(
                    context, fill,
                    bounds.x + shapeValue.shape.x + shapeValue.box.x,
                    bounds.y + shapeValue.shape.y + shapeValue.box.y,
                    shapeValue.shape.width,
                    shapeValue.shape.height,
                    shapeValue.shape.radii
                );
                break;
            case 'circle':
                drawCircle(context,
                    fill,
                    bounds.x + shapeValue.shape.cx + shapeValue.box.x,
                    bounds.y + shapeValue.shape.cy + shapeValue.box.y,
                    shapeValue.shape.r
                );
                break;
            case 'ellipse':
                drawEllipse(context,
                    fill,
                    bounds.x + shapeValue.shape.cx + shapeValue.box.x,
                    bounds.y + shapeValue.shape.cy + shapeValue.box.y,
                    shapeValue.shape.rx,
                    shapeValue.shape.ry
                );
                break;
            case 'polygon':
                points = shapeValue.shape.points.map(function(point) {
                    return {
                        x: point.x + bounds.x + shapeValue.box.x,
                        y: point.y + bounds.y + shapeValue.box.y
                    };
                });
                drawPolygon(context, fill, points);
                break;
            default:
                break;
        }
    }
    else if (shapeValue.box) {
        drawRoundedRectangle(
            context, fill,
            bounds.x + shapeValue.box.x,
            bounds.y + shapeValue.box.y,
            shapeValue.box.width,
            shapeValue.box.height,
            shapeValue.box.radii
        );
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
    styles = {
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

return {
    'toggleOverlay': toggleOverlay,
    'ShapeInfo': ShapeInfo,
    'ShapeValue': ShapeValue
};
})(); // end function scope / invocation
