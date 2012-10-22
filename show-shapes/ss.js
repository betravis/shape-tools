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
    div.setAttribute('class', 'shape-inside-bookmarklet-overlay');
    div.setAttribute('style', 'width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.5');
    div.innerHTML = svg;
    elem.appendChild(div);
}
function showShapeInsides() {
    var elems = document.getElementsByTagName('*');
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var style = getComputedStyle(elem);
        if (style && style.getPropertyValue('-webkit-shape-inside') != 'auto')
            showShapeInside(elem, style, style.getPropertyValue('-webkit-shape-inside'));
    }
}
var shapesOn = false;
function startBookmarklet() {
    showShapeInsides();
    shapesOn = true;
}
function endBookmarklet() {
    var elems = document.getElementsByClassName('shape-inside-bookmarklet-overlay');
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