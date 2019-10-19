/**
 * @private
 * @internal
 */
var Keyboard20180928Configuration: {
  keyboardLocation: string,
  keyboardNamespaceURI: string,
  htmlNamespaceURI: string,
  colors: Keyboard.Theme.Colors;
  layouts: string[],
  loadLazy: boolean,
  hidden: boolean,
  allowCustomLayouts: boolean
} = Object.assign({
  keyboardLocation: "https://mpdieckmann.github.io/keyboard",
  keyboardNamespaceURI: "https://mpdieckmann.github.io/keyboard",
  htmlNamespaceURI: "http://www.w3.org/1999/xhtml",
  colors: {},
  layouts: [
    "DEU-DE"
  ],
  loadLazy: true,
  hidden: true,
  allowCustomLayouts: true
}, (Keyboard && typeof Keyboard == "object") ? Keyboard : {});
Keyboard20180928Configuration.colors = Object.assign({
  color: "#fff",
  background: "#222",
  keyColor: "#fff",
  keyBackground: "#333",
  specialKeyColor: "#fff",
  specialKeyBackground: "#4d4d4d",
  keyHoldColor: "#fff",
  keyHoldBackground: "#088",
  keyPressColor: "#fff",
  keyPressBackground: "#08a",
  keyLockColor: "#fff",
  keyLockBackground: "#068",
  menuColor: "#fff",
  menuBackground: "#222",
  menuItemColor: "#fff",
  menuItemBackground: "#222",
  menuItemSeparatorColor: "#333",
  menuItemHoverColor: "#fff",
  menuItemHoverBackground: "#333",
  menuItemActiveColor: "#fff",
  menuItemActiveBackground: "#088",
  menuItemPressColor: "#fff",
  menuItemPressBackground: "#08a",
}, Keyboard20180928Configuration.colors);

// Keyboard
namespace Keyboard {
  export type version = "2018.10.01";
  export type Map<K extends string, T> = { [k in K]: T; }
  export type OptionalMap<K extends string, T> = { [k in K]?: T; }
  export type KeyboardCode = string
  export interface KeyboardConfiguration {
    code: KeyboardCode;
    imports?: string[],
    style?: string;
  }
  var activeKeyboard: KeyboardConfiguration = null;
  export function getActiveKeyboard(): KeyboardConfiguration {
    return activeKeyboard;
  }
  export function setActiveKeyboard(code: KeyboardCode) {
    if (activeKeyboard && activeKeyboard.code == code) {
      return Promise.resolve();
    }
    return Promise.resolve(loadKeyboard(code)).then(keyboard => {
      activeKeyboard = keyboard;
      UX.keyboardStyle.textContent = "";
      if (typeof keyboard.imports == "object" && typeof keyboard.imports.forEach == "function") {
        keyboard.imports.forEach(style => UX.keyboardStyle.textContent += '@import "' + style + '";');
      }
      if (typeof keyboard.style == "string") {
        UX.keyboardStyle.textContent += '@namespace "' + UX.keyboardNamespaceURI + '";' + keyboard.style;
      }
      UX.build();
      UX.element.removeAttribute("hidden");
      UX.updateSize();
    });
  }
  export const keyboardLocation = Keyboard20180928Configuration.keyboardLocation;
  const requestKeyboard: {
    [c in KeyboardCode]: {
      promise: Promise<KeyboardConfiguration>,
      resolve(data: KeyboardConfiguration | PromiseLike<KeyboardConfiguration>): void;
    }
  } = Object.create(null);
  export function loadKeyboard(code: KeyboardCode, keepVisibility: boolean = false): Promise<KeyboardConfiguration> {
    if (code in keyboards) {
      return Promise.resolve(keyboards[code]);
    }
    if (code in requestKeyboard) {
      return requestKeyboard[code].promise;
    }
    requestKeyboard[code] = {
      promise: null,
      resolve: null
    }
    var visibility = UX.isVisible();
    return requestKeyboard[code].promise = new Promise(resolve => {
      requestKeyboard[code].resolve = keyboard => {
        if (keepVisibility === true) {
          UX.toggle(visibility);
        }
        resolve(keyboard);
      };
      loadScript(resolveCodeToLayoutURL(code));
    });
  }
  export function loadKeyboards(layouts: string[], keepVisibility: boolean = false): Promise<KeyboardConfiguration[]> {
    return new Promise(resolve => {
      var length = layouts.length;
      var rslt = [];
      layouts.forEach(layout => {
        loadKeyboard(layout, keepVisibility).then(keyboard => {
          var index = rslt.indexOf(null);
          if (index == -1) {
            rslt.push(keyboard);
          } else {
            rslt.splice(index, 1, keyboard);
          }
          if (rslt.length == length) {
            resolve(rslt);
          }
        });
      });
      if (layouts.length == rslt.length) {
        resolve(rslt);
        UX.updateSize();
      } else {
        setTimeout(() => {
          Array(length - rslt.length).forEach(() => rslt.push(null));
          resolve(rslt);
          UX.updateSize();
        }, 10000);
      }
    });
  }
  export function lazyLoadKeyboards(layouts: string[], keepVisibility: boolean = false): Promise<KeyboardConfiguration[]> {
    return new Promise(resolve => {
      var length = layouts.length;
      var rslt = Array(length);
      (function loadLayout(index) {
        if (index < length) {
          var loadingNext = false;
          var timeout = setTimeout(() => {
            loadLayout(index + 1);
            loadingNext = true;
          }, 5000);
          loadKeyboard(layouts[index], keepVisibility).then(keyboard => {
            rslt[index] = keyboard;
            if (loadingNext == false) {
              clearTimeout(timeout);
              loadLayout(index + 1);
            }
          });
        } else {
          resolve(rslt);
          UX.updateSize();
        }
      })(0);
    });
  }
  export const keyboards: {
    [c in KeyboardCode]: KeyboardConfiguration;
  } = Object.create(null);
  export function defineKeyboard(keyboard: KeyboardConfiguration): void {
    const code = keyboard.code;
    if (code in keyboards) {
      throw "Cannot re-define a keyboard: " + code;
    }
    keyboards[code] = keyboard;
    if (activeKeyboard === null) {
      setActiveKeyboard(code);
    }
    if (code in requestKeyboard) {
      requestKeyboard[code].resolve(keyboard);
      delete requestKeyboard[code];
    }
  }
  export var resolveCodeToLayoutURL = (code: string): string => {
    return "layouts/" + code.toUpperCase() + ".js";
  };
  const scripts: {
    [u: string]: Promise<Event>;
  } = Object.create(null);
  export function loadScript(url: string): Promise<Event> {
    if (!/^https?\:\/*|\/\//.test(url)) {
      if (/^\//.test(url)) {
        url = keyboardLocation + url;
      } else {
        url = keyboardLocation + "/js/" + url;
      }
    }
    if (url in scripts) {
      return scripts[url];
    }
    let promise = new Promise<Event>(resolve => {
      let script = <HTMLScriptElement>document.createElementNS(UX.htmlNamespaceURI, "script");
      script.addEventListener("load", resolve);
      script.src = url;
      script.type = "text/javascript";
      UX.defs.appendChild(script);
    });
    scripts[url] = promise;
    return promise;
  }
  export function showSettingsMenu() {
    let langs: Menu.LangList = [];
    Object.getOwnPropertyNames(keyboards).forEach(code => {
      langs.push({
        name: keyboards[code].name,
        code: keyboards[code].code,
        desc: keyboards[code].description,
        active: activeKeyboard === keyboards[code]
      });
    });
    Menu.createMenu(langs);
  }
}

// Keyboard.UX
interface Keyboard extends Keyboard.ModifierFlags { }
namespace Keyboard {
  export type DefineKey = string;
  export type BuildKey = string;
  export type KeyMap = OptionalMap<BuildKey, string | {
    /** @property label */
    0: string;
    /** @property key */
    1: string;
  }>;
  export type KeyCode = string;
  export type LayoutCode = string;
  export type KeyLock = "none" | "temporary" | "persistent";
  export interface KeyboardConfiguration {
    keyMap: KeyMap;
    keyMaps?: Map<string, KeyMap>;
    layout: DefineKey[];
    layouts?: Map<string, DefineKey[]>;
    buildKey?(this: KeyboardConfiguration, defineKey: DefineKey, keyMap: KeyMap): false | Element;
    updateKey?(this: KeyboardConfiguration, defineKey: DefineKey, keyMap: KeyMap): boolean;
    getLayout?(this: KeyboardConfiguration): false | DefineKey[];
    getKeyMap?(this: KeyboardConfiguration): false | KeyMap;
    setModifiers?(this: KeyboardConfiguration, modifiers: number): false | number;
    getModifiers?(this: KeyboardConfiguration): false | number;
    modifiers?: number;
  }
  export interface ModifierFlags {
    readonly MODIFIER_SHIFT: 1;
    readonly MODIFIER_CTRL: 2;
    readonly MODIFIER_ALT: 4;
    readonly MODIFIER_META: 8;
    readonly MODIFIER_SHIFT_LOCK: 16;
    readonly MODIFIER_CTRL_LOCK: 32;
    readonly MODIFIER_ALT_LOCK: 64;
    readonly MODIFIER_META_LOCK: 128;
  }
  export const MODIFIER_SHIFT = 1;
  export const MODIFIER_CTRL = 2;
  export const MODIFIER_ALT = 4;
  export const MODIFIER_META = 8;
  export const MODIFIER_SHIFT_LOCK = 16;
  export const MODIFIER_CTRL_LOCK = 32;
  export const MODIFIER_ALT_LOCK = 64;
  export const MODIFIER_META_LOCK = 128;
  export function hasFlag(flag1: number, flag2: number): number {
    return flag1 & flag2;
  }
  export function combineFlag(flag1: number, flag2: number): number {
    return flag1 | flag2;
  }
  export function removeFlag(flag1: number, flag2: number): number {
    return flag1 & ~flag2;
  }
  export function toggleFlag(flag1: number, flag2: number, force?: boolean) {
    if (force === true) {
      return combineFlag(flag1, flag2);
    } else if (force === false || hasFlag(flag1, flag2)) {
      return removeFlag(flag1, flag2);
    } else {
      return combineFlag(flag1, flag2);
    }
  }
}
namespace Keyboard.UX {
  export type version = "2018.10.01";
  export const keyboardNamespaceURI = Keyboard20180928Configuration.keyboardNamespaceURI;
  export const htmlNamespaceURI = Keyboard20180928Configuration.htmlNamespaceURI;
  export const element = <Element>document.createElementNS(keyboardNamespaceURI, "keyboard");
  element.setAttribute("hidden", "");

