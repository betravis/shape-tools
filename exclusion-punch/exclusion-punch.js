/*
Copyright 2012 Bear Travis
These examples pull code from multiple sources, and may be subject to multiple licenses.
Unless otherwise noted, though, you're free to use them under a creative commons license.
<http://creativecommons.org/licenses/by/3.0/>
This particular library relies on jsclipper from http://sourceforge.net/projects/jsclipper/
*/
(function(window){
  var ExclusionPunch = {};

  function polygonToClipper(polygon) {
    var fn = polygon.split(/[\(\)]/);
    var args = fn[1];
    fn = fn[0];
    var polygons = new ClipperLib.Polygons();
    var polygon = polygons[0];
    if (fn === 'polygon') {
      args = args.split(/\s*,\s*/);
      args.map(function(coord) {
        coord = coord.split(/\s+/);
        coord[0] = parseFloat(coord[0]);
        coord[1] = parseFloat(coord[1]);
        polygon.push(new ClipperLib.IntPoint(coord[0], coord[1]));
      });
    }
    return polygons;
  }

  function clipperToPolygon(polygons) {
    var result = polygons[0].map(function(point, i) {
      return point.X + 'px ' + point.Y + 'px';
    }).join(',');
    result = 'polygon(' + result + ')';
    return result;
  }

  var cpr;
  ExclusionPunch.exclude = function(element, polygon) {
    window.ClipperLib.biginteger_used = null;
    var source = new ClipperLib.Polygons();
    var coords = [
      [0, 0],
      [element.clientWidth, 0], 
      [element.clientWidth, element.clientHeight],
      [0, element.clientHeight]
    ];
    coords.map(function(coord) { source[0].push(new ClipperLib.IntPoint(coord[0], coord[1])); });
    var clip = polygonToClipper(polygon);
    if (!cpr) cpr = new ClipperLib.Clipper();
    else cpr.Clear();
    var result = new ClipperLib.Polygons();
    cpr.AddPolygons(clip, ClipperLib.PolyType.ptClip);
    cpr.AddPolygons(source, ClipperLib.PolyType.ptSubject);
    cpr.Execute(
      ClipperLib.ClipType.ctDifference, // operation
      result, // output
      ClipperLib.PolyFillType.pftNonZero, // subject fill type
      ClipperLib.PolyFillType.pftNonZero // clip fill type
    );
    result = clipperToPolygon(result);
    element.style.setProperty('-webkit-shape-inside', result);
  }


  ExclusionPunch.run = function() {
    var excludes = window.document.querySelectorAll('[data-exclude-shape]');
    for (var i = 0; i < excludes.length; i++) {
      var exclude = excludes[i];
      ExclusionPunch.exclude(exclude, exclude.getAttribute('data-exclude-shape'));
    }
  }

  window.ExclusionPunch = ExclusionPunch;
})(window);