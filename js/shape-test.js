(function() {
    var enabled = null;

    var checkEnabled = function() {
        var elem = document.createElement('div');
        // The property is still experimental. As more browsers pick it up,
        // we can transition towards a non-prefixed or multiple-prefix test.
        elem.style.setProperty('-webkit-shape-inside', 'rectangle(0, 0, 0, 0)');
        enabled = elem.style.getPropertyValue('-webkit-shape-inside') != null;
        
        if (!enabled) {
            var div = document.createElement('div');
            div.setAttribute('class', 'alert alert-block alert-error');
            var content = [
                "<h4><i class='icon-exclamation-sign'></i> Warning</h4>",
                "<p>It appears that your browser does not support CSS Shapes. Don't panic, they're",
                "still a very experimental feature, but some of the tools may not display properly.",
                "Find out more about <a href='http://adobe.github.com/web-platform/samples/css-exclusions/index.html#browser-support'>browser support</a>.</p>"
            ];
            div.innerHTML = content.join('\n');
            var header = document.querySelector('.jumbotron');
            header.parentNode.insertBefore(div, header);
        }
    }

    document.addEventListener('DOMContentLoaded', checkEnabled);
    if (document.readyState.search(/interactive|complete/) >= 0)
        checkEnabled();
}());