  export function updateSize() {
    var keyboardHeight = UX.element.getBoundingClientRect().height;
    document.documentElement && (document.documentElement.style.overflow = "auto");
    document.documentElement && (document.documentElement.style.maxHeight = (window.innerHeight - keyboardHeight) + "px");
    document.body && (document.body.style.overflow = "auto");
    document.body && (document.body.style.maxHeight = (window.innerHeight - keyboardHeight) + "px");
  }

  window.addEventListener("resize", updateSize);
  document.body.appendChild(element);
  export const defs = <Element>document.createElementNS(keyboardNamespaceURI, "defs");
  element.appendChild(defs);
  const keys = <Element>document.createElementNS(keyboardNamespaceURI, "keys");
  element.appendChild(keys);
  export const style = <HTMLStyleElement>document.createElementNS(htmlNamespaceURI, "style");
  style.textContent = '@import "https://fonts.googleapis.com/css?family=Noto+Sans";' +
    '@namespace "' + keyboardNamespaceURI + '";' +
    '@namespace html "' + htmlNamespaceURI + '";' +
    'keyboard{z-index:99999;position:fixed;left:0;right:0;bottom:0;font:20px/3em "Noto Sans",Calibri,Roboto,Arial,sans-serif;cursor:default;user-select:none;}' +
    'keyboard[hidden]{display:block!important;right:auto;padding:0.25em 0;font:16px/1.08 sans-serif;box-shadow:0 0 0.5em 0#000;}' +
    'keyboard[hidden]>keys{display:none;}' +
    'keyboard>menuitem{display:none!important;}' +
    'keyboard>menuitem>desc{display:none;}' +
    'keyboard[hidden]>menuitem{display:block!important;}' +
    'keyboard>menuitem:hover>desc{display:inline-block;}' +
    'defs{z-index:99999;width:0;height:0;position:absolute;top:0;left:0;}' +
    'keys{z-index:99998;display:grid;grid-template-columns:repeat(20,1fr);grid-template-rows:repeat(5,1fr);grid-gap:2px;margin:0 auto;max-width:900px;}' +
    'key{z-index:99998;display:inline-block;text-align:center;grid-column-start:auto;grid-column-end:span 2;}' +
    'key[width="1"]{grid-column-end:span 1}' +
    'key[width="2"]{grid-column-end:span 2}' +
    'key[width="3"]{grid-column-end:span 3}' +
    'key[width="4"]{grid-column-end:span 4}' +
    'key[width="5"]{grid-column-end:span 5}' +
    'key[width="6"]{grid-column-end:span 6}' +
    'key[width="7"]{grid-column-end:span 7}' +
    'key[width="8"]{grid-column-end:span 8}' +
    'key[width="9"]{grid-column-end:span 9}' +
    'key[width="10"]{grid-column-end:span 10}' +
    'key[width="11"]{grid-column-end:span 11}' +
    'key[width="12"]{grid-column-end:span 12}' +
    'key[width="13"]{grid-column-end:span 13}' +
    'key[width="14"]{grid-column-end:span 14}' +
    'key[width="15"]{grid-column-end:span 15}' +
    'key[width="16"]{grid-column-end:span 16}' +
    'key[width="17"]{grid-column-end:span 17}' +
    'key[width="18"]{grid-column-end:span 18}' +
    'key[width="19"]{grid-column-end:span 19}' +
    'key[width="20"]{grid-column-end:span 20}' +
    'key[disabled]{opacity:0.5;}' +
    'span{display:inline-block;grid-column-start:auto;grid-column-end:span 1;}' +
    '@media(max-width:450px){key[long]{font-size:13px;}key[down]{/*box-shadow:0 0 0.5em#000;position:relative;font-size:1.5em;margin-top:-175%;width:150%;margin-left:-25%;z-index:99999;*/}}' +
    '@media(max-width:350px){key[long]{font-size:10px;}}' +
    '@media(max-height:450px){keyboard{line-height:2.5em;}}' +
    '@media(max-height:350px){keyboard{line-height:2em;}}' +
    '@media print{keyboard{display:none!important;}html|html,html|body{max-height:auto!important;overflow:initial!important;margin-bottom:initial!important;}}';
  defs.appendChild(style);
  export const keyboardStyle = <HTMLStyleElement>document.createElementNS(htmlNamespaceURI, "style");
  defs.appendChild(keyboardStyle);
  export type DefaultKeys = "Alt" | "AltLeft" | "AltRight" | "Backspace" | "Control" | "ControlLeft" | "ControlRight" | "Enter" | "Language" | "Meta" | "MetaLeft" | "MetaRight" | "Shift" | "ShiftLeft" | "ShiftRight" | "Space";
  const _keyMap: Map<KeyCode, Element> = Object.create(null);
  const _spans: Element[] = [];
  var buildMode: boolean = false;
  var activeLayout: DefineKey[] = null;
  export function build(): void {
    while (keys.firstChild) {
      keys.removeChild(keys.firstChild);
    }
    buildMode = true;
    activeLayout = getLayout();
    var keyMap = getKeyMap();
    spanIndex = 0;
    activeLayout.forEach(defineKey => (buildMode = true) && keys.appendChild(_buildKey(defineKey, keyMap)));
    buildMode = false;
  }
  var updateMode: boolean = false;
  export function update(): void {
    updateMode = true;
    var keyMap = getKeyMap();
    activeLayout.forEach(defineKey => _updateKey(defineKey, keyMap));
    updateMode = false;
  }
  function _updateKey(defineKey: DefineKey, keyMap: KeyMap): boolean {
    let keyboard = getActiveKeyboard();
    if (typeof keyboard.updateKey == "function") {
      let key = keyboard.updateKey(defineKey, keyMap);
      if (key) {
        return key;
      }
    }
    return updateKey(defineKey, keyMap);
  }
  export function updateKey(defineKey: DefineKey, keyMap: KeyMap): boolean {
    if (!updateMode) {
      throw "Only callable in BuildMode";
    }
    if (defineKey === null) {
      return true;
    }
    let result = /^(#?)([a-z0-9]+)(?:\:([0-9]+))?$/i.exec(defineKey);
    if (result == null) {
      throw "Cannot parse defineKey: " + defineKey;
    }
    let code = result[2];
    let key = getKey(code);
    let value = keyMap[code];
    if (!value) {
      key.textContent = "";
      key.setAttribute("key", "");
      key.setAttribute("disabled", "");
    } else if (typeof value == "string") {
      key.textContent = value;
      key.setAttribute("key", value);
      key.removeAttribute("disabled");
    } else {
      key.textContent = value[0];
      key.setAttribute("key", value[1] || value[0]);
      key.removeAttribute("disabled");
    }
    if (key.textContent.length > 2) {
      key.setAttribute("long", "");
    } else {
      key.removeAttribute("long");
    }
    switch (key.getAttribute("key")) {
      case "Shift":
        if (hasFlag(getModifiers(), MODIFIER_SHIFT) == MODIFIER_SHIFT) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_SHIFT_LOCK) == MODIFIER_SHIFT_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Control":
        if (hasFlag(getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_CTRL_LOCK) == MODIFIER_CTRL_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Alt":
        if (hasFlag(getModifiers(), MODIFIER_ALT) == MODIFIER_ALT) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_ALT_LOCK) == MODIFIER_ALT_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Meta":
        if (hasFlag(getModifiers(), MODIFIER_META) == MODIFIER_META) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_META_LOCK) == MODIFIER_META_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
    }
    return true;
  }
  function _buildKey(defineKey: DefineKey, keyMap: KeyMap): Element {
    let keyboard = getActiveKeyboard();
    if (typeof keyboard.buildKey == "function") {
      let key = keyboard.buildKey(defineKey, keyMap);
      if (key) {
        return key;
      }
    }
    return buildKey(defineKey, keyMap);
  }
  export function buildKey(defineKey: DefineKey, keyMap: KeyMap) {
    if (!buildMode) {
      throw "Only callable in BuildMode";
    }
    if (defineKey === null) {
      return getSpan();
    }
    let result = /^(#?)([a-z0-9]+)(?:\:([0-9]+))?$/i.exec(defineKey);
    if (result == null) {
      throw "Cannot parse defineKey: " + defineKey;
    }
    let code = result[2];
    let width = parseInt(result[3] || "2");
    let key = getKey(code, width);
    let special = result[1] == "#";
    if (special) {
      key.setAttribute("special", "");
    } else {
      key.removeAttribute("special");
    }
    let value = keyMap[code];
    if (!value) {
      key.textContent = "";
      key.setAttribute("key", "");
      key.setAttribute("disabled", "");
    } else if (typeof value == "string") {
      key.textContent = value;
      key.setAttribute("key", value);
      key.removeAttribute("disabled");
    } else {
      key.textContent = value[0];
      key.setAttribute("key", value[1] || value[0]);
      key.removeAttribute("disabled");
    }
    if (key.textContent.length > 2) {
      key.setAttribute("long", "");
    } else {
      key.removeAttribute("long");
    }
    switch (key.getAttribute("key")) {
      case "Shift":
        if (hasFlag(getModifiers(), MODIFIER_SHIFT) == MODIFIER_SHIFT) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_SHIFT_LOCK) == MODIFIER_SHIFT_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Control":
        if (hasFlag(getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_CTRL_LOCK) == MODIFIER_CTRL_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Alt":
        if (hasFlag(getModifiers(), MODIFIER_ALT) == MODIFIER_ALT) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_ALT_LOCK) == MODIFIER_ALT_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
      case "Meta":
        if (hasFlag(getModifiers(), MODIFIER_META) == MODIFIER_META) {
          key.setAttribute("lock", hasFlag(getModifiers(), MODIFIER_META_LOCK) == MODIFIER_META_LOCK ? <KeyLock>"persistent" : <KeyLock>"temporary");
        } else {
          key.removeAttribute("lock");
        }
        break;
    }
    return key;
  }
  export var spanIndex: number = 0;
  export function getSpan(width: number = 1): Element {
    if (!buildMode) {
      throw "Only callable in BuildMode";
    }
    let span: Element;
    if (spanIndex < _spans.length) {
      span = _spans[spanIndex++];
    } else {
      span = <Element>document.createElementNS(keyboardNamespaceURI, "span");
      _spans.push(span);
      spanIndex++;
    }
    span.setAttribute("width", width.toString());
    return span;
  }
  export function getKey(code: KeyCode, width: number = 2, lock: KeyLock = "none"): Element {
    let key: Element;
    if (code in _keyMap) {
      key = _keyMap[code];
    } else {
      key = <Element>document.createElementNS(keyboardNamespaceURI, "key");
      key.setAttribute("code", code);
      _keyMap[code] = key;
    }
    if (buildMode) {
      key.setAttribute("width", width.toString());
      if (lock == "none") {
        key.removeAttribute("lock");
      } else {
        key.setAttribute("lock", lock);
      }
    }
    return key;
  }
  export function getKeysInKeyMap(key: string): Element[] {
    var keyMap = getKeyMap();
    return Object.getOwnPropertyNames(keyMap).filter(code => {
      if (typeof keyMap[code] == "string") {
        if (keyMap[code] == key) {
          return true;
        }
      } else {
        if (keyMap[code] && keyMap[code][1] == key) {
          return true;
        }
      }
      return false;
    }).map(code => getKey(code));
  }
  export function getLayout(): DefineKey[] {
    if (!buildMode) {
      throw "Only callable in BuildMode";
    }
    let keyboard = getActiveKeyboard();
    if (typeof keyboard.getLayout == "function") {
      let layout = keyboard.getLayout();
      if (layout) {
        return layout;
      }
    }
    return keyboard.layout;
  }
  export function getKeyMap(): KeyMap {
    let keyboard = getActiveKeyboard();
    if (typeof keyboard.getKeyMap == "function") {
      let keyMap = keyboard.getKeyMap();
      if (keyMap) {
        return keyMap;
      }
    }
    return keyboard.keyMap;
  }
  export function getKeyLock(code: KeyCode) {
    if (code in _keyMap) {
      let key = _keyMap[code];
      let lock = <KeyLock>key.getAttribute("lock");
      if (lock !== null) {
        return lock;
      }
    }
    return "none";
  }
  export function getBuildMode(): boolean {
    return buildMode;
  }
  export function isVisible(): boolean {
    return !element.hasAttribute("hidden");
  }
  export function hide(): void {
    UX.element.setAttribute("hidden", "");
    updateSize();
  }
  export function show(): void {
    if (getActiveKeyboard()) {
      UX.element.removeAttribute("hidden");
      updateSize();
    } else {
      showSettingsMenu();
    }
  }
  export function toggle(force?: boolean): boolean {
    if (force === false) {
      hide();
      return false;
    } else if (force === true || element.hasAttribute("hidden")) {
      show();
      return true;
    } else {
      hide();
      return false;
    }
  }
  export function getModifiers(): number {
    let keyboard = getActiveKeyboard();
    if (keyboard) {
      if (typeof keyboard.getModifiers == "function") {
        let modifiers = keyboard.getModifiers();
        if (modifiers !== false) {
          return modifiers;
        }
      }
      if (typeof keyboard.modifiers != "number") {
        keyboard.modifiers = 0;
      }
      return keyboard.modifiers;
    }
    return null;
  }
  export function setModifiers(modifiers: number): number {
    let keyboard = getActiveKeyboard();
    if (typeof modifiers == "number" && keyboard && keyboard.modifiers != modifiers) {
      if (typeof keyboard.setModifiers == "function") {
        let result = keyboard.setModifiers(modifiers);
        if (result !== false) {
          return result;
        }
      }
      keyboard.modifiers = modifiers;
    }
    return keyboard.modifiers;
  }
}

