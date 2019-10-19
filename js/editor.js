var Editor = /** @class */ (function () {
    function Editor(content) {
        var _this = this;
        if (content === void 0) { content = "<p><br/></p>"; }
        this.contentWindow = window;
        this.contentDocument = document;
        this.contentElement = document.body;
        this.activeNode = document.activeElement;
        this.activeElement = document.activeElement;
        this.activeDocument = document;
        this.activeWindow = window;
        this.activeElementPath = [];
        this.activeSelection = document.getSelection();
        this.element = document.createElementNS(Editor.namespaceURI, "editor");
        this._devsElement = document.createElementNS(Editor.namespaceURI, "devs");
        this.element.appendChild(this._devsElement);
        this._toolbarElement = document.createElementNS(Editor.namespaceURI, "toolbar");
        this.element.appendChild(this._toolbarElement);
        this._contentElement = document.createElementNS(Editor.htmlNamespaceURI, "iframe");
        this._contentElement.addEventListener("load", function (e) {
            _this.contentWindow = _this._contentElement.contentWindow;
            _this.contentDocument = _this._contentElement.contentDocument;
            _this.contentElement = _this.contentDocument.body;
            var link = _this.contentDocument.createElement("link");
            link.href = location.protocol + "//" + location.hostname + location.pathname.replace(/\/[^\/]*$/, "/") + "css/editor-content.css";
            link.type = "text/css";
            link.rel = "stylesheet";
            _this.contentDocument.head.appendChild(link);
            _this.contentDocument.designMode = "on";
            _this.contentElement.innerHTML = content;
            _this.contentElement.focus();
            // setInterval(() => {
            //   this.contentElement.classList.toggle("show-blocks");
            // }, 5000);
            _this.updateBreadcrumbs();
        });
        // this._contentElement = document.createElement("div");
        // this.contentElement = this._contentElement;
        // this._contentElement.innerHTML = content;
        // this._contentElement.contentEditable = true;
        // this.updateBreadcrumbs();
        this._toolbarElement.appendChild(this.createButton(null, "fett", function (event) {
            _this.contentDocument.execCommand("bold");
            event.preventDefault();
        }));
        this._toolbarElement.appendChild(this.createButton(null, "kursiv", function (event) {
            _this.contentDocument.execCommand("italic");
            event.preventDefault();
        }));
        this._toolbarElement.appendChild(this.createButton(null, "unterstrichen", function (event) {
            _this.contentDocument.execCommand("underline");
            event.preventDefault();
        }));
        this._toolbarElement.appendChild(this.createButton(null, "Alles auswählen", function (event) {
            _this.contentDocument.execCommand("selectAll");
            event.preventDefault();
        }));
        this.element.appendChild(this._contentElement);
        this._breadcrumbsElement = document.createElementNS(Editor.namespaceURI, "breadcrumbs");
        this.element.appendChild(this._breadcrumbsElement);
    }
    Editor.prototype.createButton = function (icon, label, action) {
        var button = document.createElementNS(Editor.namespaceURI, "button");
        if (icon) {
            var icon_span = document.createElementNS(Editor.namespaceURI, "icon");
            icon_span.textContent = icon;
            button.appendChild(icon_span);
            button.classList.add("icon");
        }
        if (label) {
            var label_span = document.createElementNS(Editor.namespaceURI, "label");
            label_span.textContent = label;
            button.appendChild(label_span);
            button.classList.add("label");
        }
        button.addEventListener("mousedown", action);
        button.addEventListener("touchstart", action);
        return button;
    };
    Editor.prototype.updateBreadcrumbs = function () {
        var _this = this;
        // var activeElement = this.contentDocument.activeElement;
        var activeElement = this.contentElement;
        var activeDocument = this.contentDocument;
        var activeWindow = this.contentWindow;
        // while (activeElement instanceof (<any>activeWindow).HTMLIFrameElement) {
        //   activeWindow = (<HTMLIFrameElement>activeElement).contentWindow;
        //   activeDocument = (<HTMLIFrameElement>activeElement).contentDocument;
        //   activeElement = activeDocument.activeElement;
        // }
        var activeSelection = this.contentDocument.getSelection ? this.contentDocument.getSelection() : this.contentWindow.getSelection();
        var activeNode = activeSelection.anchorNode || activeElement;
        activeElement = activeNode.nodeType == activeNode.ELEMENT_NODE ? activeNode : activeNode.parentElement;
        var element = activeElement;
        var activeElementPath = [];
        var validPath = false;
        if (element == this.contentElement) {
            validPath = true;
        }
        else {
            while (element && element != this.contentElement) {
                activeElementPath.unshift(element);
                element = element.parentElement;
                if (element == this.contentElement) {
                    validPath = true;
                }
            }
        }
        if (!validPath) {
            return;
        }
        this.activeSelection = activeSelection;
        this.activeNode = activeNode;
        this.activeElement = activeElement;
        this.activeDocument = activeDocument;
        this.activeWindow = activeWindow;
        this.activeElementPath = activeElementPath;
        this._breadcrumbsElement.textContent = " > " + activeElementPath.map(function (e) { return _this.resolveElementToStyle(e); }).join(" > ");
        Array.prototype.forEach.call(this.contentElement.childNodes, function (e) {
            if (e.nodeType == e.TEXT_NODE && e.length > 0) {
                var p = _this.contentDocument.createElement("p");
                e.parentNode.replaceChild(p, e);
                p.appendChild(e);
            }
            if (e.nodeType == e.ELEMENT_NODE && e.nodeName.toLowerCase() == "br") {
                var p = _this.contentDocument.createElement("p");
                e.parentNode.replaceChild(p, e);
                p.appendChild(e);
            }
        });
        if (this.contentElement.childElementCount == 0) {
            var p = this.contentDocument.createElement("p");
            p.appendChild(this.contentDocument.createElement("br"));
            this.contentElement.appendChild(p);
        }
        requestAnimationFrame(function () { return _this.updateBreadcrumbs(); });
    };
    Editor.prototype.resolveElementToStyle = function (element) {
        return element.nodeName.toLowerCase();
    };
    return Editor;
}());
(function (Editor) {
    Editor.namespaceURI = "https://mpdieckmann.github.io/editor";
    Editor.htmlNamespaceURI = "http://www.w3.org/1999/xhtml";
})(Editor || (Editor = {}));
//# sourceMappingURL=editor.js.map