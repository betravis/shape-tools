/**
 * Show Shapes Bookmarklet
 * Copyright (C) 2012
 */
(function() {
function format() {
    var outerArgs = arguments;
    return outerArgs[0].replace(/{(\d+)}/g, function($0, $1) {
        var num = parseInt($1);
        return (num >= 0 && num < outerArgs.length - 1) ? outerArgs[num + 1] : '';
    });
}
function shapeInsideToSVG(shapeInside, elem, style) {
    shapeInside = shapeInside.split(/[()]/);
    var command = shapeInside[0];
    var args = shapeInside[1].split(/\s*,\s*/);
    var result = '';
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
    }
    /* eventually need to do font size & fill */
    return "<svg xmlns='http://www.w3.org/2000/svg' style='display:block' width='100%' height='100%'><g fill='blue'>" + result + "</g></svg>";
}
function showShapeInside(elem, style, shape) {
    var svg = shapeInsideToSVG(shape, elem, style);
    if (style.getPropertyValue('position') == 'static')
        elem.style.setProperty('position', 'relative');
    var div = document.createElement('div');
    div.setAttribute('class', 'shape-bookmarklet-overlay');
    div.setAttribute('style', 'width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.5');
    div.innerHTML = svg;
    elem.appendChild(div);
}
// FIXME this probably will not work with vertical writing modes
function shapeOutsideToSVG(shapeInside, elem, style) {
    shapeInside = shapeInside.split(/[()]/);
    var command = shapeInside[0];
    var args = shapeInside[1].split(/\s*,\s*/);
    var left, top, width, height;
    var result = '';
    switch(command) {
        case 'rectangle':
            var rx = "", ry = "";
            if (args.length > 4) {
                rx = "rx='" + args[4] + "'";
                ry = "ry='" + (args.length > 5 ? args[5] : args[4]) + "'";
            }
            left = args[0];
            top = args[1];
            width = args[2];
            height = args[3];
            result = format("<rect x='0' y='0' width='100%' height='100%' {1} {2} />", rx, ry);
            break;
        case 'circle':
            // FIXME this only works if all of the units are the same
            var cx = args[0].match(/(\d+)(\D+)/)[1];
            var cy = args[1].match(/(\d+)(\D+)/)[1];
            var r = args[2].match(/(\d+)(\D+)/)[1];
            var unit = args[0].match(/(\d+)(\D+)/)[2];
            left = format("{0}{1}", cx - r, unit);
            top = format("{0}{1}", cy - r, unit);
            width = format("{0}{1}", 2 * r, unit);
            height = format("{0}{1}", 2 * r, unit);
            result = "<circle cx='50%' cy='50%' r='50%' />";
            break;
        case 'ellipse':
            // FIXME this only works if all of the units are the same
            var cx = args[0].match(/(\d+)(\D+)/)[1];
            var cy = args[1].match(/(\d+)(\D+)/)[1];
            var rx = args[2].match(/(\d+)(\D+)/)[1];
            var ry = args[3].match(/(\d+)(\D+)/)[1];
            var unit = args[0].match(/(\d+)(\D+)/)[2];
            left = format("{0}{1}", cx - rx, unit);
            top = format("{0}{1}", cy - ry, unit);
            width = format("{0}{1}", 2 * rx, unit);
            height = format("{0}{1}", 2 * ry, unit);
            result = "<ellipse cx='50%' cy='50%' rx='50%' ry='50%' />";
            break;
        case 'polygon':
            // FIXME this does not work
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
    }
    var div = document.createElement('div');
    div.setAttribute('class', 'shape-bookmarklet-overlay');
    div.setAttribute('style', format('width:{0};height:{1};position:absolute;top:{2};left:{3};opacity:0.5', width, height, top, left));
    div.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' style='display:block' width='100%' height='100%'><g fill='blue'>" + result + "</g></svg>";
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
        if (style && style.getPropertyValue('-webkit-shape-inside') != 'auto')
            showShapeInside(elem, style, style.getPropertyValue('-webkit-shape-inside'));
        if (style && style.getPropertyValue('-webkit-shape-outside') != 'auto')
            showShapeOutside(elem, style, style.getPropertyValue('-webkit-shape-outside'));
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
!function() {
    window.showShapesBookmarklet = function() { shapesOn ? endBookmarklet() : startBookmarklet(); }
    startBookmarklet();
}()
})()