// Keyboard.Theme
namespace Keyboard { }
namespace Keyboard.Theme {
  export const version = "2018.10.01";
  export const element = <HTMLStyleElement>document.createElementNS(UX.htmlNamespaceURI, "style");
  export interface Colors {
    color: string;
    background: string;
    keyColor: string;
    keyBackground: string;
    specialKeyColor: string;
    specialKeyBackground: string;
    keyHoldColor: string;
    keyHoldBackground: string;
    keyPressColor: string;
    keyPressBackground: string;
    keyLockColor: string;
    keyLockBackground: string;
    menuColor: string;
    menuBackground: string;
    menuItemColor: string;
    menuItemSeparatorColor: string;
    menuItemBackground: string;
    menuItemHoverColor: string;
    menuItemHoverBackground: string;
    menuItemActiveColor: string;
    menuItemActiveBackground: string;
    menuItemPressColor: string;
    menuItemPressBackground: string;
  }
  const colorRegexp = /^\#[0-9a-f]{3}|\#[0-9a-f]{6}$/;
  function fallbackColor(color: string, fallback: string) {
    if (colorRegexp.test(color)) {
      return color;
    }
    return fallback;
  }

  export function apply(colors: Colors) {
    let color = fallbackColor(colors.color, "#fff");
    let background = fallbackColor(colors.background, "#222");
    let keyColor = fallbackColor(colors.keyColor, "#fff");
    let keyBackground = fallbackColor(colors.keyBackground, "#333");
    let specialKeyColor = fallbackColor(colors.specialKeyColor, keyColor);
    let specialKeyBackground = fallbackColor(colors.specialKeyBackground, keyBackground);
    let keyPressColor = fallbackColor(colors.keyPressColor, keyColor);
    let keyPressBackground = fallbackColor(colors.keyPressBackground, keyBackground);
    let keyHoldColor = fallbackColor(colors.keyHoldColor, keyPressColor);
    let keyHoldBackground = fallbackColor(colors.keyHoldBackground, keyPressBackground);
    let keyLockColor = fallbackColor(colors.keyLockColor, keyHoldColor);
    let keyLockBackground = fallbackColor(colors.keyLockBackground, keyHoldBackground);
    let menuColor = fallbackColor(colors.menuColor, color);
    let menuBackground = fallbackColor(colors.menuBackground, background);
    let menuItemColor = fallbackColor(colors.menuItemColor, menuColor);
    let menuItemBackground = fallbackColor(colors.menuItemBackground, menuBackground);
    let menuItemSeparatorColor = fallbackColor(colors.menuItemSeparatorColor, menuItemColor);
    let menuItemHoverColor = fallbackColor(colors.menuItemHoverColor, menuItemColor);
    let menuItemHoverBackground = fallbackColor(colors.menuItemHoverBackground, menuItemBackground);
    let menuItemPressColor = fallbackColor(colors.menuItemPressColor, menuItemHoverColor);
    let menuItemPressBackground = fallbackColor(colors.menuItemPressBackground, menuItemHoverBackground);
    let menuItemActiveColor = fallbackColor(colors.menuItemActiveColor, menuItemPressColor);
    let menuItemActiveBackground = fallbackColor(colors.menuItemActiveBackground, menuItemPressBackground);

    element.textContent = '@namespace "' + UX.keyboardNamespaceURI + '";' +
      '@namespace html "' + UX.htmlNamespaceURI + '";' +
      'keyboard{color:' + color + ';background:' + background + '}' +
      'key{color:' + keyColor + ';background:' + keyBackground + ';}' +
      'key[special]{color:' + specialKeyColor + ';background:' + specialKeyBackground + ';}' +
      'key[lock="temporary"]{color:' + keyHoldColor + ';background:' + keyHoldBackground + ';}' +
      'key[down]{color:' + keyPressColor + ';background:' + keyPressBackground + ';}' +
      'key[lock="persistent"]{color:' + keyLockColor + ';background:' + keyLockBackground + ';}' +
      'html|menu{color:' + menuColor + ';background:' + menuBackground + ';}' +
      'menuitem{color:' + menuItemColor + ';background:' + menuItemBackground + ';}' +
      'hr{background:' + menuItemSeparatorColor + ';}' +
      'menuitem:hover{color:' + menuItemHoverColor + ';background:' + menuItemHoverBackground + ';}' +
      'menuitem[class*="active"]{color:' + menuItemActiveColor + ';background:' + menuItemActiveBackground + ';}' +
      'menuitem:active,menuitem[class*="down"]{color:' + menuItemPressColor + ';background:' + menuItemPressBackground + ';}';
  }

