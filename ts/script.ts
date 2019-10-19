// @ts-ignore
var Keyboard;
const loadScript = (function (keyboardLocation: string) {
  if (Keyboard && typeof Keyboard == "object" && typeof Keyboard.keyboardLocation == "string") {
    keyboardLocation = Keyboard.keyboardLocation;
  }
  if (document.currentScript && typeof document.currentScript == "object" && document.currentScript instanceof HTMLScriptElement) {
    var config = JSON.parse(document.currentScript.getAttribute("data-config"));
    if (config && typeof config == "object") {
      // @ts-ignore
      Keyboard = config;
      if (typeof config.keyboardLocation == "string") {
        keyboardLocation = config.keyboardLocation;
      }
    }
  }

  function loadScript(url: string) {
    if (!/^https?\:\/*|\/\//.test(url)) {
      if (/^\//.test(url)) {
        url = keyboardLocation + url;
      } else {
        url = keyboardLocation + "/js/" + url;
      }
    }
    var script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    document.body.appendChild(script);
  }
  if (typeof Promise != "function" || typeof Symbol != "function" || typeof Object.assign != "function") {
    loadScript("polyfill.js");
  } else {
    loadScript("keyboard.js");
  }
  return loadScript;
})("https://mpdieckmann.github.io/keyboard");
