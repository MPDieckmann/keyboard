class Editor {
  public readonly element: Element;
  protected readonly _devsElement: Element;
  protected readonly _toolbarElement: Element;
  protected readonly _contentElement: HTMLIFrameElement;
  protected readonly _breadcrumbsElement: Element;
  constructor(content: string = "<p><br/></p>") {
    this.element = document.createElementNS(Editor.namespaceURI, "editor");
    this._devsElement = document.createElementNS(Editor.namespaceURI, "devs");
    this.element.appendChild(this._devsElement);
    this._toolbarElement = document.createElementNS(Editor.namespaceURI, "toolbar");
    this.element.appendChild(this._toolbarElement);
    this._contentElement = <HTMLIFrameElement>document.createElementNS(Editor.htmlNamespaceURI, "iframe");
    this._contentElement.addEventListener("load", e => {
      this.contentWindow = this._contentElement.contentWindow;
      this.contentDocument = this._contentElement.contentDocument;
      this.contentElement = this.contentDocument.body;

      var link = this.contentDocument.createElement("link");
      link.href = location.protocol + "//" + location.hostname + location.pathname.replace(/\/[^\/]*$/, "/") + "css/editor-content.css";
      link.type = "text/css";
      link.rel = "stylesheet";
      this.contentDocument.head.appendChild(link);

      this.contentDocument.designMode = "on";
      this.contentElement.innerHTML = content;
      (<HTMLElement>this.contentElement).focus();

      // setInterval(() => {
      //   this.contentElement.classList.toggle("show-blocks");
      // }, 5000);

      this.updateBreadcrumbs();
    });
    // this._contentElement = document.createElement("div");
    // this.contentElement = this._contentElement;
    // this._contentElement.innerHTML = content;
    // this._contentElement.contentEditable = true;
    // this.updateBreadcrumbs();

    this._toolbarElement.appendChild(this.createButton(null, "fett", (event) => {
      this.contentDocument.execCommand("bold");
      event.preventDefault();
    }));
    this._toolbarElement.appendChild(this.createButton(null, "kursiv", (event) => {
      this.contentDocument.execCommand("italic");
      event.preventDefault();
    }));
    this._toolbarElement.appendChild(this.createButton(null, "unterstrichen", (event) => {
      this.contentDocument.execCommand("underline");
      event.preventDefault();
    }));
    this._toolbarElement.appendChild(this.createButton(null, "Alles auswählen", (event) => {
      this.contentDocument.execCommand("selectAll");
      event.preventDefault();
    }));

    this.element.appendChild(this._contentElement);
    this._breadcrumbsElement = document.createElementNS(Editor.namespaceURI, "breadcrumbs");
    this.element.appendChild(this._breadcrumbsElement);
  }
  protected contentWindow: Window = window;
  protected contentDocument: Document = document;
  protected contentElement: Element = document.body;

  protected activeNode: Node = document.activeElement;
  protected activeElement: Element = document.activeElement;
  protected activeDocument: Document = document;
  protected activeWindow: Window = window;
  protected activeElementPath: Element[] = [];
  protected activeSelection: Selection = document.getSelection();

  createButton(icon: string, label: string, action: (event: Event) => void) {
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
  }

  updateBreadcrumbs() {
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
    activeElement = activeNode.nodeType == activeNode.ELEMENT_NODE ? <Element>activeNode : activeNode.parentElement;

    var element = activeElement;
    var activeElementPath = [];
    var validPath = false;
    if (element == this.contentElement) {
      validPath = true;
    } else {
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

    this._breadcrumbsElement.textContent = " > " + activeElementPath.map(e => this.resolveElementToStyle(e)).join(" > ");

    Array.prototype.forEach.call(this.contentElement.childNodes, (e: Node) => {
      if (e.nodeType == e.TEXT_NODE && (<Text>e).length > 0) {
        var p = this.contentDocument.createElement("p");
        e.parentNode.replaceChild(p, e);
        p.appendChild(e);
      }
      if (e.nodeType == e.ELEMENT_NODE && (<Element>e).nodeName.toLowerCase() == "br") {
        var p = this.contentDocument.createElement("p");
        e.parentNode.replaceChild(p, e);
        p.appendChild(e);
      }
    });
    if (this.contentElement.childElementCount == 0) {
      var p = this.contentDocument.createElement("p");
      p.appendChild(this.contentDocument.createElement("br"));
      this.contentElement.appendChild(p);
    }

    requestAnimationFrame(() => this.updateBreadcrumbs());
  }
  resolveElementToStyle(element: Element | Document) {
    return element.nodeName.toLowerCase();
  }
}
namespace Editor {
  export const namespaceURI = "https://mpdieckmann.github.io/editor";
  export const htmlNamespaceURI = "http://www.w3.org/1999/xhtml";
}