  apply(Keyboard20180928Configuration.colors);
  UX.defs.appendChild(element);
}

// Keyboard.EventManager
interface Keyboard extends Keyboard.EventPhases, Keyboard.EventTypes { }
namespace Keyboard {
  export interface EventTypes {
    readonly TYPE_MOUSE: "mouse";
    readonly TYPE_POINTER: "pointer";
    readonly TYPE_TOUCH: "touch";
  }
  export type EventType = EventTypes[keyof EventTypes];
  export type KeyBinding = {
    key: string | RegExp;
    phases: number;
    exec(this: KeyBinding, event: EventManager.KeyBindingEvent): void;
  }
  export interface KeyboardConfiguration {
    keyBindings?: KeyBinding[];
  }
  export interface EventPhases {
    readonly PHASE_DOWN: 1;
    readonly PHASE_HOLD: 2;
    readonly PHASE_UP: 4;
  }
  export type EventPhase = EventPhases[keyof EventPhases];
  export const PHASE_DOWN = 1;
  export const PHASE_HOLD = 2;
  export const PHASE_UP = 4;
  export const TYPE_TOUCH = "touch";
  export const TYPE_POINTER = "pointer";
  export const TYPE_MOUSE = "mouse";
  export const keyBindings: KeyBinding[] = [{
    key: "Alt",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (event.phase === PHASE_DOWN) {
        UX.setModifiers(removeFlag(toggleFlag(UX.getModifiers(), MODIFIER_ALT), MODIFIER_ALT_LOCK));
        UX.update();
      }
      if (event.phase === PHASE_HOLD && hasFlag(UX.getModifiers(), MODIFIER_ALT) == MODIFIER_ALT) {
        UX.setModifiers(UX.getModifiers() | MODIFIER_ALT_LOCK);
        UX.update();
      }
      event.preventDefault();
      event.setCommandArgs(null);
    }
  }, {
    key: "Backspace",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      event.setCommandArgs("delete", false, "");
    }
  }, {
    key: "Control",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (event.phase === PHASE_DOWN) {
        UX.setModifiers(removeFlag(toggleFlag(UX.getModifiers(), MODIFIER_CTRL), MODIFIER_CTRL_LOCK));
        UX.update();
      }
      if (event.phase === PHASE_HOLD && hasFlag(UX.getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL) {
        UX.setModifiers(UX.getModifiers() | MODIFIER_CTRL_LOCK);
        UX.update();
      }
      event.preventDefault();
      event.setCommandArgs(null);
    }
  }, {
    key: "Enter",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      event.setCommandArgs("insertText", false, "\n");
    }
  }, {
    key: "Language",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (event.phase == PHASE_DOWN) {
        showSettingsMenu();
      }
      event.preventDefault();
      event.setCommandArgs(null);
    }
  }, {
    key: "Meta",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (event.phase === PHASE_DOWN) {
        UX.setModifiers(removeFlag(toggleFlag(UX.getModifiers(), MODIFIER_META), MODIFIER_META_LOCK));
        UX.update();
      }
      if (event.phase === PHASE_HOLD && hasFlag(UX.getModifiers(), MODIFIER_META) == MODIFIER_META) {
        UX.setModifiers(UX.getModifiers() | MODIFIER_META_LOCK);
        UX.update();
      }
      event.preventDefault();
      event.setCommandArgs(null);
    }
  }, {
    key: "Shift",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (event.phase === PHASE_DOWN) {
        UX.setModifiers(removeFlag(toggleFlag(UX.getModifiers(), MODIFIER_SHIFT), MODIFIER_SHIFT_LOCK));
        UX.update();
      }
      if (event.phase === PHASE_HOLD && hasFlag(UX.getModifiers(), MODIFIER_SHIFT) == MODIFIER_SHIFT) {
        UX.setModifiers(UX.getModifiers() | MODIFIER_SHIFT_LOCK);
        UX.update();
      }
      event.preventDefault();
      event.setCommandArgs(null);
    }
  }, {
    key: "Space",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      event.setCommandArgs("insertText", false, " ");
    }
  }, {
    key: /.*/,
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (hasFlag(UX.getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL && hasFlag(UX.getModifiers(), MODIFIER_ALT) != MODIFIER_ALT && hasFlag(UX.getModifiers(), MODIFIER_META) != MODIFIER_META) {
        event.setCommandArgs(null);
      }
      if (hasFlag(UX.getModifiers(), MODIFIER_CTRL) != MODIFIER_CTRL && hasFlag(UX.getModifiers(), MODIFIER_ALT) == MODIFIER_ALT && hasFlag(UX.getModifiers(), MODIFIER_META) != MODIFIER_META) {
        event.setCommandArgs(null);
      }
      if (hasFlag(UX.getModifiers(), MODIFIER_CTRL) != MODIFIER_CTRL && hasFlag(UX.getModifiers(), MODIFIER_ALT) != MODIFIER_ALT && hasFlag(UX.getModifiers(), MODIFIER_META) == MODIFIER_META) {
        event.setCommandArgs(null);
      }
    }
  }, {
    key: /.*/,
    phases: PHASE_UP,
    exec(event) {
      if (!/Shift|Control|Alt|Meta/.test(event.key)) {
        if (hasFlag(UX.getModifiers(), MODIFIER_SHIFT | MODIFIER_SHIFT_LOCK) != (MODIFIER_SHIFT | MODIFIER_SHIFT_LOCK)) {
          UX.setModifiers(removeFlag(UX.getModifiers(), MODIFIER_SHIFT | MODIFIER_SHIFT_LOCK));
          UX.update();
        }
        if (hasFlag(UX.getModifiers(), MODIFIER_CTRL | MODIFIER_CTRL_LOCK) != (MODIFIER_CTRL | MODIFIER_CTRL_LOCK)) {
          UX.setModifiers(removeFlag(UX.getModifiers(), MODIFIER_CTRL | MODIFIER_CTRL_LOCK));
          UX.update();
        }
        if (hasFlag(UX.getModifiers(), MODIFIER_ALT | MODIFIER_ALT_LOCK) != (MODIFIER_ALT | MODIFIER_ALT_LOCK)) {
          UX.setModifiers(removeFlag(UX.getModifiers(), MODIFIER_ALT | MODIFIER_ALT_LOCK));
          UX.update();
        }
        if (hasFlag(UX.getModifiers(), MODIFIER_META | MODIFIER_META_LOCK) != (MODIFIER_META | MODIFIER_META_LOCK)) {
          UX.setModifiers(removeFlag(UX.getModifiers(), MODIFIER_META | MODIFIER_META_LOCK));
          UX.update();
        }
      }
    }
  }, {
    key: "a",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("selectAll");
      }
    }
  }, {
    key: "c",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("copy");
      }
    }
  }, {
    key: "v",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("paste");
      }
    }
  }, {
    key: "x",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("cut");
      }
    }
  }, {
    key: "z",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("undo");
      }
    }
  }, {
    key: "y",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("redo");
      }
    }
  }, {
    key: "b",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("bold");
      }
    }
  }, {
    key: "i",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("italic");
      }
    }
  }, {
    key: "u",
    phases: PHASE_DOWN | PHASE_HOLD,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        event.setCommandArgs("underline");
      }
    }
  }, {
    key: "p",
    phases: PHASE_DOWN,
    exec(event) {
      if (UX.getModifiers() === MODIFIER_CTRL || UX.getModifiers() === MODIFIER_CTRL_LOCK || UX.getModifiers() === combineFlag(MODIFIER_CTRL, MODIFIER_CTRL_LOCK)) {
        print();
      }
    }
  }];
  export function addCommand(key: BuildKey, phases: EventPhase, exec: (event: EventManager.KeyBindingEvent) => void): number {
    return keyBindings.push({
      key,
      phases,
      exec
    });
  }
}
namespace Keyboard.EventManager {
  export type version = "2018.10.01";
  export class KeyBindingEvent implements EventPhases, EventTypes {
    constructor(private readonly _internal: KeyBindingEventInit) { }
    readonly code: BuildKey = this._internal.code;
    readonly key: string = this._internal.key;
    readonly phase: EventPhase = this._internal.phase;
    readonly type: EventType = this._internal.type;
    readonly target: KeyboardConfiguration = this._internal.target;
    setCommandArgs(commandId: string = null, showUI: boolean = false, value: string = "") {
      if (commandId === null) {
        this._internal.commandArgs = null;
      } else {
        this._internal.commandArgs = [commandId, showUI, value];
      }
    }
    stopPropagation() {
      this._internal.propagationStopped = true;
    }
    preventDefault() {
      this._internal.defaultPrevented = true;
    }
    static readonly PHASE_DOWN = PHASE_DOWN;
    static readonly PHASE_HOLD = PHASE_HOLD;
    static readonly PHASE_UP = PHASE_UP;
    static readonly TYPE_MOUSE = TYPE_MOUSE;
    static readonly TYPE_POINTER = TYPE_POINTER;
    static readonly TYPE_TOUCH = TYPE_TOUCH;
    // @ts-ignore
    readonly [Symbol.toStringTag]: "KeyBindingEvent";
  }
  export interface KeyBindingEvent extends EventPhases, EventTypes { }
  Object.assign<KeyBindingEvent, EventPhases & EventTypes>(KeyBindingEvent.prototype, {
    PHASE_DOWN: PHASE_DOWN,
    PHASE_HOLD: PHASE_HOLD,
    PHASE_UP: PHASE_UP,
    TYPE_MOUSE: TYPE_MOUSE,
    TYPE_POINTER: TYPE_POINTER,
    TYPE_TOUCH: TYPE_TOUCH
  });
  export interface KeyBindingEventInit {
    code: BuildKey;
    key: string;
    phase: EventPhase;
    type: EventType;
    target: KeyboardConfiguration;
    commandArgs: [
      /** @property commandId */
      string,
      /** @property showUI */
      boolean,
      /** @property value */
      string
    ];
    propagationStopped: boolean;
    defaultPrevented: boolean;
  }
  function executeEvent(phase: EventPhase): void {
    var keyboard = getActiveKeyboard();
    var internal: KeyBindingEventInit = {
      code: active.key.getAttribute("code"),
      key: active.key.getAttribute("key"),
      phase: phase,
      target: keyboard,
      type: active.type,
      commandArgs: ["insertText", false, active.key.getAttribute("key")],
      propagationStopped: false,
      defaultPrevented: false
    };
    // fire keydown!
    var keyDownEvent = new KeyboardEvent(phase == PHASE_DOWN || phase == PHASE_HOLD ? "keydown" : "keyup", {
      altKey: hasFlag(UX.getModifiers(), MODIFIER_ALT) == MODIFIER_ALT || hasFlag(UX.getModifiers(), MODIFIER_ALT_LOCK) == MODIFIER_ALT_LOCK,
      bubbles: true,
      key: internal.key,
      cancelable: true,
      code: internal.code,
      ctrlKey: hasFlag(UX.getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL || hasFlag(UX.getModifiers(), MODIFIER_CTRL_LOCK) == MODIFIER_CTRL_LOCK,
      metaKey: hasFlag(UX.getModifiers(), MODIFIER_META) == MODIFIER_META || hasFlag(UX.getModifiers(), MODIFIER_META_LOCK) == MODIFIER_META_LOCK,
      repeat: phase == PHASE_HOLD,
      shiftKey: hasFlag(UX.getModifiers(), MODIFIER_SHIFT) == MODIFIER_SHIFT || hasFlag(UX.getModifiers(), MODIFIER_SHIFT_LOCK) == MODIFIER_SHIFT_LOCK
    });
    if (!Cursor.activeElement.dispatchEvent(keyDownEvent)) {
      return;
    }
    var keyBindingEvent: KeyBindingEvent = new KeyBindingEvent(internal);
    keyboard.keyBindings && keyboard.keyBindings.forEach(keyBinding => {
      if (hasFlag(keyBinding.phases, phase) && (typeof keyBinding.key == "string" ? keyBinding.key == keyBindingEvent.key : keyBinding.key.test(keyBindingEvent.key))) {
        keyBinding.exec(keyBindingEvent);
      }
    });
    if (internal.propagationStopped === false) {
      keyBindings.forEach(keyBinding => {
        if (hasFlag(keyBinding.phases, phase) && (typeof keyBinding.key == "string" ? keyBinding.key == keyBindingEvent.key : keyBinding.key.test(keyBindingEvent.key))) {
          keyBinding.exec(keyBindingEvent);
        }
      });
    }
    if (phase == PHASE_UP) {
      return;
    }
    if (!internal.defaultPrevented) {
      // fire keypress!
      var keyPressEvent = new KeyboardEvent("keypress", {
        altKey: hasFlag(UX.getModifiers(), MODIFIER_ALT) == MODIFIER_ALT,
        bubbles: true,
        key: keyBindingEvent.key,
        cancelable: true,
        code: keyBindingEvent.code,
        ctrlKey: hasFlag(UX.getModifiers(), MODIFIER_CTRL) == MODIFIER_CTRL,
        metaKey: hasFlag(UX.getModifiers(), MODIFIER_META) == MODIFIER_META,
        repeat: phase == PHASE_HOLD,
        shiftKey: hasFlag(UX.getModifiers(), MODIFIER_SHIFT) == MODIFIER_SHIFT
      });
      if (!Cursor.activeElement.dispatchEvent(keyPressEvent)) {
        return;
      }
    }
    if (internal.commandArgs === null) {
      return;
    }
    Cursor.activeDocument.execCommand.apply(Cursor.activeDocument, internal.commandArgs);
    Cursor.pauseBlinkCursor();
  }
  const active: {
    key: Element;
    type: EventType;
    interval: number;
    timeout: number;
  } = {
    key: null,
    type: null,
    interval: null,
    timeout: null
  };
  function down(event): void {
    let key = toKey(event.target);
    let type = toEventTypeGroup(event);
    if (key && type) {
      if (active.key || active.type) {
        up();
      }
      active.key = key;
      active.type = type;
      active.key.setAttribute("down", "");
      executeEvent(PHASE_DOWN);
      active.timeout = setTimeout(() => {
        active.interval = setInterval(hold, 50);
      }, 300);
    }
  }
  function hold(): void {
    if (active.key && active.type) {
      executeEvent(PHASE_HOLD);
    } else {
      up();
    }
  }
  function up(): void {
    if (active.key && active.type) {
      executeEvent(PHASE_UP);
    }
    active.key && active.key.removeAttribute("down");
    active.key = null;
    active.type = null;
    if (typeof active.timeout == "number") {
      clearTimeout(active.timeout);
    }
    active.timeout = null;
    if (typeof active.interval == "number") {
      clearInterval(active.interval);
    }
    active.interval = null;
  }
  function elementDown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    down(event);
  }
  function elementUp(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    up();
  }

