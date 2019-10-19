/**
 * @private
 * @internal
 */
var Keyboard20180928Configuration = Object.assign({
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
var Keyboard;
(function (Keyboard) {
    var activeKeyboard = null;
    function getActiveKeyboard() {
        return activeKeyboard;
    }
    Keyboard.getActiveKeyboard = getActiveKeyboard;
    function setActiveKeyboard(code) {
        if (activeKeyboard && activeKeyboard.code == code) {
            return Promise.resolve();
        }
        return Promise.resolve(loadKeyboard(code)).then(function (keyboard) {
            activeKeyboard = keyboard;
            Keyboard.UX.keyboardStyle.textContent = "";
            if (typeof keyboard.imports == "object" && typeof keyboard.imports.forEach == "function") {
                keyboard.imports.forEach(function (style) { return Keyboard.UX.keyboardStyle.textContent += '@import "' + style + '";'; });
            }
            if (typeof keyboard.style == "string") {
                Keyboard.UX.keyboardStyle.textContent += '@namespace "' + Keyboard.UX.keyboardNamespaceURI + '";' + keyboard.style;
            }
            Keyboard.UX.build();
            Keyboard.UX.element.removeAttribute("hidden");
            Keyboard.UX.updateSize();
        });
    }
    Keyboard.setActiveKeyboard = setActiveKeyboard;
    Keyboard.keyboardLocation = Keyboard20180928Configuration.keyboardLocation;
    var requestKeyboard = Object.create(null);
    function loadKeyboard(code, keepVisibility) {
        if (keepVisibility === void 0) { keepVisibility = false; }
        if (code in Keyboard.keyboards) {
            return Promise.resolve(Keyboard.keyboards[code]);
        }
        if (code in requestKeyboard) {
            return requestKeyboard[code].promise;
        }
        requestKeyboard[code] = {
            promise: null,
            resolve: null
        };
        var visibility = Keyboard.UX.isVisible();
        return requestKeyboard[code].promise = new Promise(function (resolve) {
            requestKeyboard[code].resolve = function (keyboard) {
                if (keepVisibility === true) {
                    Keyboard.UX.toggle(visibility);
                }
                resolve(keyboard);
            };
            loadScript(Keyboard.resolveCodeToLayoutURL(code));
        });
    }
    Keyboard.loadKeyboard = loadKeyboard;
    function loadKeyboards(layouts, keepVisibility) {
        if (keepVisibility === void 0) { keepVisibility = false; }
        return new Promise(function (resolve) {
            var length = layouts.length;
            var rslt = [];
            layouts.forEach(function (layout) {
                loadKeyboard(layout, keepVisibility).then(function (keyboard) {
                    var index = rslt.indexOf(null);
                    if (index == -1) {
                        rslt.push(keyboard);
                    }
                    else {
                        rslt.splice(index, 1, keyboard);
                    }
                    if (rslt.length == length) {
                        resolve(rslt);
                    }
                });
            });
            if (layouts.length == rslt.length) {
                resolve(rslt);
                Keyboard.UX.updateSize();
            }
            else {
                setTimeout(function () {
                    Array(length - rslt.length).forEach(function () { return rslt.push(null); });
                    resolve(rslt);
                    Keyboard.UX.updateSize();
                }, 10000);
            }
        });
    }
    Keyboard.loadKeyboards = loadKeyboards;
    function lazyLoadKeyboards(layouts, keepVisibility) {
        if (keepVisibility === void 0) { keepVisibility = false; }
        return new Promise(function (resolve) {
            var length = layouts.length;
            var rslt = Array(length);
            (function loadLayout(index) {
                if (index < length) {
                    var loadingNext = false;
                    var timeout = setTimeout(function () {
                        loadLayout(index + 1);
                        loadingNext = true;
                    }, 5000);
                    loadKeyboard(layouts[index], keepVisibility).then(function (keyboard) {
                        rslt[index] = keyboard;
                        if (loadingNext == false) {
                            clearTimeout(timeout);
                            loadLayout(index + 1);
                        }
                    });
                }
                else {
                    resolve(rslt);
                    Keyboard.UX.updateSize();
                }
            })(0);
        });
    }
    Keyboard.lazyLoadKeyboards = lazyLoadKeyboards;
    Keyboard.keyboards = Object.create(null);
    function defineKeyboard(keyboard) {
        var code = keyboard.code;
        if (code in Keyboard.keyboards) {
            throw "Cannot re-define a keyboard: " + code;
        }
        Keyboard.keyboards[code] = keyboard;
        if (activeKeyboard === null) {
            setActiveKeyboard(code);
        }
        if (code in requestKeyboard) {
            requestKeyboard[code].resolve(keyboard);
            delete requestKeyboard[code];
        }
    }
    Keyboard.defineKeyboard = defineKeyboard;
    Keyboard.resolveCodeToLayoutURL = function (code) {
        return "layouts/" + code.toUpperCase() + ".js";
    };
    var scripts = Object.create(null);
    function loadScript(url) {
        if (!/^https?\:\/*|\/\//.test(url)) {
            if (/^\//.test(url)) {
                url = Keyboard.keyboardLocation + url;
            }
            else {
                url = Keyboard.keyboardLocation + "/js/" + url;
            }
        }
        if (url in scripts) {
            return scripts[url];
        }
        var promise = new Promise(function (resolve) {
            var script = document.createElementNS(Keyboard.UX.htmlNamespaceURI, "script");
            script.addEventListener("load", resolve);
            script.src = url;
            script.type = "text/javascript";
            Keyboard.UX.defs.appendChild(script);
        });
        scripts[url] = promise;
        return promise;
    }
    Keyboard.loadScript = loadScript;
    function showSettingsMenu() {
        var langs = [];
        Object.getOwnPropertyNames(Keyboard.keyboards).forEach(function (code) {
            langs.push({
                name: Keyboard.keyboards[code].name,
                code: Keyboard.keyboards[code].code,
                desc: Keyboard.keyboards[code].description,
                active: activeKeyboard === Keyboard.keyboards[code]
            });
        });
        Keyboard.Menu.createMenu(langs);
    }
    Keyboard.showSettingsMenu = showSettingsMenu;
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    Keyboard.MODIFIER_SHIFT = 1;
    Keyboard.MODIFIER_CTRL = 2;
    Keyboard.MODIFIER_ALT = 4;
    Keyboard.MODIFIER_META = 8;
    Keyboard.MODIFIER_SHIFT_LOCK = 16;
    Keyboard.MODIFIER_CTRL_LOCK = 32;
    Keyboard.MODIFIER_ALT_LOCK = 64;
    Keyboard.MODIFIER_META_LOCK = 128;
    function hasFlag(flag1, flag2) {
        return flag1 & flag2;
    }
    Keyboard.hasFlag = hasFlag;
    function combineFlag(flag1, flag2) {
        return flag1 | flag2;
    }
    Keyboard.combineFlag = combineFlag;
    function removeFlag(flag1, flag2) {
        return flag1 & ~flag2;
    }
    Keyboard.removeFlag = removeFlag;
    function toggleFlag(flag1, flag2, force) {
        if (force === true) {
            return combineFlag(flag1, flag2);
        }
        else if (force === false || hasFlag(flag1, flag2)) {
            return removeFlag(flag1, flag2);
        }
        else {
            return combineFlag(flag1, flag2);
        }
    }
    Keyboard.toggleFlag = toggleFlag;
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    var UX;
    (function (UX) {
        UX.keyboardNamespaceURI = Keyboard20180928Configuration.keyboardNamespaceURI;
        UX.htmlNamespaceURI = Keyboard20180928Configuration.htmlNamespaceURI;
        UX.element = document.createElementNS(UX.keyboardNamespaceURI, "keyboard");
        UX.element.setAttribute("hidden", "");
        function updateSize() {
            var keyboardHeight = UX.element.getBoundingClientRect().height;
            document.documentElement && (document.documentElement.style.overflow = "auto");
            document.documentElement && (document.documentElement.style.maxHeight = (window.innerHeight - keyboardHeight) + "px");
            document.body && (document.body.style.overflow = "auto");
            document.body && (document.body.style.maxHeight = (window.innerHeight - keyboardHeight) + "px");
        }
        UX.updateSize = updateSize;
        window.addEventListener("resize", updateSize);
        document.body.appendChild(UX.element);
        UX.defs = document.createElementNS(UX.keyboardNamespaceURI, "defs");
        UX.element.appendChild(UX.defs);
        var keys = document.createElementNS(UX.keyboardNamespaceURI, "keys");
        UX.element.appendChild(keys);
        UX.style = document.createElementNS(UX.htmlNamespaceURI, "style");
        UX.style.textContent = '@import "https://fonts.googleapis.com/css?family=Noto+Sans";' +
            '@namespace "' + UX.keyboardNamespaceURI + '";' +
            '@namespace html "' + UX.htmlNamespaceURI + '";' +
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
        UX.defs.appendChild(UX.style);
        UX.keyboardStyle = document.createElementNS(UX.htmlNamespaceURI, "style");
        UX.defs.appendChild(UX.keyboardStyle);
        var _keyMap = Object.create(null);
        var _spans = [];
        var buildMode = false;
        var activeLayout = null;
        function build() {
            while (keys.firstChild) {
                keys.removeChild(keys.firstChild);
            }
            buildMode = true;
            activeLayout = getLayout();
            var keyMap = getKeyMap();
            UX.spanIndex = 0;
            activeLayout.forEach(function (defineKey) { return (buildMode = true) && keys.appendChild(_buildKey(defineKey, keyMap)); });
            buildMode = false;
        }
        UX.build = build;
        var updateMode = false;
        function update() {
            updateMode = true;
            var keyMap = getKeyMap();
            activeLayout.forEach(function (defineKey) { return _updateKey(defineKey, keyMap); });
            updateMode = false;
        }
        UX.update = update;
        function _updateKey(defineKey, keyMap) {
            var keyboard = Keyboard.getActiveKeyboard();
            if (typeof keyboard.updateKey == "function") {
                var key = keyboard.updateKey(defineKey, keyMap);
                if (key) {
                    return key;
                }
            }
            return updateKey(defineKey, keyMap);
        }
        function updateKey(defineKey, keyMap) {
            if (!updateMode) {
                throw "Only callable in BuildMode";
            }
            if (defineKey === null) {
                return true;
            }
            var result = /^(#?)([a-z0-9]+)(?:\:([0-9]+))?$/i.exec(defineKey);
            if (result == null) {
                throw "Cannot parse defineKey: " + defineKey;
            }
            var code = result[2];
            var key = getKey(code);
            var value = keyMap[code];
            if (!value) {
                key.textContent = "";
                key.setAttribute("key", "");
                key.setAttribute("disabled", "");
            }
            else if (typeof value == "string") {
                key.textContent = value;
                key.setAttribute("key", value);
                key.removeAttribute("disabled");
            }
            else {
                key.textContent = value[0];
                key.setAttribute("key", value[1] || value[0]);
                key.removeAttribute("disabled");
            }
            if (key.textContent.length > 2) {
                key.setAttribute("long", "");
            }
            else {
                key.removeAttribute("long");
            }
            switch (key.getAttribute("key")) {
                case "Shift":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_SHIFT) == Keyboard.MODIFIER_SHIFT) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_SHIFT_LOCK) == Keyboard.MODIFIER_SHIFT_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Control":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_CTRL_LOCK) == Keyboard.MODIFIER_CTRL_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Alt":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_ALT_LOCK) == Keyboard.MODIFIER_ALT_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Meta":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_META_LOCK) == Keyboard.MODIFIER_META_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
            }
            return true;
        }
        UX.updateKey = updateKey;
        function _buildKey(defineKey, keyMap) {
            var keyboard = Keyboard.getActiveKeyboard();
            if (typeof keyboard.buildKey == "function") {
                var key = keyboard.buildKey(defineKey, keyMap);
                if (key) {
                    return key;
                }
            }
            return buildKey(defineKey, keyMap);
        }
        function buildKey(defineKey, keyMap) {
            if (!buildMode) {
                throw "Only callable in BuildMode";
            }
            if (defineKey === null) {
                return getSpan();
            }
            var result = /^(#?)([a-z0-9]+)(?:\:([0-9]+))?$/i.exec(defineKey);
            if (result == null) {
                throw "Cannot parse defineKey: " + defineKey;
            }
            var code = result[2];
            var width = parseInt(result[3] || "2");
            var key = getKey(code, width);
            var special = result[1] == "#";
            if (special) {
                key.setAttribute("special", "");
            }
            else {
                key.removeAttribute("special");
            }
            var value = keyMap[code];
            if (!value) {
                key.textContent = "";
                key.setAttribute("key", "");
                key.setAttribute("disabled", "");
            }
            else if (typeof value == "string") {
                key.textContent = value;
                key.setAttribute("key", value);
                key.removeAttribute("disabled");
            }
            else {
                key.textContent = value[0];
                key.setAttribute("key", value[1] || value[0]);
                key.removeAttribute("disabled");
            }
            if (key.textContent.length > 2) {
                key.setAttribute("long", "");
            }
            else {
                key.removeAttribute("long");
            }
            switch (key.getAttribute("key")) {
                case "Shift":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_SHIFT) == Keyboard.MODIFIER_SHIFT) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_SHIFT_LOCK) == Keyboard.MODIFIER_SHIFT_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Control":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_CTRL_LOCK) == Keyboard.MODIFIER_CTRL_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Alt":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_ALT_LOCK) == Keyboard.MODIFIER_ALT_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
                case "Meta":
                    if (Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META) {
                        key.setAttribute("lock", Keyboard.hasFlag(getModifiers(), Keyboard.MODIFIER_META_LOCK) == Keyboard.MODIFIER_META_LOCK ? "persistent" : "temporary");
                    }
                    else {
                        key.removeAttribute("lock");
                    }
                    break;
            }
            return key;
        }
        UX.buildKey = buildKey;
        UX.spanIndex = 0;
        function getSpan(width) {
            if (width === void 0) { width = 1; }
            if (!buildMode) {
                throw "Only callable in BuildMode";
            }
            var span;
            if (UX.spanIndex < _spans.length) {
                span = _spans[UX.spanIndex++];
            }
            else {
                span = document.createElementNS(UX.keyboardNamespaceURI, "span");
                _spans.push(span);
                UX.spanIndex++;
            }
            span.setAttribute("width", width.toString());
            return span;
        }
        UX.getSpan = getSpan;
        function getKey(code, width, lock) {
            if (width === void 0) { width = 2; }
            if (lock === void 0) { lock = "none"; }
            var key;
            if (code in _keyMap) {
                key = _keyMap[code];
            }
            else {
                key = document.createElementNS(UX.keyboardNamespaceURI, "key");
                key.setAttribute("code", code);
                _keyMap[code] = key;
            }
            if (buildMode) {
                key.setAttribute("width", width.toString());
                if (lock == "none") {
                    key.removeAttribute("lock");
                }
                else {
                    key.setAttribute("lock", lock);
                }
            }
            return key;
        }
        UX.getKey = getKey;
        function getKeysInKeyMap(key) {
            var keyMap = getKeyMap();
            return Object.getOwnPropertyNames(keyMap).filter(function (code) {
                if (typeof keyMap[code] == "string") {
                    if (keyMap[code] == key) {
                        return true;
                    }
                }
                else {
                    if (keyMap[code] && keyMap[code][1] == key) {
                        return true;
                    }
                }
                return false;
            }).map(function (code) { return getKey(code); });
        }
        UX.getKeysInKeyMap = getKeysInKeyMap;
        function getLayout() {
            if (!buildMode) {
                throw "Only callable in BuildMode";
            }
            var keyboard = Keyboard.getActiveKeyboard();
            if (typeof keyboard.getLayout == "function") {
                var layout = keyboard.getLayout();
                if (layout) {
                    return layout;
                }
            }
            return keyboard.layout;
        }
        UX.getLayout = getLayout;
        function getKeyMap() {
            var keyboard = Keyboard.getActiveKeyboard();
            if (typeof keyboard.getKeyMap == "function") {
                var keyMap = keyboard.getKeyMap();
                if (keyMap) {
                    return keyMap;
                }
            }
            return keyboard.keyMap;
        }
        UX.getKeyMap = getKeyMap;
        function getKeyLock(code) {
            if (code in _keyMap) {
                var key = _keyMap[code];
                var lock = key.getAttribute("lock");
                if (lock !== null) {
                    return lock;
                }
            }
            return "none";
        }
        UX.getKeyLock = getKeyLock;
        function getBuildMode() {
            return buildMode;
        }
        UX.getBuildMode = getBuildMode;
        function isVisible() {
            return !UX.element.hasAttribute("hidden");
        }
        UX.isVisible = isVisible;
        function hide() {
            UX.element.setAttribute("hidden", "");
            updateSize();
        }
        UX.hide = hide;
        function show() {
            if (Keyboard.getActiveKeyboard()) {
                UX.element.removeAttribute("hidden");
                updateSize();
            }
            else {
                Keyboard.showSettingsMenu();
            }
        }
        UX.show = show;
        function toggle(force) {
            if (force === false) {
                hide();
                return false;
            }
            else if (force === true || UX.element.hasAttribute("hidden")) {
                show();
                return true;
            }
            else {
                hide();
                return false;
            }
        }
        UX.toggle = toggle;
        function getModifiers() {
            var keyboard = Keyboard.getActiveKeyboard();
            if (keyboard) {
                if (typeof keyboard.getModifiers == "function") {
                    var modifiers = keyboard.getModifiers();
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
        UX.getModifiers = getModifiers;
        function setModifiers(modifiers) {
            var keyboard = Keyboard.getActiveKeyboard();
            if (typeof modifiers == "number" && keyboard && keyboard.modifiers != modifiers) {
                if (typeof keyboard.setModifiers == "function") {
                    var result = keyboard.setModifiers(modifiers);
                    if (result !== false) {
                        return result;
                    }
                }
                keyboard.modifiers = modifiers;
            }
            return keyboard.modifiers;
        }
        UX.setModifiers = setModifiers;
    })(UX = Keyboard.UX || (Keyboard.UX = {}));
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    var Theme;
    (function (Theme) {
        Theme.version = "2018.10.01";
        Theme.element = document.createElementNS(Keyboard.UX.htmlNamespaceURI, "style");
        var colorRegexp = /^\#[0-9a-f]{3}|\#[0-9a-f]{6}$/;
        function fallbackColor(color, fallback) {
            if (colorRegexp.test(color)) {
                return color;
            }
            return fallback;
        }
        function apply(colors) {
            var color = fallbackColor(colors.color, "#fff");
            var background = fallbackColor(colors.background, "#222");
            var keyColor = fallbackColor(colors.keyColor, "#fff");
            var keyBackground = fallbackColor(colors.keyBackground, "#333");
            var specialKeyColor = fallbackColor(colors.specialKeyColor, keyColor);
            var specialKeyBackground = fallbackColor(colors.specialKeyBackground, keyBackground);
            var keyPressColor = fallbackColor(colors.keyPressColor, keyColor);
            var keyPressBackground = fallbackColor(colors.keyPressBackground, keyBackground);
            var keyHoldColor = fallbackColor(colors.keyHoldColor, keyPressColor);
            var keyHoldBackground = fallbackColor(colors.keyHoldBackground, keyPressBackground);
            var keyLockColor = fallbackColor(colors.keyLockColor, keyHoldColor);
            var keyLockBackground = fallbackColor(colors.keyLockBackground, keyHoldBackground);
            var menuColor = fallbackColor(colors.menuColor, color);
            var menuBackground = fallbackColor(colors.menuBackground, background);
            var menuItemColor = fallbackColor(colors.menuItemColor, menuColor);
            var menuItemBackground = fallbackColor(colors.menuItemBackground, menuBackground);
            var menuItemSeparatorColor = fallbackColor(colors.menuItemSeparatorColor, menuItemColor);
            var menuItemHoverColor = fallbackColor(colors.menuItemHoverColor, menuItemColor);
            var menuItemHoverBackground = fallbackColor(colors.menuItemHoverBackground, menuItemBackground);
            var menuItemPressColor = fallbackColor(colors.menuItemPressColor, menuItemHoverColor);
            var menuItemPressBackground = fallbackColor(colors.menuItemPressBackground, menuItemHoverBackground);
            var menuItemActiveColor = fallbackColor(colors.menuItemActiveColor, menuItemPressColor);
            var menuItemActiveBackground = fallbackColor(colors.menuItemActiveBackground, menuItemPressBackground);
            Theme.element.textContent = '@namespace "' + Keyboard.UX.keyboardNamespaceURI + '";' +
                '@namespace html "' + Keyboard.UX.htmlNamespaceURI + '";' +
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
        Theme.apply = apply;
        apply(Keyboard20180928Configuration.colors);
        Keyboard.UX.defs.appendChild(Theme.element);
    })(Theme = Keyboard.Theme || (Keyboard.Theme = {}));
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    Keyboard.PHASE_DOWN = 1;
    Keyboard.PHASE_HOLD = 2;
    Keyboard.PHASE_UP = 4;
    Keyboard.TYPE_TOUCH = "touch";
    Keyboard.TYPE_POINTER = "pointer";
    Keyboard.TYPE_MOUSE = "mouse";
    Keyboard.keyBindings = [{
            key: "Alt",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (event.phase === Keyboard.PHASE_DOWN) {
                    Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.toggleFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT), Keyboard.MODIFIER_ALT_LOCK));
                    Keyboard.UX.update();
                }
                if (event.phase === Keyboard.PHASE_HOLD && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT) {
                    Keyboard.UX.setModifiers(Keyboard.UX.getModifiers() | Keyboard.MODIFIER_ALT_LOCK);
                    Keyboard.UX.update();
                }
                event.preventDefault();
                event.setCommandArgs(null);
            }
        }, {
            key: "Backspace",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                event.setCommandArgs("delete", false, "");
            }
        }, {
            key: "Control",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (event.phase === Keyboard.PHASE_DOWN) {
                    Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.toggleFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL), Keyboard.MODIFIER_CTRL_LOCK));
                    Keyboard.UX.update();
                }
                if (event.phase === Keyboard.PHASE_HOLD && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL) {
                    Keyboard.UX.setModifiers(Keyboard.UX.getModifiers() | Keyboard.MODIFIER_CTRL_LOCK);
                    Keyboard.UX.update();
                }
                event.preventDefault();
                event.setCommandArgs(null);
            }
        }, {
            key: "Enter",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                event.setCommandArgs("insertText", false, "\n");
            }
        }, {
            key: "Language",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (event.phase == Keyboard.PHASE_DOWN) {
                    Keyboard.showSettingsMenu();
                }
                event.preventDefault();
                event.setCommandArgs(null);
            }
        }, {
            key: "Meta",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (event.phase === Keyboard.PHASE_DOWN) {
                    Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.toggleFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META), Keyboard.MODIFIER_META_LOCK));
                    Keyboard.UX.update();
                }
                if (event.phase === Keyboard.PHASE_HOLD && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META) {
                    Keyboard.UX.setModifiers(Keyboard.UX.getModifiers() | Keyboard.MODIFIER_META_LOCK);
                    Keyboard.UX.update();
                }
                event.preventDefault();
                event.setCommandArgs(null);
            }
        }, {
            key: "Shift",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (event.phase === Keyboard.PHASE_DOWN) {
                    Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.toggleFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT), Keyboard.MODIFIER_SHIFT_LOCK));
                    Keyboard.UX.update();
                }
                if (event.phase === Keyboard.PHASE_HOLD && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT) == Keyboard.MODIFIER_SHIFT) {
                    Keyboard.UX.setModifiers(Keyboard.UX.getModifiers() | Keyboard.MODIFIER_SHIFT_LOCK);
                    Keyboard.UX.update();
                }
                event.preventDefault();
                event.setCommandArgs(null);
            }
        }, {
            key: "Space",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                event.setCommandArgs("insertText", false, " ");
            }
        }, {
            key: /.*/,
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) != Keyboard.MODIFIER_ALT && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) != Keyboard.MODIFIER_META) {
                    event.setCommandArgs(null);
                }
                if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) != Keyboard.MODIFIER_CTRL && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) != Keyboard.MODIFIER_META) {
                    event.setCommandArgs(null);
                }
                if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) != Keyboard.MODIFIER_CTRL && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) != Keyboard.MODIFIER_ALT && Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META) {
                    event.setCommandArgs(null);
                }
            }
        }, {
            key: /.*/,
            phases: Keyboard.PHASE_UP,
            exec: function (event) {
                if (!/Shift|Control|Alt|Meta/.test(event.key)) {
                    if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT | Keyboard.MODIFIER_SHIFT_LOCK) != (Keyboard.MODIFIER_SHIFT | Keyboard.MODIFIER_SHIFT_LOCK)) {
                        Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT | Keyboard.MODIFIER_SHIFT_LOCK));
                        Keyboard.UX.update();
                    }
                    if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL | Keyboard.MODIFIER_CTRL_LOCK) != (Keyboard.MODIFIER_CTRL | Keyboard.MODIFIER_CTRL_LOCK)) {
                        Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL | Keyboard.MODIFIER_CTRL_LOCK));
                        Keyboard.UX.update();
                    }
                    if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT | Keyboard.MODIFIER_ALT_LOCK) != (Keyboard.MODIFIER_ALT | Keyboard.MODIFIER_ALT_LOCK)) {
                        Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT | Keyboard.MODIFIER_ALT_LOCK));
                        Keyboard.UX.update();
                    }
                    if (Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META | Keyboard.MODIFIER_META_LOCK) != (Keyboard.MODIFIER_META | Keyboard.MODIFIER_META_LOCK)) {
                        Keyboard.UX.setModifiers(Keyboard.removeFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META | Keyboard.MODIFIER_META_LOCK));
                        Keyboard.UX.update();
                    }
                }
            }
        }, {
            key: "a",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("selectAll");
                }
            }
        }, {
            key: "c",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("copy");
                }
            }
        }, {
            key: "v",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("paste");
                }
            }
        }, {
            key: "x",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("cut");
                }
            }
        }, {
            key: "z",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("undo");
                }
            }
        }, {
            key: "y",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("redo");
                }
            }
        }, {
            key: "b",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("bold");
                }
            }
        }, {
            key: "i",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("italic");
                }
            }
        }, {
            key: "u",
            phases: Keyboard.PHASE_DOWN | Keyboard.PHASE_HOLD,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    event.setCommandArgs("underline");
                }
            }
        }, {
            key: "p",
            phases: Keyboard.PHASE_DOWN,
            exec: function (event) {
                if (Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL || Keyboard.UX.getModifiers() === Keyboard.MODIFIER_CTRL_LOCK || Keyboard.UX.getModifiers() === Keyboard.combineFlag(Keyboard.MODIFIER_CTRL, Keyboard.MODIFIER_CTRL_LOCK)) {
                    print();
                }
            }
        }];
    function addCommand(key, phases, exec) {
        return Keyboard.keyBindings.push({
            key: key,
            phases: phases,
            exec: exec
        });
    }
    Keyboard.addCommand = addCommand;
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    var EventManager;
    (function (EventManager) {
        var KeyBindingEvent = /** @class */ (function () {
            function KeyBindingEvent(_internal) {
                this._internal = _internal;
                this.code = this._internal.code;
                this.key = this._internal.key;
                this.phase = this._internal.phase;
                this.type = this._internal.type;
                this.target = this._internal.target;
            }
            KeyBindingEvent.prototype.setCommandArgs = function (commandId, showUI, value) {
                if (commandId === void 0) { commandId = null; }
                if (showUI === void 0) { showUI = false; }
                if (value === void 0) { value = ""; }
                if (commandId === null) {
                    this._internal.commandArgs = null;
                }
                else {
                    this._internal.commandArgs = [commandId, showUI, value];
                }
            };
            KeyBindingEvent.prototype.stopPropagation = function () {
                this._internal.propagationStopped = true;
            };
            KeyBindingEvent.prototype.preventDefault = function () {
                this._internal.defaultPrevented = true;
            };
            KeyBindingEvent.PHASE_DOWN = Keyboard.PHASE_DOWN;
            KeyBindingEvent.PHASE_HOLD = Keyboard.PHASE_HOLD;
            KeyBindingEvent.PHASE_UP = Keyboard.PHASE_UP;
            KeyBindingEvent.TYPE_MOUSE = Keyboard.TYPE_MOUSE;
            KeyBindingEvent.TYPE_POINTER = Keyboard.TYPE_POINTER;
            KeyBindingEvent.TYPE_TOUCH = Keyboard.TYPE_TOUCH;
            return KeyBindingEvent;
        }());
        EventManager.KeyBindingEvent = KeyBindingEvent;
        Object.assign(KeyBindingEvent.prototype, {
            PHASE_DOWN: Keyboard.PHASE_DOWN,
            PHASE_HOLD: Keyboard.PHASE_HOLD,
            PHASE_UP: Keyboard.PHASE_UP,
            TYPE_MOUSE: Keyboard.TYPE_MOUSE,
            TYPE_POINTER: Keyboard.TYPE_POINTER,
            TYPE_TOUCH: Keyboard.TYPE_TOUCH
        });
        function executeEvent(phase) {
            var keyboard = Keyboard.getActiveKeyboard();
            var internal = {
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
            var keyDownEvent = new KeyboardEvent(phase == Keyboard.PHASE_DOWN || phase == Keyboard.PHASE_HOLD ? "keydown" : "keyup", {
                altKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT || Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT_LOCK) == Keyboard.MODIFIER_ALT_LOCK,
                bubbles: true,
                key: internal.key,
                cancelable: true,
                code: internal.code,
                ctrlKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL || Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL_LOCK) == Keyboard.MODIFIER_CTRL_LOCK,
                metaKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META || Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META_LOCK) == Keyboard.MODIFIER_META_LOCK,
                repeat: phase == Keyboard.PHASE_HOLD,
                shiftKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT) == Keyboard.MODIFIER_SHIFT || Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT_LOCK) == Keyboard.MODIFIER_SHIFT_LOCK
            });
            if (!Keyboard.Cursor.activeElement.dispatchEvent(keyDownEvent)) {
                return;
            }
            var keyBindingEvent = new KeyBindingEvent(internal);
            keyboard.keyBindings && keyboard.keyBindings.forEach(function (keyBinding) {
                if (Keyboard.hasFlag(keyBinding.phases, phase) && (typeof keyBinding.key == "string" ? keyBinding.key == keyBindingEvent.key : keyBinding.key.test(keyBindingEvent.key))) {
                    keyBinding.exec(keyBindingEvent);
                }
            });
            if (internal.propagationStopped === false) {
                Keyboard.keyBindings.forEach(function (keyBinding) {
                    if (Keyboard.hasFlag(keyBinding.phases, phase) && (typeof keyBinding.key == "string" ? keyBinding.key == keyBindingEvent.key : keyBinding.key.test(keyBindingEvent.key))) {
                        keyBinding.exec(keyBindingEvent);
                    }
                });
            }
            if (phase == Keyboard.PHASE_UP) {
                return;
            }
            if (!internal.defaultPrevented) {
                // fire keypress!
                var keyPressEvent = new KeyboardEvent("keypress", {
                    altKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_ALT) == Keyboard.MODIFIER_ALT,
                    bubbles: true,
                    key: keyBindingEvent.key,
                    cancelable: true,
                    code: keyBindingEvent.code,
                    ctrlKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_CTRL) == Keyboard.MODIFIER_CTRL,
                    metaKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_META) == Keyboard.MODIFIER_META,
                    repeat: phase == Keyboard.PHASE_HOLD,
                    shiftKey: Keyboard.hasFlag(Keyboard.UX.getModifiers(), Keyboard.MODIFIER_SHIFT) == Keyboard.MODIFIER_SHIFT
                });
                if (!Keyboard.Cursor.activeElement.dispatchEvent(keyPressEvent)) {
                    return;
                }
            }
            if (internal.commandArgs === null) {
                return;
            }
            Keyboard.Cursor.activeDocument.execCommand.apply(Keyboard.Cursor.activeDocument, internal.commandArgs);
            Keyboard.Cursor.pauseBlinkCursor();
        }
        var active = {
            key: null,
            type: null,
            interval: null,
            timeout: null
        };
        function down(event) {
            var key = toKey(event.target);
            var type = toEventTypeGroup(event);
            if (key && type) {
                if (active.key || active.type) {
                    up();
                }
                active.key = key;
                active.type = type;
                active.key.setAttribute("down", "");
                executeEvent(Keyboard.PHASE_DOWN);
                active.timeout = setTimeout(function () {
                    active.interval = setInterval(hold, 50);
                }, 300);
            }
        }
        function hold() {
            if (active.key && active.type) {
                executeEvent(Keyboard.PHASE_HOLD);
            }
            else {
                up();
            }
        }
        function up() {
            if (active.key && active.type) {
                executeEvent(Keyboard.PHASE_UP);
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
        function elementDown(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            down(event);
        }
        function elementUp(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            up();
        }
        Keyboard.UX.element.addEventListener("mousedown", elementDown);
        Keyboard.UX.element.addEventListener("touchstart", elementDown);
        // UX.element.addEventListener("pointerdown", elementDown);
        Keyboard.UX.element.addEventListener("mouseup", elementUp);
        Keyboard.UX.element.addEventListener("touchcancel", elementUp);
        Keyboard.UX.element.addEventListener("touchend", elementUp);
        // UX.element.addEventListener("pointercancel", elementUp);
        // UX.element.addEventListener("pointerup", elementUp);
        window.addEventListener("mouseup", up);
        window.addEventListener("touchcancel", up);
        window.addEventListener("touchend", up);
        // window.addEventListener("pointercancel", up);
        // window.addEventListener("pointerup", up);
        window.addEventListener("blur", up);
        function toKey(target) {
            while (target && target.parentElement && !isKey(target)) {
                target = target.parentElement;
            }
            if (isKey(target)) {
                return target;
            }
            return null;
        }
        function isKey(target) {
            return target.nodeType == target.ELEMENT_NODE && target.namespaceURI == Keyboard.UX.keyboardNamespaceURI && target.nodeName == "key";
        }
        function toEventTypeGroup(event) {
            if (/mouse/.test(event.type)) {
                return "mouse";
            }
            else if (/touch/.test(event.type)) {
                return "touch";
            }
            else if (/pointer/.test(event.type)) {
                return "pointer";
            }
            else {
                return null;
            }
        }
    })(EventManager = Keyboard.EventManager || (Keyboard.EventManager = {}));
})(Keyboard || (Keyboard = {}));
// Keyboard.Cursor
(function (Keyboard) {
    var Cursor;
    (function (Cursor) {
        Cursor.activeElement = document.activeElement;
        Cursor.activeDocument = document;
        // @ts-ignore
        Cursor.activeWindow = window;
        Keyboard.UX.style.textContent +=
            'keyboard html|cursor{all:initial;z-index:99997;display:none;position:fixed;top:0;left:0;width:1px;background:#000;}' +
                'keyboard html|cursor.blink{display:none!important;}';
        var cursor = document.createElementNS(Keyboard.UX.htmlNamespaceURI, "cursor");
        Keyboard.UX.defs.appendChild(cursor);
        function updateCursor() {
            if (document.activeElement !== document.activeElement.ownerDocument.body ||
                document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable === true) {
                Cursor.activeElement = document.activeElement;
                Cursor.activeDocument = document;
                // @ts-ignore
                Cursor.activeWindow = window;
                var top = 0;
                var left = 0;
                try {
                    while (Cursor.activeElement instanceof Cursor.activeWindow.HTMLIFrameElement && Cursor.activeElement.contentDocument) {
                        var rect_1 = Cursor.activeElement.getBoundingClientRect();
                        // top += activeElement.offsetTop + activeElement.clientTop;
                        // left += activeElement.offsetLeft + activeElement.clientLeft;
                        top += rect_1.top;
                        left += rect_1.left;
                        Cursor.activeDocument = Cursor.activeElement.contentDocument;
                        // @ts-ignore
                        Cursor.activeWindow = Cursor.activeElement.contentWindow;
                        Cursor.activeElement = Cursor.activeElement.contentDocument.activeElement;
                    }
                }
                catch (e) { }
            }
            var selection = Cursor.activeDocument.getSelection() || Cursor.activeWindow.getSelection();
            if (selection && selection.rangeCount > 0) {
                var range = selection.getRangeAt(0);
                if (range.collapsed && Keyboard.UX.isVisible()) {
                    if (document.activeElement.localName == "textarea" || document.activeElement.localName == "input" && document.activeElement.namespaceURI == Keyboard.UX.htmlNamespaceURI) {
                        cursor.style.display = "";
                        return;
                    }
                    var rect = range.getBoundingClientRect();
                    cursor.style.display = "block";
                    if (rect.height == 0 && rect.top == 0) {
                        var ancestor = range.commonAncestorContainer.nodeType == Cursor.activeWindow.Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
                        if (ancestor instanceof Cursor.activeWindow.HTMLElement && ancestor.isContentEditable === true) {
                            rect = ancestor.getBoundingClientRect();
                        }
                        else {
                            cursor.style.display = "";
                            return;
                        }
                    }
                    cursor.style.top = top + rect.top + "px";
                    cursor.style.left = left + rect.left + "px";
                    cursor.style.height = rect.height + "px";
                    cursor.scrollIntoView();
                    Cursor.activeElement instanceof Cursor.activeWindow.HTMLElement && Cursor.activeElement.blur();
                }
                else {
                    cursor.style.display = "";
                }
            }
        }
        var blinkCursor = true;
        var blinkInterval = 150;
        var blinkTimeout = blinkInterval;
        setInterval(function () {
            blinkTimeout--;
            if (blinkTimeout < 0) {
                blinkTimeout = blinkInterval;
                blinkCursor = !blinkCursor;
            }
        }, 1);
        function pauseBlinkCursor() {
            blinkCursor = false;
            blinkTimeout = blinkInterval;
        }
        Cursor.pauseBlinkCursor = pauseBlinkCursor;
        (function blink() {
            cursor.classList.toggle("blink", blinkCursor);
            requestAnimationFrame(blink);
        })();
        function scrollToCursor() {
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
            if (top + height > window.innerHeight - Keyboard.UX.element.getBoundingClientRect().height) {
                window.scrollBy(0, top);
            }
            if (left + width > window.innerHeight) {
                window.scrollBy(left, 0);
            }
            updateCursor();
        }
        Cursor.scrollToCursor = scrollToCursor;
        (function update() {
            updateCursor();
            requestAnimationFrame(update);
        })();
    })(Cursor = Keyboard.Cursor || (Keyboard.Cursor = {}));
})(Keyboard || (Keyboard = {}));
(function (Keyboard) {
    var Menu;
    (function (Menu) {
        Keyboard.UX.style.textContent += 'html|menu{display:none;z-index:99999;position:fixed;left:0;bottom:0;font:16px/1.08 sans-serif;cursor:default;user-select:none;padding:0.25em 0;margin:0;box-shadow:0 0 0.5em 0#000;max-height:80%;max-width:100%;overflow:auto;overflow-x:hidden;}' +
            'menuitem{display:block;padding:0.5em;white-space:nowrap;}' +
            'name{display:inline-block;width:2.5em;vertical-align:top;text-align:center;overflow:hidden;}' +
            'desc{display:inline-block;margin:0 0.5em;}' +
            'br{display:block;}' +
            'hr{display:block;height:1px;background:#333;margin:0.25em 0;}';
        var menu = document.createElementNS(Keyboard.UX.htmlNamespaceURI, "menu");
        Keyboard.UX.element.appendChild(menu);
        var allowCustomLayouts = Keyboard20180928Configuration.allowCustomLayouts;
        function globalDown(event) {
            if (!menu.contains(event.target)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
            clearMenu();
            window.removeEventListener("mousedown", globalDown, true);
            window.removeEventListener("touchstart", globalDown, true);
        }
        function menuItemDown(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            Keyboard.setActiveKeyboard(this.getAttribute("code"));
        }
        function settingsItemDown(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            var value = prompt("Setze eine Sprache:");
            if (value) {
                Keyboard.setActiveKeyboard(value);
            }
        }
        function createMenuitem(_a) {
            var name = _a.name, code = _a.code, desc = _a.desc, active = _a.active;
            var menuitem = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "menuitem");
            var langElement = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "name");
            var descElement = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "desc");
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
        function createCustomItem(name, label, action) {
            var menuitem = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "menuitem");
            var langElement = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "name");
            var descElement = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "desc");
            menuitem.addEventListener("mousedown", action, true);
            menuitem.addEventListener("touchstart", action, true);
            langElement.textContent = name;
            menuitem.appendChild(langElement);
            descElement.textContent = label;
            menuitem.appendChild(descElement);
            return menuitem;
        }
        function createMenu(langList) {
            clearMenu();
            if (langList.length > 0) {
                langList.forEach(function (lang) { return menu.appendChild(createMenuitem(lang)); });
                var hr = document.createElementNS(Keyboard.UX.keyboardNamespaceURI, "hr");
                menu.appendChild(hr);
            }
            if (allowCustomLayouts) {
                menu.appendChild(createCustomItem("", "Sprache hinzufügen", settingsItemDown));
            }
            if (Keyboard.UX.isVisible()) {
                menu.appendChild(createCustomItem("\u2328", "Verstecken", function (event) {
                    Keyboard.UX.hide();
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                }));
            }
            menu.style.display = "block";
            window.addEventListener("mousedown", globalDown, true);
            window.addEventListener("touchstart", globalDown, true);
        }
        Menu.createMenu = createMenu;
        function clearMenu() {
            while (menu.firstChild) {
                menu.removeChild(menu.firstChild);
            }
            menu.style.display = "";
        }
        var toggle = createCustomItem("\u2328", "Anzeigen", function (event) {
            Keyboard.UX.show();
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
        });
        Keyboard.UX.element.appendChild(toggle);
    })(Menu = Keyboard.Menu || (Keyboard.Menu = {}));
})(Keyboard || (Keyboard = {}));
if (Keyboard20180928Configuration.loadLazy) {
    Keyboard.lazyLoadKeyboards(Keyboard20180928Configuration.layouts, Keyboard20180928Configuration.hidden).then(function (s) { return console.log("lazy", s); });
}
else {
    Keyboard.loadKeyboards(Keyboard20180928Configuration.layouts, Keyboard20180928Configuration.hidden).then(function (s) { return console.log("normal", s); });
}
//# sourceMappingURL=keyboard.js.map