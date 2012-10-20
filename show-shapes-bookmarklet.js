/**
 * Show Shapes Bookmarklet
 * Copyright (C) 2012
 */
(function() {
function format() {
    var outerArgs = arguments;
    return outerArgs[0].replace(/{(\d+)}/g, function($0, $1) {
        var num = parseInt($1);
        return (num >= 0 && num < outerArgs.length - 1) ? outerArgs[num + 1] : "";
    });
}
function shapeInsideToSVG(shapeInside) {
    shapeInside = shapeInside.split(/[()]/);
    var command = shapeInside[0];
    var args = shapeInside[1].split(/,\s*/);
    var result = "";
    switch(command) {
        case "rectangle":
            var rx = "", ry = "";
            if (args.length > 4) {
                rx = "rx='" + args[4] + "'";
                ry = "ry='" + (args.length > 5 ? args[5] : args[4]) + "'";
            }
            result = format("<rect x='{0}' y='{1}' width='{2}' height='{3}' {4} {5} />", args[0], args[1], args[2], args[3], rx, ry);
            break;
        case "circle":
            result = format("<circle cx='{0}' cy='{1}' r='{2} />", args[0], args[1], args[2]);
            break;
        case "ellipse":
            result = format("<ellipse cx='{0}' cy='{1}' rx='{2}' ry='{3}' />", args[0], args[1], args[2], args[3]);
            break;
        case "polygon":
            var fillRule = (args[0].search(/nonzero|evenodd/i) >= 0 ? args.shift() : "nonzero");
            var points = args.reduce(function(prev, curr, index, arr) { return prev + (index > 0 ? " " : "") + curr.replace(/\s+/, ",").replace(/px/g, ""); }, "");
            result = format("<polygon fill-rule='{0}' points='{1}' />", fillRule, points);
            break;
        default:
    }
    /* eventually need to do font size & fill */
    return "<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><g fill='blue'>" + result + "</g></svg>";
}
function showShapeInside(elem, style, shape) {
    var svg = shapeInsideToSVG(shape);
    if (style.getPropertyValue('position') == 'static')
        elem.style.setProperty('position', 'relative');
    var div = document.createElement('div');
    div.setAttribute("class", "shape-inside-bookmarklet-overlay");
    div.setAttribute("style", "width:100%;height:100%;position:absolute;top:0;opacity:0.5");
    div.innerHTML = svg;
    elem.appendChild(div);
}
function showShapeInsides() {
    var elems = document.getElementsByTagName('*');
    for (var i in elems) {
        var style = getComputedStyle(elems[i]);
        if (style && style.getPropertyValue('-webkit-shape-inside') != 'auto')
            showShapeInside(elems[i], style, style.getPropertyValue('-webkit-shape-inside'));
    }    
}
var button = null;
function startBookmarklet() {
    if (button)
        return;
    button = document.createElement("button");
    button.setAttribute("style", "position:fixed;top:0;right:0");
    button.innerHTML = "Exit ShowShapes";
    button.onclick = endBookmarklet;
    document.body.appendChild(button);
    showShapeInsides();
}
function endBookmarklet() {
    document.body.removeChild(button);
    button = null;
    var elems = document.getElementsByClassName("shape-inside-bookmarklet-overlay");
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        elem.parentNode.removeChild(elem);
    }
}
window.shapeInsideBookmarklet = startBookmarklet;
startBookmarklet();
})()