  UX.element.addEventListener("mousedown", elementDown);
  UX.element.addEventListener("touchstart", elementDown);
  // UX.element.addEventListener("pointerdown", elementDown);

  UX.element.addEventListener("mouseup", elementUp);
  UX.element.addEventListener("touchcancel", elementUp);
  UX.element.addEventListener("touchend", elementUp);
  // UX.element.addEventListener("pointercancel", elementUp);
  // UX.element.addEventListener("pointerup", elementUp);

  window.addEventListener("mouseup", up);
  window.addEventListener("touchcancel", up);
  window.addEventListener("touchend", up);
  // window.addEventListener("pointercancel", up);
  // window.addEventListener("pointerup", up);
  window.addEventListener("blur", up);

  function toKey(target: Element): Element | null {
    while (target && target.parentElement && !isKey(target)) {
      target = target.parentElement;
    }
    if (isKey(target)) {
      return target;
    }
    return null;
  }
  function isKey(target: Element) {
    return target.nodeType == target.ELEMENT_NODE && target.namespaceURI == UX.keyboardNamespaceURI && target.nodeName == "key";
  }
  function toEventTypeGroup(event: Event): EventType | null {
    if (/mouse/.test(event.type)) {
      return "mouse";
    } else if (/touch/.test(event.type)) {
      return "touch";
    } else if (/pointer/.test(event.type)) {
      return "pointer";
    } else {
      return null;
    }
  }
}

