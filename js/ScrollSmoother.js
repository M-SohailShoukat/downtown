(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.window = global.window || {}));
}(this, (function (exports) { 'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /*!
   * ScrollSmoother 3.11.5
   * https://greensock.com
   *
   * @license Copyright 2008-2023, GreenSock. All rights reserved.
   * Subject to the terms at https://greensock.com/standard-license or for
   * Club GreenSock members, the agreement issued with that membership.
   * @author: Jack Doyle, jack@greensock.com
  */
  var gsap,
      _coreInitted,
      _win,
      _doc,
      _docEl,
      _body,
      _toArray,
      _clamp,
      ScrollTrigger,
      _mainInstance,
      _expo,
      _getVelocityProp,
      _inputObserver,
      _context,
      _onResizeDelayedCall,
      _windowExists = function _windowExists() {
    return typeof window !== "undefined";
  },
      _getGSAP = function _getGSAP() {
    return gsap || _windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap;
  },
      _round = function _round(value) {
    return Math.round(value * 100000) / 100000 || 0;
  },
      _autoDistance = function _autoDistance(el, progress) {
    var parent = el.parentNode || _docEl,
        b1 = el.getBoundingClientRect(),
        b2 = parent.getBoundingClientRect(),
        gapTop = b2.top - b1.top,
        gapBottom = b2.bottom - b1.bottom,
        change = (Math.abs(gapTop) > Math.abs(gapBottom) ? gapTop : gapBottom) / (1 - progress),
        offset = -change * progress,
        ratio,
        extraChange;

    if (change > 0) {
      ratio = b2.height / (_win.innerHeight + b2.height);
      extraChange = ratio === 0.5 ? b2.height * 2 : Math.min(b2.height, -change * ratio / (2 * ratio - 1)) * 2 * (progress || 1);
      offset += progress ? -extraChange * progress : -extraChange / 2;
      change += extraChange;
    }

    return {
      change: change,
      offset: offset
    };
  },
      _wrap = function _wrap(el) {
    var wrapper = _doc.querySelector(".ScrollSmoother-wrapper");

    if (!wrapper) {
      wrapper = _doc.createElement("div");
      wrapper.classList.add("ScrollSmoother-wrapper");
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    }

    return wrapper;
  };

  var ScrollSmoother = function () {
    function ScrollSmoother(vars) {
      var _this = this;

      _coreInitted || ScrollSmoother.register(gsap) || console.warn("Please gsap.registerPlugin(ScrollSmoother)");
      vars = this.vars = vars || {};
      _mainInstance && _mainInstance.kill();
      _mainInstance = this;

      _context(this);

      var _vars = vars,
          smoothTouch = _vars.smoothTouch,
          _onUpdate = _vars.onUpdate,
          onStop = _vars.onStop,
          smooth = _vars.smooth,
          onFocusIn = _vars.onFocusIn,
          normalizeScroll = _vars.normalizeScroll,
          wholePixels = _vars.wholePixels,
          content,
          wrapper,
          height,
          mainST,
          effects,
          sections,
          intervalID,
          wrapperCSS,
          contentCSS,
          paused,
          pausedNormalizer,
          recordedRefreshScroll,
          recordedRefreshScrub,
          self = this,
          effectsPrefix = vars.effectsPrefix || "",
          scrollFunc = ScrollTrigger.getScrollFunc(_win),
          smoothDuration = ScrollTrigger.isTouch === 1 ? smoothTouch === true ? 0.8 : parseFloat(smoothTouch) || 0 : smooth === 0 || smooth === false ? 0 : parseFloat(smooth) || 0.8,
          speed = smoothDuration && +vars.speed || 1,
          currentY = 0,
          delta = 0,
          startupPhase = 1,
          tracker = _getVelocityProp(0),
          updateVelocity = function updateVelocity() {
        return tracker.update(-currentY);
      },
          scroll = {
        y: 0
      },
          removeScroll = function removeScroll() {
        return content.style.overflow = "visible";
      },
          isProxyScrolling,
          killScrub = function killScrub(trigger) {
        trigger.update();
        var scrub = trigger.getTween();

        if (scrub) {
          scrub.pause();
          scrub._time = scrub._dur;
          scrub._tTime = scrub._tDur;
        }

        isProxyScrolling = false;
        trigger.animation.progress(trigger.progress, true);
      },
          render = function render(y, force) {
        if (y !== currentY && !paused || force) {
          wholePixels && (y = Math.round(y));

          if (smoothDuration) {
            content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + y + ", 0, 1)";
            content._gsap.y = y + "px";
          }

          delta = y - currentY;
          currentY = y;
          ScrollTrigger.isUpdating || ScrollSmoother.isRefreshing || ScrollTrigger.update();
        }
      },
          scrollTop = function scrollTop(value) {
        if (arguments.length) {
          value < 0 && (value = 0);
          scroll.y = -value;
          isProxyScrolling = true;
          paused ? currentY = -value : render(-value);
          ScrollTrigger.isRefreshing ? mainST.update() : scrollFunc(value / speed);
          return this;
        }

        return -currentY;
      },
          resizeObserver = typeof ResizeObserver !== "undefined" && vars.autoResize !== false && new ResizeObserver(function () {
        if (!ScrollTrigger.isRefreshing) {
          var max = ScrollTrigger.maxScroll(wrapper);
          max < -currentY && scrollTop(max);

          _onResizeDelayedCall.restart(true);
        }
      }),
          lastFocusElement,
          _onFocusIn = function _onFocusIn(e) {
        wrapper.scrollTop = 0;

        if (e.target.contains && e.target.contains(wrapper) || onFocusIn && onFocusIn(_this, e) === false) {
          return;
        }

        ScrollTrigger.isInViewport(e.target) || e.target === lastFocusElement || _this.scrollTo(e.target, false, "center center");
        lastFocusElement = e.target;
      },
          adjustParallaxPosition = function adjustParallaxPosition(triggers, createdAfterEffectWasApplied) {
        var pins, start, dif, markers;
        effects.forEach(function (st) {
          pins = st.pins;
          markers = st.markers;
          triggers.forEach(function (trig) {
            if (st.trigger && trig.trigger && st !== trig && (trig.trigger === st.trigger || trig.pinnedContainer === st.trigger || st.trigger.contains(trig.trigger))) {
              start = trig.start;
              dif = (start - st.start - st.offset) / st.ratio - (start - st.start);
              pins.forEach(function (p) {
                return dif -= p.distance / st.ratio - p.distance;
              });
              trig.setPositions(start + dif, trig.end + dif);
              trig.markerStart && markers.push(gsap.quickSetter([trig.markerStart, trig.markerEnd], "y", "px"));

              if (trig.pin && trig.end > 0) {
                dif = trig.end - trig.start;
                pins.push({
                  start: trig.start,
                  end: trig.end,
                  distance: dif,
                  trig: trig
                });
                st.setPositions(st.start, st.end + dif);
                st.vars.onRefresh(st);
              }
            }
          });
        });
      },
          onRefresh = function onRefresh() {
        removeScroll();
        requestAnimationFrame(removeScroll);

        if (effects) {
          effects.forEach(function (st) {
            var start = st.start,
                end = st.auto ? Math.min(ScrollTrigger.maxScroll(st.scroller), st.end) : start + (st.end - start) / st.ratio,
                offset = (end - st.end) / 2;
            start -= offset;
            end -= offset;
            st.offset = offset || 0.0001;
            st.pins.length = 0;
            st.setPositions(Math.min(start, end), Math.max(start, end));
            st.vars.onRefresh(st);
          });
          adjustParallaxPosition(ScrollTrigger.sort());
        }

        tracker.reset();
      },
          addOnRefresh = function addOnRefresh() {
        return ScrollTrigger.addEventListener("refresh", onRefresh);
      },
          restoreEffects = function restoreEffects() {
        return effects && effects.forEach(function (st) {
          return st.vars.onRefresh(st);
        });
      },
          revertEffects = function revertEffects() {
        effects && effects.forEach(function (st) {
          return st.vars.onRefreshInit(st);
        });
        return restoreEffects;
      },
          effectValueGetter = function effectValueGetter(name, value, index, el) {
        return function () {
          var v = typeof value === "function" ? value(index, el) : value;
          v || v === 0 || (v = el.getAttribute("data-" + effectsPrefix + name) || (name === "speed" ? 1 : 0));
          el.setAttribute("data-" + effectsPrefix + name, v);
          return v === "auto" ? v : parseFloat(v);
        };
      },
          createEffect = function createEffect(el, speed, lag, index, effectsPadding) {
        effectsPadding = (typeof effectsPadding === "function" ? effectsPadding(index, el) : effectsPadding) || 0;

        var getSpeed = effectValueGetter("speed", speed, index, el),
            getLag = effectValueGetter("lag", lag, index, el),
            startY = gsap.getProperty(el, "y"),
            cache = el._gsap,
            ratio,
            st,
            autoSpeed,
            scrub,
            progressOffset,
            yOffset,
            initDynamicValues = function initDynamicValues() {
          speed = getSpeed();
          lag = getLag();
          ratio = parseFloat(speed) || 1;
          autoSpeed = speed === "auto";
          progressOffset = autoSpeed ? 0 : 0.5;
          scrub && scrub.kill();
          scrub = lag && gsap.to(el, {
            ease: _expo,
            overwrite: false,
            y: "+=0",
            duration: lag
          });

          if (st) {
            st.ratio = ratio;
            st.autoSpeed = autoSpeed;
          }
        },
            revert = function revert() {
          cache.y = startY + "px";
          cache.renderTransform(1);
          initDynamicValues();
        },
            pins = [],
            markers = [],
            change = 0,
            updateChange = function updateChange(self) {
          if (autoSpeed) {
            revert();

            var auto = _autoDistance(el, _clamp(0, 1, -self.start / (self.end - self.start)));

            change = auto.change;
            yOffset = auto.offset;
          } else {
            change = (self.end - self.start) * (1 - ratio);
            yOffset = 0;
          }

          pins.forEach(function (p) {
            return change -= p.distance * (1 - ratio);
          });
          self.vars.onUpdate(self);
          scrub && scrub.progress(1);
        };

        initDynamicValues();

        if (ratio !== 1 || autoSpeed || scrub) {
          st = ScrollTrigger.create({
            trigger: autoSpeed ? el.parentNode : el,
            start: "top bottom+=" + effectsPadding,
            end: "bottom top-=" + effectsPadding,
            scroller: wrapper,
            scrub: true,
            refreshPriority: -999,
            onRefreshInit: revert,
            onRefresh: updateChange,
            onKill: function onKill(self) {
              var i = effects.indexOf(self);
              i >= 0 && effects.splice(i, 1);
              revert();
            },
            onUpdate: function onUpdate(self) {
              var y = startY + change * (self.progress - progressOffset),
                  i = pins.length,
                  extraY = 0,
                  pin,
                  scrollY,
                  end;

              if (self.offset) {
                if (i) {
                  scrollY = -currentY;
                  end = self.end;

                  while (i--) {
                    pin = pins[i];

                    if (pin.trig.isActive || scrollY >= pin.start && scrollY <= pin.end) {
                      if (scrub) {
                        pin.trig.progress += pin.trig.direction < 0 ? 0.001 : -0.001;
                        pin.trig.update(0, 0, 1);
                        scrub.resetTo("y", parseFloat(cache.y), -delta, true);
                        startupPhase && scrub.progress(1);
                      }

                      return;
                    }

                    scrollY > pin.end && (extraY += pin.distance);
                    end -= pin.distance;
                  }

                  y = startY + extraY + change * ((gsap.utils.clamp(self.start, self.end, scrollY) - self.start - extraY) / (end - self.start) - progressOffset);
                }

                y = _round(y + yOffset);
                markers.length && !autoSpeed && markers.forEach(function (setter) {
                  return setter(y - extraY);
                });

                if (scrub) {
                  scrub.resetTo("y", y, -delta, true);
                  startupPhase && scrub.progress(1);
                } else {
                  cache.y = y + "px";
                  cache.renderTransform(1);
                }
              }
            }
          });
          updateChange(st);
          gsap.core.getCache(st.trigger).stRevert = revertEffects;
          st.startY = startY;
          st.pins = pins;
          st.markers = markers;
          st.ratio = ratio;
          st.autoSpeed = autoSpeed;
          el.style.willChange = "transform";
        }

        return st;
      };

      addOnRefresh();
      ScrollTrigger.addEventListener("killAll", addOnRefresh);
      gsap.delayedCall(0.5, function () {
        return startupPhase = 0;
      });
      this.scrollTop = scrollTop;

      this.scrollTo = function (target, smooth, position) {
        var p = gsap.utils.clamp(0, ScrollTrigger.maxScroll(_win), isNaN(target) ? _this.offset(target, position) : +target);
        !smooth ? scrollTop(p) : paused ? gsap.to(_this, {
          duration: smoothDuration,
          scrollTop: p,
          overwrite: "auto",
          ease: _expo
        }) : scrollFunc(p);
      };

      this.offset = function (target, position) {
        target = _toArray(target)[0];
        var cssText = target.style.cssText,
            st = ScrollTrigger.create({
          trigger: target,
          start: position || "top top"
        }),
            y;
        effects && adjustParallaxPosition([st]);
        y = st.start / speed;
        st.kill(false);
        target.style.cssText = cssText;
        gsap.core.getCache(target).uncache = 1;
        return y;
      };

      function refreshHeight() {
        height = content.clientHeight;
        content.style.overflow = "visible";
        _body.style.height = _win.innerHeight + (height - _win.innerHeight) / speed + "px";
        return height - _win.innerHeight;
      }

      this.content = function (element) {
        if (arguments.length) {
          var newContent = _toArray(element || "#smooth-content")[0] || console.warn("ScrollSmoother needs a valid content element.") || _body.children[0];

          if (newContent !== content) {
            content = newContent;
            contentCSS = content.getAttribute("style") || "";
            resizeObserver && resizeObserver.observe(content);
            gsap.set(content, {
              overflow: "visible",
              width: "100%",
              boxSizing: "border-box",
              y: "+=0"
            });
            smoothDuration || gsap.set(content, {
              clearProps: "transform"
            });
          }

          return this;
        }

        return content;
      };

      this.wrapper = function (element) {
        if (arguments.length) {
          wrapper = _toArray(element || "#smooth-wrapper")[0] || _wrap(content);
          wrapperCSS = wrapper.getAttribute("style") || "";
          refreshHeight();
          gsap.set(wrapper, smoothDuration ? {
            overflow: "hidden",
            position: "fixed",
            height: "100%",
            width: "100%",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          } : {
            overflow: "visible",
            position: "relative",
            width: "100%",
            height: "auto",
            top: "auto",
            bottom: "auto",
            left: "auto",
            right: "auto"
          });
          return this;
        }

        return wrapper;
      };

      this.effects = function (targets, config) {
        var _effects;

        effects || (effects = []);

        if (!targets) {
          return effects.slice(0);
        }

        targets = _toArray(targets);
        targets.forEach(function (target) {
          var i = effects.length;

          while (i--) {
            effects[i].trigger === target && effects[i].kill();
          }
        });
        config = config || {};
        var _config = config,
            speed = _config.speed,
            lag = _config.lag,
            effectsPadding = _config.effectsPadding,
            effectsToAdd = [],
            i,
            st;

        for (i = 0; i < targets.length; i++) {
          st = createEffect(targets[i], speed, lag, i, effectsPadding);
          st && effectsToAdd.push(st);
        }

        (_effects = effects).push.apply(_effects, effectsToAdd);

        return effectsToAdd;
      };

      this.sections = function (targets, config) {
        var _sections;

        sections || (sections = []);

        if (!targets) {
          return sections.slice(0);
        }

        var newSections = _toArray(targets).map(function (el) {
          return ScrollTrigger.create({
            trigger: el,
            start: "top 120%",
            end: "bottom -20%",
            onToggle: function onToggle(self) {
              el.style.opacity = self.isActive ? "1" : "0";
              el.style.pointerEvents = self.isActive ? "all" : "none";
            }
          });
        });

        config && config.add ? (_sections = sections).push.apply(_sections, newSections) : sections = newSections.slice(0);
        return newSections;
      };

      this.content(vars.content);
      this.wrapper(vars.wrapper);

      this.render = function (y) {
        return render(y || y === 0 ? y : currentY);
      };

      this.getVelocity = function () {
        return tracker.getVelocity(-currentY);
      };

      ScrollTrigger.scrollerProxy(wrapper, {
        scrollTop: scrollTop,
        scrollHeight: function scrollHeight() {
          return refreshHeight() && _body.scrollHeight;
        },
        fixedMarkers: vars.fixedMarkers !== false && !!smoothDuration,
        content: content,
        getBoundingClientRect: function getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: _win.innerWidth,
            height: _win.innerHeight
          };
        }
      });
      ScrollTrigger.defaults({
        scroller: wrapper
      });
      var existingScrollTriggers = ScrollTrigger.getAll().filter(function (st) {
        return st.scroller === _win || st.scroller === wrapper;
      });
      existingScrollTriggers.forEach(function (st) {
        return st.revert(true, true);
      });
      mainST = ScrollTrigger.create({
        animation: gsap.fromTo(scroll, {
          y: 0
        }, {
          y: function y() {
            return -refreshHeight();
          },
          immediateRender: false,
          ease: "none",
          data: "ScrollSmoother",
          duration: 100,
          onUpdate: function onUpdate() {
            if (this._dur) {
              var force = isProxyScrolling;

              if (force) {
                killScrub(mainST);
                scroll.y = currentY;
              }

              render(scroll.y, force);
              updateVelocity();
              _onUpdate && !paused && _onUpdate(self);
            }
          }
        }),
        onRefreshInit: function onRefreshInit(self) {
          ScrollSmoother.isRefreshing = true;

          if (effects) {
            var pins = ScrollTrigger.getAll().filter(function (st) {
              return !!st.pin;
            });
            effects.forEach(function (st) {
              if (!st.vars.pinnedContainer) {
                pins.forEach(function (pinST) {
                  if (pinST.pin.contains(st.trigger)) {
                    var v = st.vars;
                    v.pinnedContainer = pinST.pin;
                    st.vars = null;
                    st.init(v, st.animation);
                  }
                });
              }
            });
          }

          var scrub = self.getTween();
          recordedRefreshScrub = scrub && scrub._end > scrub._dp._time;
          recordedRefreshScroll = currentY;
          scroll.y = 0;

          if (smoothDuration) {
            ScrollTrigger.isTouch === 1 && (wrapper.style.position = "absolute");
            wrapper.scrollTop = 0;
            ScrollTrigger.isTouch === 1 && (wrapper.style.position = "fixed");
          }
        },
        onRefresh: function onRefresh(self) {
          self.animation.invalidate();
          self.setPositions(self.start, refreshHeight() / speed);
          recordedRefreshScrub || killScrub(self);
          scroll.y = -scrollFunc() * speed;
          render(scroll.y);
          startupPhase || self.animation.progress(gsap.utils.clamp(0, 1, recordedRefreshScroll / speed / -self.end));

          if (recordedRefreshScrub) {
            self.progress -= 0.001;
            self.update();
          }

          ScrollSmoother.isRefreshing = false;
        },
        id: "ScrollSmoother",
        scroller: _win,
        invalidateOnRefresh: true,
        start: 0,
        refreshPriority: -9999,
        end: function end() {
          return refreshHeight() / speed;
        },
        onScrubComplete: function onScrubComplete() {
          tracker.reset();
          onStop && onStop(_this);
        },
        scrub: smoothDuration || true
      });

      this.smooth = function (value) {
        if (arguments.length) {
          smoothDuration = value || 0;
          speed = smoothDuration && +vars.speed || 1;
          mainST.scrubDuration(value);
        }

        return mainST.getTween() ? mainST.getTween().duration() : 0;
      };

      mainST.getTween() && (mainST.getTween().vars.ease = vars.ease || _expo);
      this.scrollTrigger = mainST;
      vars.effects && this.effects(vars.effects === true ? "[data-" + effectsPrefix + "speed], [data-" + effectsPrefix + "lag]" : vars.effects, {
        effectsPadding: vars.effectsPadding
      });
      vars.sections && this.sections(vars.sections === true ? "[data-section]" : vars.sections);
      existingScrollTriggers.forEach(function (st) {
        st.vars.scroller = wrapper;
        st.revert(false, true);
        st.init(st.vars, st.animation);
      });

      this.paused = function (value, allowNestedScroll) {
        if (arguments.length) {
          if (!!paused !== value) {
            if (value) {
              mainST.getTween() && mainST.getTween().pause();
              scrollFunc(-currentY / speed);
              tracker.reset();
              pausedNormalizer = ScrollTrigger.normalizeScroll();
              pausedNormalizer && pausedNormalizer.disable();
              paused = ScrollTrigger.observe({
                preventDefault: true,
                type: "wheel,touch,scroll",
                debounce: false,
                allowClicks: true,
                onChangeY: function onChangeY() {
                  return scrollTop(-currentY);
                }
              });
              paused.nested = _inputObserver(_docEl, "wheel,touch,scroll", true, allowNestedScroll !== false);
            } else {
              paused.nested.kill();
              paused.kill();
              paused = 0;
              pausedNormalizer && pausedNormalizer.enable();
              mainST.progress = (-currentY / speed - mainST.start) / (mainST.end - mainST.start);
              killScrub(mainST);
            }
          }

          return this;
        }

        return !!paused;
      };

      this.kill = this.revert = function () {
        _this.paused(false);

        killScrub(mainST);
        mainST.kill();
        var triggers = (effects || []).concat(sections || []),
            i = triggers.length;

        while (i--) {
          triggers[i].kill();
        }

        ScrollTrigger.scrollerProxy(wrapper);
        ScrollTrigger.removeEventListener("killAll", addOnRefresh);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        wrapper.style.cssText = wrapperCSS;
        content.style.cssText = contentCSS;
        var defaults = ScrollTrigger.defaults({});
        defaults && defaults.scroller === wrapper && ScrollTrigger.defaults({
          scroller: _win
        });
        _this.normalizer && ScrollTrigger.normalizeScroll(false);
        clearInterval(intervalID);
        _mainInstance = null;
        resizeObserver && resizeObserver.disconnect();

        _body.style.removeProperty("height");

        _win.removeEventListener("focusin", _onFocusIn);
      };

      this.refresh = function (soft, force) {
        return mainST.refresh(soft, force);
      };

      if (normalizeScroll) {
        this.normalizer = ScrollTrigger.normalizeScroll(normalizeScroll === true ? {
          debounce: true,
          content: !smoothDuration && content
        } : normalizeScroll);
      }

      ScrollTrigger.config(vars);
      "overscrollBehavior" in _win.getComputedStyle(_body) && gsap.set([_body, _docEl], {
        overscrollBehavior: "none"
      });
      "scrollBehavior" in _win.getComputedStyle(_body) && gsap.set([_body, _docEl], {
        scrollBehavior: "auto"
      });

      _win.addEventListener("focusin", _onFocusIn);

      intervalID = setInterval(updateVelocity, 250);
      _doc.readyState === "loading" || requestAnimationFrame(function () {
        return ScrollTrigger.refresh();
      });
    }

    ScrollSmoother.register = function register(core) {
      if (!_coreInitted) {
        gsap = core || _getGSAP();

        if (_windowExists() && window.document) {
          _win = window;
          _doc = document;
          _docEl = _doc.documentElement;
          _body = _doc.body;
        }

        if (gsap) {
          _toArray = gsap.utils.toArray;
          _clamp = gsap.utils.clamp;
          _expo = gsap.parseEase("expo");

          _context = gsap.core.context || function () {};

          _onResizeDelayedCall = gsap.delayedCall(0.2, function () {
            return ScrollTrigger.isRefreshing || _mainInstance && _mainInstance.refresh();
          }).pause();
          ScrollTrigger = gsap.core.globals().ScrollTrigger;
          gsap.core.globals("ScrollSmoother", ScrollSmoother);

          if (_body && ScrollTrigger) {
            _getVelocityProp = ScrollTrigger.core._getVelocityProp;
            _inputObserver = ScrollTrigger.core._inputObserver;
            ScrollSmoother.refresh = ScrollTrigger.refresh;
            _coreInitted = 1;
          }
        }
      }

      return _coreInitted;
    };

    _createClass(ScrollSmoother, [{
      key: "progress",
      get: function get() {
        return this.scrollTrigger ? this.scrollTrigger.animation._time / 100 : 0;
      }
    }]);

    return ScrollSmoother;
  }();
  ScrollSmoother.version = "3.11.5";

  ScrollSmoother.create = function (vars) {
    return _mainInstance && vars && _mainInstance.content() === _toArray(vars.content)[0] ? _mainInstance : new ScrollSmoother(vars);
  };

  ScrollSmoother.get = function () {
    return _mainInstance;
  };

  _getGSAP() && gsap.registerPlugin(ScrollSmoother);

  exports.ScrollSmoother = ScrollSmoother;
  exports.default = ScrollSmoother;

  if (typeof(window) === 'undefined' || window !== exports) {Object.defineProperty(exports, '__esModule', { value: true });} else {delete window.default;}

})));