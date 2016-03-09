"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BareFoot = function () {
  function BareFoot() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, BareFoot);

    var DEFAULTS = {
      scope: 'body',
      divFootnotesQuery: ".footnotes",
      footnotesQuery: "[id^='fn']",
      supQuery: 'a[href^="#fnref"]',
      fnButtonMarkup: "<button class=\"footnote-button\" id=\"{{FOOTNOTEREFID}}\" data-footnote=\"{{FOOTNOTEID}}\" alt=\"See Footnote {{FOOTNOTENUMBER}}\" rel=\"footnote\" data-fn-number=\"{{FOOTNOTENUMBER}}\" data-fn-content=\"{{FOOTNOTECONTENT}}\"></button>",
      fnContentMarkup: "<div class=\"bf-footnote\" id=\"{{FOOTNOTEID}}\"><div class=\"footnote-wrapper\"><div class=\"footnote-content\" tabindex=\"0\">{{FOOTNOTECONTENT}}</div></div><div class=\"footnote-tooltip\" aria-hidden=\"true\"></div>",
      activeCallback: null,
      activeBtnClass: 'is-active',
      activeFnClass: 'footnote-is-active',
      backdropClass: 'footnote-backdrop',
      buttonClass: 'footnote-button',
      fnContainer: 'footnote-container',
      fnClass: 'bf-footnote',
      fnContentClass: 'footnote-content',
      fnWrapperClass: 'footnote-wrapper',
      tooltipClass: 'footnote-tooltip',
      fnOnTopClass: 'footnote-is-top'
    };

    this.config = _extends({}, DEFAULTS, options);

    // A selector could select multiple containers
    this.divFootnotes = [].slice.call(document.querySelectorAll(this.config.divFootnotesQuery));

    // Returns if no container
    if (!this.divFootnotes) return false;

    // Groups all footnotes within every group.
    this.footnotes = this.divFootnotes.map(function (el) {
      return el.querySelectorAll(_this.config.footnotesQuery);
    });

    // Polyfill for Element.matches()
    // Based on https://davidwalsh.name/element-matches-selector

    Element.prototype.matches = Element.prototype.matches || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
      return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
    };

    // Polyfill for Element.closest()
    // Based on http://stackoverflow.com/questions/18663941/finding-closest-element-without-jquery

    Element.prototype.closest = Element.prototype.closest || function (s) {
      var el = this;

      while (el !== null) {
        var parent = el.parentElement;
        if (parent !== null && parent.matches(s)) {
          return parent;
        }
        el = parent;
      }
      return null;
    };

    // Calculate vertical scrollbar width
    // Inspired by https://davidwalsh.name/detect-scrollbar-width

    var scrollDiv = document.createElement('div');
    scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px; visibility: hidden;';
    document.body.appendChild(scrollDiv);
    this.scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
  }

  _createClass(BareFoot, [{
    key: "removeBackLinks",
    value: function removeBackLinks(fnHtml, backId) {
      var regex = void 0;

      if (backId.indexOf(' ') >= 0) {
        backId = backId.trim().replace(/\s+/g, "|").replace(/(.*)/g, "($1)");
      }

      if (backId.indexOf('#') === 0) {
        backId = backId.slice(1);
      }

      regex = new RegExp("(\\s|&nbsp;)*<\\s*a[^#<]*#" + backId + "[^>]*>(.*?)<\\s*/\\s*a>", "g");

      return fnHtml.replace(regex, "").replace("[]", "");
    }
  }, {
    key: "buildButton",
    value: function buildButton(ref, id, n, content) {
      return this.config.fnButtonMarkup.replace(/\{\{FOOTNOTEREFID\}\}/g, ref).replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTENUMBER\}\}/g, n).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }
  }, {
    key: "buildContent",
    value: function buildContent(id, content) {
      return this.config.fnContentMarkup.replace(/\{\{FOOTNOTEID\}\}/g, id).replace(/\{\{FOOTNOTECONTENT\}\}/g, content);
    }
  }, {
    key: "clickAction",
    value: function clickAction(e) {
      var btn = void 0,
          content = void 0,
          id = void 0,
          fnHtml = void 0,
          fn = void 0,
          windowHeight = void 0,
          scrollHeight = void 0;

      btn = e.target;
      content = btn.getAttribute('data-fn-content');
      id = btn.getAttribute("data-footnote");
      scrollHeight = this.getScrollHeight();

      if (!btn.nextElementSibling) {
        this.dismissFootnotes();
        fnHtml = this.buildContent(id, content);
        btn.insertAdjacentHTML('afterend', fnHtml);
        fn = btn.nextElementSibling;

        this.calculateOffset(fn, btn);
        this.calculateSpacing(fn, scrollHeight);

        btn.classList.add(this.config.activeBtnClass);
        fn.classList.add(this.config.activeFnClass);

        fn.querySelector("." + this.config.fnContentClass).focus();

        if ('ontouchstart' in document.documentElement) {
          document.body.classList.add(this.config.backdropClass);
        }

        if (this.config.activeCallback) {
          this.config.activeCallback(btn, fn);
        }
      } else {
        this.dismissFootnotes();
      }
    }
  }, {
    key: "calculateOffset",
    value: function calculateOffset(fn, btn) {
      var tooltip = void 0,
          container = void 0,
          btnOffset = void 0,
          btnWidth = void 0,
          contWidth = void 0,
          contOffset = void 0,
          wrapWidth = void 0,
          wrapMove = void 0,
          wrapOffset = void 0,
          tipWidth = void 0,
          tipOffset = void 0,
          windowWidth = void 0;

      btn = btn || fn.previousElementSibling;

      btnOffset = btn.offsetLeft;
      btnWidth = btn.offsetWidth;
      tooltip = fn.querySelector("." + this.config.tooltipClass);
      tipWidth = tooltip.clientWidth;
      container = fn.parentNode;
      contWidth = container.clientWidth;
      contOffset = container.offsetLeft;
      wrapWidth = fn.offsetWidth;
      wrapMove = -(wrapWidth / 2 - contWidth / 2);
      windowWidth = window.innerWidth || window.availWidth;

      if (contOffset + wrapMove < 0) {
        wrapMove = wrapMove - (contOffset + wrapMove);
      } else if (contOffset + wrapMove + wrapWidth + this.scrollBarWidth > windowWidth) {
        wrapMove = wrapMove - (contOffset + wrapMove + wrapWidth + this.scrollBarWidth + contWidth / 2 - windowWidth);
      }

      fn.style.left = wrapMove + "px";
      wrapOffset = contOffset + wrapMove;
      tipOffset = contOffset - wrapOffset + contWidth / 2 - tipWidth / 2;
      tooltip.style.left = tipOffset + "px";
    }
  }, {
    key: "removeFootnoteChild",
    value: function removeFootnoteChild(el) {
      return el.parentNode.removeChild(el);
    }
  }, {
    key: "debounce",
    value: function debounce(func, wait, immediate) {
      var timeout;
      return function () {
        var _this2 = this;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var later = function later() {
          timeout = null;
          if (!immediate) func.apply(_this2, args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (immediate && !timeout) func.apply(this, args);
      };
    }
  }, {
    key: "resizeAction",
    value: function resizeAction() {
      var _this3 = this;

      var footnotes = document.querySelectorAll("." + this.config.activeFnClass);

      if (footnotes.length) {
        [].forEach.call(footnotes, function (fn) {
          _this3.calculateOffset(fn);
          _this3.calculateSpacing(fn);
        });
      }
    }
  }, {
    key: "getScrollHeight",
    value: function getScrollHeight() {
      return document.documentElement.scrollHeight;
    }
  }, {
    key: "calculateSpacing",
    value: function calculateSpacing(fn, height) {
      var bcr = void 0,
          bch = void 0,
          bcb = void 0,
          margins = void 0,
          windowHeight = void 0;
      margins = this.calculateMargins(fn);
      windowHeight = window.innerHeight || window.availHeight;

      bcr = fn.getBoundingClientRect();
      bch = bcr.height;
      bcb = bcr.bottom;

      if (height < this.getScrollHeight() || bcb > windowHeight - margins.bottom) {
        fn.classList.add(this.config.fnOnTopClass);
      } else if (windowHeight - (bch + margins.top) > bcb && fn.classList.contains(this.config.fnOnTopClass)) {
        fn.classList.remove(this.config.fnOnTopClass);
      }
    }
  }, {
    key: "scrollAction",
    value: function scrollAction() {
      var _this4 = this;

      var footnotes = document.querySelectorAll("." + this.config.activeFnClass);

      if (footnotes.length) {
        var windowHeight = window.innerHeight || window.availHeight,
            margins = this.calculateMargins(footnotes[0]);

        [].forEach.call(footnotes, function (el) {
          _this4.calculateSpacing(el);
        });
      }
    }
  }, {
    key: "calculateMargins",
    value: function calculateMargins(fn) {

      var computedStyle = window.getComputedStyle(fn, null);
      return {
        top: parseFloat(computedStyle.marginTop),
        right: parseFloat(computedStyle.marginRight),
        bottom: parseFloat(computedStyle.marginBottom),
        left: parseFloat(computedStyle.marginLeft)
      };
    }
  }, {
    key: "documentAction",
    value: function documentAction(ev) {
      if (!ev.target.closest("." + this.config.fnContainer)) this.dismissFootnotes();
    }
  }, {
    key: "dismissFootnotes",
    value: function dismissFootnotes() {
      var _this5 = this;

      var footnotes = document.querySelectorAll("." + this.config.activeFnClass);

      if (footnotes.length) {
        [].forEach.call(footnotes, function (el) {
          el.previousElementSibling.classList.remove(_this5.config.activeBtnClass);
          el.addEventListener('transitionend', _this5.removeFootnoteChild(el), false);
          el.classList.remove(_this5.config.activeFnClass);
        });
      }

      if (document.body.classList.contains(this.config.backdropClass)) document.body.classList.remove(this.config.backdropClass);
    }
  }, {
    key: "init",
    value: function init() {
      var _this6 = this;

      [].forEach.call(this.footnotes, function (fns, i) {
        var currentScope = fns[0].closest(_this6.config.scope);

        [].forEach.call(fns, function (fn, i) {
          var fnContent = void 0,
              fnHrefId = void 0,
              fnId = void 0,
              ref = void 0,
              fnRefN = void 0,
              footnote = void 0;

          fnRefN = i + 1;
          fnHrefId = fn.querySelector(_this6.config.supQuery).getAttribute('href');
          // Removes the hash from the href attribute. I had to appeal to this because there has been some issues parsing IDs with colons on querySelector. Yes, I tried to escape them, but no good.
          fnContent = _this6.removeBackLinks(fn.innerHTML.trim(), fnHrefId);

          fnContent = fnContent.replace(/"/g, "&quot;").replace(/&lt;/g, "&ltsym;").replace(/&gt;/g, "&gtsym;");

          if (fnContent.indexOf("<") !== 0) fnContent = "<p>" + fnContent + "</p>";

          ref = currentScope.querySelector(fnHrefId.replace(':', '\\:'));

          footnote = "<div class=\"" + _this6.config.fnContainer + "\">" + _this6.buildButton(fnHrefId, fn.id, fnRefN, fnContent) + "</div>";

          ref.insertAdjacentHTML('afterend', footnote);
          ref.parentNode.removeChild(ref);
        });
      });

      this.eventsSetup();
    }
  }, {
    key: "dismissOnEsc",
    value: function dismissOnEsc(e) {
      if (e.keyCode === 27 && document.activeElement.matches("." + this.config.fnContentClass)) {
        document.activeElement.closest("." + this.config.activeFnClass).previousElementSibling.focus();
        return this.dismissFootnotes();
      }
    }
  }, {
    key: "eventsSetup",
    value: function eventsSetup() {
      var _this7 = this;

      [].forEach.call(document.querySelectorAll("." + this.config.buttonClass), function (el) {
        el.addEventListener("click", _this7.clickAction.bind(_this7));
      });

      window.addEventListener("resize", this.debounce(this.resizeAction.bind(this), 100));
      window.addEventListener("scroll", this.debounce(this.scrollAction.bind(this), 100));
      window.addEventListener("keyup", this.dismissOnEsc.bind(this));
      document.body.addEventListener("click", this.documentAction.bind(this));
      document.body.addEventListener("touchend", this.documentAction.bind(this));

      this.divFootnotes.forEach(function (el) {
        return el.parentNode.removeChild(el);
      });
    }
  }]);

  return BareFoot;
}();