// Keyboard.Cursor
namespace Keyboard.Cursor {
  export type version = "2018.10.01";
  export var activeElement: Element = document.activeElement;
  export var activeDocument: Document = document;
  // @ts-ignore
  export var activeWindow: Window & {
    Node: {
      prototype: Node;
      new(): Node;
      readonly ATTRIBUTE_NODE: number;
      readonly CDATA_SECTION_NODE: number;
      readonly COMMENT_NODE: number;
      readonly DOCUMENT_FRAGMENT_NODE: number;
      readonly DOCUMENT_NODE: number;
      readonly DOCUMENT_POSITION_CONTAINED_BY: number;
      readonly DOCUMENT_POSITION_CONTAINS: number;
      readonly DOCUMENT_POSITION_DISCONNECTED: number;
      readonly DOCUMENT_POSITION_FOLLOWING: number;
      readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: number;
      readonly DOCUMENT_POSITION_PRECEDING: number;
      readonly DOCUMENT_TYPE_NODE: number;
      readonly ELEMENT_NODE: number;
      readonly ENTITY_NODE: number;
      readonly ENTITY_REFERENCE_NODE: number;
      readonly NOTATION_NODE: number;
      readonly PROCESSING_INSTRUCTION_NODE: number;
      readonly TEXT_NODE: number;
    };
    HTMLElement: {
      prototype: HTMLElement;
      new(): HTMLElement;
    };
    HTMLIFrameElement: {
      prototype: HTMLIFrameElement;
      new(): HTMLIFrameElement;
    }
  } = window;
  UX.style.textContent +=
    'keyboard html|cursor{all:initial;z-index:99997;display:none;position:fixed;top:0;left:0;width:1px;background:#000;}' +
    'keyboard html|cursor.blink{display:none!important;}';
  const cursor = <HTMLElement>document.createElementNS(UX.htmlNamespaceURI, "cursor");
  UX.defs.appendChild(cursor);
  function updateCursor() {
    if (
      document.activeElement !== document.activeElement.ownerDocument.body ||
      document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable === true
    ) {
      activeElement = document.activeElement;
      activeDocument = document;
      // @ts-ignore
      activeWindow = window;

      var top = 0;
      var left = 0;
      try {
        while (activeElement instanceof activeWindow.HTMLIFrameElement && (<HTMLIFrameElement>activeElement).contentDocument) {
          let rect = activeElement.getBoundingClientRect();
          // top += activeElement.offsetTop + activeElement.clientTop;
          // left += activeElement.offsetLeft + activeElement.clientLeft;
          top += rect.top;
          left += rect.left;
          activeDocument = activeElement.contentDocument;
          // @ts-ignore
          activeWindow = activeElement.contentWindow;
          activeElement = activeElement.contentDocument.activeElement;
        }
      } catch (e) { }
    }
    var selection = activeDocument.getSelection() || activeWindow.getSelection();
    if (selection && selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      if (range.collapsed && UX.isVisible()) {
        if (document.activeElement.localName == "textarea" || document.activeElement.localName == "input" && document.activeElement.namespaceURI == UX.htmlNamespaceURI) {
          cursor.style.display = "";
          return;
        }
        var rect = range.getBoundingClientRect();
        cursor.style.display = "block";
        if (rect.height == 0 && rect.top == 0) {
          var ancestor = range.commonAncestorContainer.nodeType == activeWindow.Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
          if (ancestor instanceof activeWindow.HTMLElement && ancestor.isContentEditable === true) {
            rect = ancestor.getBoundingClientRect();
          } else {
            cursor.style.display = "";
            return;
          }
        }
        cursor.style.top = top + rect.top + "px";
        cursor.style.left = left + rect.left + "px";
        cursor.style.height = rect.height + "px";
        cursor.scrollIntoView();
        activeElement instanceof activeWindow.HTMLElement && activeElement.blur();
      } else {
        cursor.style.display = "";
      }
    }
  }

  var blinkCursor = true;
  var blinkInterval = 150;
  var blinkTimeout = blinkInterval;
  setInterval(() => {
    blinkTimeout--;
    if (blinkTimeout < 0) {
      blinkTimeout = blinkInterval;
      blinkCursor = !blinkCursor;
    }
  }, 1);
  export function pauseBlinkCursor() {
    blinkCursor = false;
    blinkTimeout = blinkInterval;
  }
  (function blink() {
    cursor.classList.toggle("blink", blinkCursor);
    requestAnimationFrame(blink);
  })();
  export function scrollToCursor() {
    var top = cursor.offsetTop;
    var left = cursor.offsetLeft;
    var width = cursor.offsetWidth;
    var height = cursor.offsetHeight;
    if (top < 0) {
      window.scrollBy(0, top);
    }
    if (left < 0) {
      window.scrollBy(left, 0);
    }
    if (top + height > window.innerHeight - UX.element.getBoundingClientRect().height) {
      window.scrollBy(0, top);
    }
    if (left + width > window.innerHeight) {
      window.scrollBy(left, 0);
    }
    updateCursor();
  }
  (function update() {
    updateCursor();
    requestAnimationFrame(update);
  })();
}

// Keybaord.Menu
namespace Keyboard {
  export interface KeyboardConfiguration {
    name: string;
    description: string;
    version: string;
  }
}
namespace Keyboard.Menu {
  export type version = "2018.10.01";
  UX.style.textContent += 'html|menu{display:none;z-index:99999;position:fixed;left:0;bottom:0;font:16px/1.08 sans-serif;cursor:default;user-select:none;padding:0.25em 0;margin:0;box-shadow:0 0 0.5em 0#000;max-height:80%;max-width:100%;overflow:auto;overflow-x:hidden;}' +
    'menuitem{display:block;padding:0.5em;white-space:nowrap;}' +
    'name{display:inline-block;width:2.5em;vertical-align:top;text-align:center;overflow:hidden;}' +
    'desc{display:inline-block;margin:0 0.5em;}' +
    'br{display:block;}' +
    'hr{display:block;height:1px;background:#333;margin:0.25em 0;}';
  const menu = <HTMLMenuElement>document.createElementNS(UX.htmlNamespaceURI, "menu");
  UX.element.appendChild(menu);

  export type LangList = LangListItem[];
  export type LangListItem = { name: string, code: string, desc: string, active?: boolean };

  const allowCustomLayouts = Keyboard20180928Configuration.allowCustomLayouts;

  function globalDown(event: Event) {
    if (!menu.contains(<Node>event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    clearMenu();
    window.removeEventListener("mousedown", globalDown, true);
    window.removeEventListener("touchstart", globalDown, true);
  }
  function menuItemDown(this: Element, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setActiveKeyboard(this.getAttribute("code"));
  }
  function settingsItemDown(this: Element, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    let value = prompt("Setze eine Sprache:");
    if (value) {
      setActiveKeyboard(value);
    }
  }

  function createMenuitem({ name, code, desc, active }: LangListItem) {
    var menuitem = document.createElementNS(UX.keyboardNamespaceURI, "menuitem");
    var langElement = document.createElementNS(UX.keyboardNamespaceURI, "name");
    var descElement = document.createElementNS(UX.keyboardNamespaceURI, "desc");
    if (active === true) {
      menuitem.classList.add("active");
    }
    menuitem.setAttribute("code", code);
    menuitem.addEventListener("mousedown", menuItemDown, true);
    menuitem.addEventListener("touchstart", menuItemDown, true);
    langElement.innerHTML = name.replace("\n", "<br/>");
    menuitem.appendChild(langElement);
    descElement.innerHTML = desc.replace("\n", "<br/>");
    menuitem.appendChild(descElement);
    return menuitem;
  }
  function createCustomItem(name: string, label: string, action: (event: Event) => void) {
    var menuitem = document.createElementNS(UX.keyboardNamespaceURI, "menuitem");
    var langElement = document.createElementNS(UX.keyboardNamespaceURI, "name");
    var descElement = document.createElementNS(UX.keyboardNamespaceURI, "desc");
    menuitem.addEventListener("mousedown", action, true);
    menuitem.addEventListener("touchstart", action, true);
    langElement.textContent = name;
    menuitem.appendChild(langElement);
    descElement.textContent = label;
    menuitem.appendChild(descElement);
    return menuitem;
  }
  export function createMenu(langList: LangList) {
    clearMenu();
    if (langList.length > 0) {
      langList.forEach(lang => menu.appendChild(createMenuitem(lang)));
      let hr = document.createElementNS(UX.keyboardNamespaceURI, "hr");
      menu.appendChild(hr);
    }
    if (allowCustomLayouts) {
      menu.appendChild(createCustomItem("", "Sprache hinzufügen", settingsItemDown));
    }
    if (UX.isVisible()) {
      menu.appendChild(createCustomItem("\u2328", "Verstecken", event => {
        UX.hide();
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }));
    }
    menu.style.display = "block";
    window.addEventListener("mousedown", globalDown, true);
    window.addEventListener("touchstart", globalDown, true);
  }
  function clearMenu() {
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild);
    }
    menu.style.display = "";
  }
  const toggle = createCustomItem("\u2328", "Anzeigen", event => {
    UX.show();
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  });
  UX.element.appendChild(toggle);
}

if (Keyboard20180928Configuration.loadLazy) {
  Keyboard.lazyLoadKeyboards(Keyboard20180928Configuration.layouts, Keyboard20180928Configuration.hidden).then(s => console.log("lazy", s));
} else {
  Keyboard.loadKeyboards(Keyboard20180928Configuration.layouts, Keyboard20180928Configuration.hidden).then(s => console.log("normal", s));
}
