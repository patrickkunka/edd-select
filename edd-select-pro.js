/**!
 * EasyDropDown Select v3.0.0
 *
 * @copyright Copyright 2014 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://kunkalabs.com
 *
 * @license   Commercial use requires a commercial license.
 *
 *            Non-commercial use permitted under terms of CC-BY-NC license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function(window, document, undef) {

    'use strict';

    /**
     * EddSelect
     * @constructor
     * @param {object} DOM select element
     */

    var EddSelect = function(el, config) {

        var self = this,
            defaults = {

                /* Public Properties
                ---------------------------------------------------------------------- */

                animation: {
                    mixItUp: false
                },

                label: {
                    showOnOpen: true,
                    def: 'Select',
                    tags: true
                },

                items: {
                    addTitle: false
                },

                touch: {
                    useNative: true
                },

                scrolling: {
                    maxItems: 6,
                    maxHeight: false,
                    openAbove: false
                },

                markup: {
                    nameSpace: 'edd-',
                    wrapperClass: 'wrapper',
                    headClass: 'head',
                    selectWrapperClass: 'select-wrapper',
                    labelClass: 'label',
                    tagClass: 'tag',
                    caratClass: 'carat',
                    bodyClass: 'body',
                    itemsWrapperClass: 'items-wrapper',
                    groupClass: 'group',
                    groupLabelClass: 'group-label',
                    itemClass: 'item',

                    touchClass: 'touch',
                    selectedClass: 'selected',
                    focusClass: 'focus',
                    openClass: 'open',
                    scrollableClass: 'scrollable',
                    openAboveClass: 'open-above',
                    disabledClass: 'disabled',
                    topClass: 'top',
                    bottomClass: 'bottom'
                },

                callbacks: {
                    onEddLoad: null,
                    onEddOpen: null,
                    onEddClose: null,
                    onEddSelect: null
                },

                /* Private Properties
                ---------------------------------------------------------------------- */

                _instanceIndex: null,
                _id: '',
                _name: '',
                _label: '',
                _items: [],
                _totalItems: 0,
                _multiple: false,
                _grouped: false,
                _autofocus: false,
                _nativeMode: true,
                _selectedIndices: [],
                _focusedIndex: false,
                _inFocus: false,
                _clicking: false,
                _scrollable: false,
                _scrollingToView: false,
                _atTop: false,
                _atBottom: false,
                _open: false,
                _query: '',
                _resetQueryDelay: 1200,
                _resetQueryTimeout: null,
                _typing: false,
                _selecting: false,

                _pollInterval: null,
                _currentValue: '',
                _newValue: '',

                _eddWrapper: null,
                _eddHead: null,
                _eddSelectWrapper: null,
                _eddLabel: null,
                _eddCarat: null,
                _eddBody: null,
                _eddItemsWrapper: null,
                _eddItems: [],
                _eddForm: null,

                _$eddBody: null
            };

        for (var key in defaults) {
            this[key] = defaults[key];
        }

        for (var key in config) {
            if (typeof config[key] !== 'object') {
                this[key] = config[key];
            } else if (config[key] instanceof Object) {
                for (var subKey in config[key]) {
                    this[key][subKey] = config[key][subKey];
                }
            } else if (config[key] instanceof Array) {
                for (var i; i < config[key].length; i++) {
                    this[key][i] = config[key][i];
                }
            }
        }

        self._select = el;

        self._init();
    };

    /**
     * EddSelect.prototype
     * @override prototype
     */

    EddSelect.prototype = {

        /* Version
        ---------------------------------------------------------------------- */

        version: '3.0.0',

        /* Constructors
        ---------------------------------------------------------------------- */

        constructor: EddSelect,

        /**
         * Item 
         * @constructor
         */

        _Item: function(option) {
            this.disabled = option.disabled;
            this.selected = option.selected;
            this.value = option.value;
            this.text = option.text;
            this.label = option.label !== option.text ? option.label : false;
        },

        /* Static Properties
        ---------------------------------------------------------------------- */

        _instances: [],
        _hasMouse: false,

        /* Static Methods
        ---------------------------------------------------------------------- */

        /**
         * platformDetect
         * @since 3.0.0
         */

        _platformDetect: function() {
            var self = this,
                detectInput = function(e) {
                    var proto = EddSelect.prototype;

                    if (e.type === 'mousemove') {

                        proto._hasMouse = true;

                        for (var i = 0, instance; instance = proto._instances[i]; i++) {
                            instance._nativeMode = false;

                            proto._helpers.removeClass(instance._eddWrapper, 'touch');
                        } 

                    } else {
                        
                    }
                    
                    _helpers._off(document.documentElement, 'mousemove', detectInput);
                    _helpers._off(document.documentElement, 'touchstart', detectInput);
                };

            /* Polyfills
            ---------------------------------------------------------------------- */

            /**
             * previousElementSibling
             * @since 3.0.0
             */

            if (document.createElement('div').previousElementSibling === undef) {
                Object.defineProperty(Element.prototype, 'previousElementSibling', {
                    get: function() {
                        var el = this.previousSibling;
                        while (el) {
                            if (el.nodeType === 1) {
                                return el;
                            }
                            el = el.previousSibling;
                        }
                        return null;
                    }
                });
            }

            /**
             * indexOf
             * @since 3.0.0
             */

            if (!Array.prototype.indexOf) {
                Array.prototype.indexOf = function(elt) {
                    var len = this.length >>> 0;

                    var from = Number(arguments[1]) || 0;
                    from = (from < 0) ? 
                        Math.ceil(from) : 
                        Math.floor(from);
                    if (from < 0)
                        from += len;

                    for (; from < len; from++) {
                      if (from in this && this[from] === elt)
                        return from;
                    }
                    return -1;
                };
            }

            /* Input Tests
            ---------------------------------------------------------------------- */

            _helpers._on(document.documentElement, 'mousemove', detectInput);
            _helpers._on(document.documentElement, 'mousewheel', detectInput);
            _helpers._on(document.documentElement, 'touchstart', detectInput);
        },

        /**
         * trawlDOM
         * @since 3.0.0
         */

        _trawlDOM: function() {
            var self = this,
                selects = document.getElementsByTagName('select');

            for (var i = 0, select; select = selects[i]; i++) {
                if (_helpers._hasClass(select, 'edd-select')) {
                    new EddSelect(select);

                    // TODO: allow for a custom configuration for autoloaded selects
                }
            }
        },

        /* Private Methods
        ---------------------------------------------------------------------- */

        /**
         * init
         * @since 3.0.0
         */

        _init: function() {
            var self = this;

            EddSelect.prototype._instances.push(self);

            self._instanceIndex = EddSelect.prototype._instances.length;

            self._form = _helpers._closestParent(self._select, null, 'form');

            EddSelect.prototype._hasMouse && (self._nativeMode = false);

            self._parseSelect();
            self._renderDropDown();
            self._updateLabel();
            self._bindEvents();
            self._pollChange();

            if (
                self.animation.mixItUp &&
                !self._grouped &&
                typeof (jQuery || $) !== 'undefined' &&
                typeof $.MixItUp !== 'undefined'
            ) {
                var config = (typeof self.animation.mixItUp === 'object') ? self.animation.mixItUp : {
                    selectors: {
                        target: '.'+self.markup.nameSpace + self.markup.itemClass
                    },
                    layout: {
                        display: 'block'
                    },
                    load: {
                        filter: 'none'
                    },
                    animation: {
                        effects: 'fade translateY(-300%) translateZ(-300px) stagger(20ms)',
                        duration: 150
                    }
                };

                $(self._eddWrapper).addClass('mix-it-up');

                self._$eddBody = $(self._eddBody).mixItUp(config);
            } else {
                self.animation.mixItUp = false;
            }
        },

        /**
         * parseSelect
         * @since 3.0.0
         */

        _parseSelect: function() {
            var self = this,
                hasLabel = false,
                parseOption = function(option) {
                    if (
                        i === 0 && 
                        option.getAttribute('data-label') !== null
                    ) {
                        self._label = option.innerText;
                        hasLabel = true;
                        return;
                    }

                    var item = new self._Item(option);

                    if (item.selected) {
                        self._selectedIndices.push(hasLabel ? i - 1 : i);
                    }

                    self._items.push(item);
                };

            self._id = self._select.id;
            self._name = self._select.name;
            self._multiple = !!self._select.multiple;
            self._autofocus = self._select.autofocus;

            self._currentValue = self._newValue = self._select.value;

            self._items = [];

            self._selectedIndices = [];

            for (var i = 0, child; child = self._select.children[i]; i++) {
                if (child.tagName === 'OPTION') {
                    parseOption(child);
                } else if (child.tagName === 'OPTGROUP') {
                    !self._grouped && (self._grouped = true);

                    self._items.push({
                        isGroup: true,
                        label: child.label,
                        totalChildren: child.children.length
                    });

                    for (var j = 0, groupChild; groupChild = child.children[j]; j++) {
                        parseOption(groupChild);
                    }
                }
            }

            self._totalItems = self._items.length;
        },

        /**
         * renderDropDown
         * @since 3.0.0
         */

        _renderDropDown: function() {
            var self = this,
                frag = document.createDocumentFragment(),
                parent = self._select.parentElement,
                classes = self.markup,
                inGroup = false,
                groupLength = 0,
                groupEl = null,
                div = function(className) {
                    var div = document.createElement('div');

                    div.className = classes.nameSpace+className || '';

                    return div;
                },
                getWrapperClasses = function() {
                    var classList = classes.wrapperClass;

                    self._nativeMode && (classList += ' touch');
                    self._autoFocus && (classList += ' focus');
                    self._multiple && (classList += ' multiple');

                    return classList;
                },
                getItemClasses = function(item) {
                    var classList = classes.itemClass;

                    (item.disabled && !item.selected) && (classList += ' disabled');
                    item.selected && (classList += ' selected');

                    return classList;
                };

            self._eddWrapper = div(getWrapperClasses());
            self._eddHead = div(classes.headClass);
            self._eddSelectWrapper = div(classes.selectWrapperClass);
            self._eddLabel = div(classes.labelClass);
            self._eddCarat = div(classes.caratClass);
            self._eddBody = div(classes.bodyClass);
            self._eddItemsWrapper = div(classes.itemsWrapperClass);
            self._eddItems = [];

            frag.appendChild(self._eddWrapper);
            self._eddWrapper.appendChild(self._eddBody);
            self._eddWrapper.insertBefore(self._eddHead, self._eddBody);
            self._eddBody.appendChild(self._eddItemsWrapper);

            parent.insertBefore(frag, self._select);

            self._eddSelectWrapper.appendChild(self._select);
            self._eddHead.appendChild(self._eddCarat);
            self._eddHead.insertBefore(self._eddLabel, self._eddCarat);
            self._eddHead.insertBefore(self._eddSelectWrapper, self._eddLabel);

            self.scrolling.openAbove && _helpers._addClass(self._eddWrapper, self.markup.openAboveClass);

            for (var i = 0, item; item = self._items[i]; i++) {

                if (item.isGroup && !groupEl) {
                    // Open group wrapper
                    
                    var labelEl = div(self.markup.groupLabelClass);

                    labelEl.innerHTML = item.label;

                    groupEl = div(self.markup.groupClass);

                    groupEl.appendChild(labelEl);

                    self._eddItemsWrapper.appendChild(groupEl);

                    inGroup = true;
                    groupLength = item.totalChildren;
                    
                    self._items.splice(i,1);
                    
                    i--;

                    continue;
                }

                var wrapper = inGroup ? groupEl : self._eddItemsWrapper,
                    el = div(getItemClasses(item));

                el.innerHTML = item.label ? item.label : item.text;
                self.items.addTitle && (el.title = item.label ? item.label : item.text);

                wrapper.appendChild(el);
                self._eddItems.push(el);

                if (inGroup) {
                    groupLength--;

                    if (!groupLength) {
                        // Close group wrapper

                        inGroup = false;
                        groupEl = null;
                    }
                }
            }

            !self._nativeMode && _helpers._removeClass(self._eddWrapper, 'touch');
        },

        /**
         * updateLabel
         * @since 3.0.0
         * @param {string} text
         */

        _updateLabel: function(text) {
            var self = this,
                selected = self._items[self._selectedIndices[0]],
                label = self._label || self.label.def;

            _helpers[((selected && selected.value !== '') ? '_add' : '_remove')+'Class'](self._eddWrapper, 'selected');

            if (selected && self._multiple) {
                if (self.label.tags) {
                    self._eddLabel.innerHTML = '';
                    for (var i = 0, item; item = self._items[self._selectedIndices[i]]; i++) {
                        var sep = (i === self._selectedIndices.length - 1) ? '' : ' ',
                            span = document.createElement('span');

                        self._eddLabel.innerHTML += '<span class="'+self.markup.nameSpace+self.markup.tagClass+'">'+item.text+'</span>'+sep;
                    }
                } else {
                    self._eddLabel.innerHTML = label + ' (' + self._selectedIndices.length + ')';
                }
            } else if (text) {
                _helpers._removeClass(self._eddWrapper, 'selected');
                self._eddLabel.innerHTML = text;
            } else if (selected) {
                self._eddLabel.innerHTML = selected.label ? selected.label : selected.text;
            } else {
                _helpers._removeClass(self._eddWrapper, 'selected');
                self._eddLabel.innerHTML = label;
            }
        },

        /**
         * eraseDropDown
         * @since 3.0.0
         */

        _eraseDropDown: function() {
            var self = this;
        },

        /**
         * indexAll
         * @since 3.0.0
         */

        _indexAll: function(el) {
            var self = this,
                prevSiblings = 0,
                ns = self.markup.nameSpace;

            if(_helpers._hasClass(el.parentElement, ns+self.markup.groupClass)) {
                prevSiblings = _helpers._prevSiblings(el, ns+self.markup.itemClass);
            }

            return _helpers._index(el, ns+self.markup.itemClass) + prevSiblings;
        },

        /**
         * bindEvents
         * @since 3.0.0
         */

        _bindEvents: function() {
            var self = this,
                ns = self.markup.nameSpace,
                scrollBlock = null;

            // Click to open + focus

            _helpers._on(self._eddHead, 'click', function(e) {
                if (_helpers._hasClass(e.target, ns+self.markup.tagClass)) {
                    var index = _helpers._index(e.target, ns+self.markup.tagClass);

                    self.select(self._selectedIndices[index]);
                } else {
                    self[(!self._open ? 'open' : 'close')]();

                    self._select.focus();
                }
            });

            _helpers._on(self._eddHead, 'mousedown', function(e) {
                self._clicking = true;
            });

            _helpers._on(self._eddHead, 'mouseup', function(e) {
                self._clicking = false;
            });

            _helpers._on(document.documentElement, 'click', function(e) {
                if (
                    self._open && 
                    !_helpers._closestParent(e.target, self.markup.nameSpace+self.markup.wrapperClass)
                ) {
                    self.close();
                }
            }, true);

            // Change event

            _helpers._on(self._select, 'change', function(e) {
                if (self._nativeMode) {
                    var index = self._select.selectedIndex;

                    if (self._nativeMode) {
                        if (self._label !== '') {
                            if (index !== 0) {
                                index--;
                                self.select(index);
                            } else {
                                self.select(false);
                            }
                        } else {
                            self.select(index);
                        }
                    }
                } else if (!self._selecting) {
                    self.select(self._currentValue, true);
                }
            });

            // Keydown/up event while focused

            _helpers._on(self._select, 'keydown', function(e) {
                !self._nativeMode && self._keydown(e);
            });

            _helpers._on(self._select, 'keyup', function(e) {
                !self._nativeMode && self._keyup(e);
            });

            // Focus event

            _helpers._on(self._select, 'focus', function(e) {
                _helpers._addClass(self._eddWrapper, self.markup.focusClass);
                self._inFocus = true;
            });

            // Blur event

            _helpers._on(self._select, 'blur', function(e) {
                if (!self._clicking) {
                    _helpers._removeClass(self._eddWrapper, self.markup.focusClass);
                    self._inFocus = false;
                    self.close();
                } else {
                    self._select.focus();
                }
            });

            // ItemsWrapper handlers

            _helpers._on(self._eddItemsWrapper, 'scroll', function(e) {
                self._renderScrollClasses();
            });

            _helpers._on(self._eddItemsWrapper, 'mousedown', function(e) {
                self._clicking = true;
            });

            _helpers._on(self._eddItemsWrapper, 'mouseup', function(e) {
                self._clicking = false;
            });

            // Reset event

            self._form && _helpers._on(self._form, 'reset', function() {
                self.select(false);
            });

            // Item handlers

            _helpers._forEachItem(self, function() {
                _helpers._on(this, 'mouseenter', function() {
                    if (self._open && !self._scrollingToView) {
                        self._focusedIndex = self._indexAll(this);
                        self._focusItem();
                    }
                });

                _helpers._on(this, 'mouseleave', function() {
                    if (self._open && !self._scrollingToView) {
                        self._focusedIndex = false;
                        _helpers._removeClass(this, self.markup.focusClass);
                    }
                });

                _helpers._on(this, 'mousedown', function(e) {
                    self._clicking = true;
                });

                _helpers._on(this, 'mouseup', function(e) {
                    self._clicking = false;
                });

                _helpers._on(this, 'click', function(e) {
                    var index = self._indexAll(e.target);
                    
                    self.select(index);
                });
            });
        },

        /**
         * pollChange
         * @since 3.0.0
         */

        _pollChange: function() {
            var self = this;
                
            self._pollInterval = setInterval(function() {
                self._newValue = self._select.value;

                if (!self._selecting && self._newValue !== self._currentValue) {
                    self._currentValue = self._newValue;

                    _helpers._trigger(self._select, 'change', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                }
            }, 200);
        },

        /**
         * focusItem
         * @since 3.0.0
         */

        _focusItem: function() {
            var self = this;

            _helpers._forEachItem(self, function() {
                _helpers._removeClass(this, self.markup.focusClass);
            });

            if (self._focusedIndex !== false && self._focusedIndex < self._items.length) {
                !self._items[self._focusedIndex].disabled && _helpers._addClass(self._eddItems[self._focusedIndex], self.markup.focusClass);
            }
        },

        /**
         * scrollToView
         * @since 3.0.0
         */

        _scrollToView: function() {
            var self = this,
                focusedIndex = self._focusedIndex !== false ? 
                    self._focusedIndex : 
                    typeof self._selectedIndices[0] !== 'undefined' ?
                        self._selectedIndices[0] :
                        false,
                focusedItem = null,
                offsetTop = null,
                min = null,
                max = null;

            if (focusedIndex !== false) {
                focusedItem = self._eddItems[focusedIndex];
                offsetTop = focusedItem.offsetTop;
                min = self._eddItemsWrapper.scrollTop;
                max = min + self._eddBody.offsetHeight;

                if (
                    offsetTop < min ||
                    offsetTop + focusedItem.offsetHeight > max
                ){
                    self._eddItemsWrapper.scrollTop = offsetTop;
                    self._scrollingToView = true;
                    
                    setTimeout(function () {
                        self._scrollingToView = false;
                    }, 100);
                }
            }
        },

        /**
         * renderScrollClasses
         * @since 3.0.0
         */

        _renderScrollClasses: function() {
            var self = this;

            if (self._eddItemsWrapper.scrollTop >= self._eddItemsWrapper.scrollHeight - self._eddBody.offsetHeight) {
                if (!self._atTop) {
                    _helpers._addClass(self._eddWrapper, self.markup.bottomClass);
                    self._atTop = true;
                }
            } else {
                if(self._atTop) {
                    _helpers._removeClass(self._eddWrapper, self.markup.bottomClass);
                    self._atTop = false;
                }
            }

            if (self._eddItemsWrapper.scrollTop === 0) {
                if (!self._atBottom) {
                    _helpers._addClass(self._eddWrapper, self.markup.topClass);
                    self._atBottom = true;
                }
            } else {
                if (self._atBottom) {
                    _helpers._removeClass(self._eddWrapper, self.markup.topClass);
                    self._atBottom = false;
                }
            }
        },

        /**
         * getMaxHeight
         * @since 3.0.0
         */

        _getMaxHeight: function() {
            var self = this,
                maxHeight = 0,
                scrollable = false;

            // Todo: does not include group labels in calculations .. hmm

            for (var i = 0, eddItem; eddItem = self._eddItems[i]; i++) {
                maxHeight += eddItem.offsetHeight;

                if (self.scrolling.maxItems && (self.scrolling.maxItems === i + 1)){
                    scrollable = true;
                    break;
                }
            }

            if (self.scrolling.maxHeight && maxHeight > self.scrolling.maxHeight) {
                maxHeight = self.scrolling.maxHeight;
                scrollable = true;
            }
           
            scrollable && (self._scrollable = true);

            return maxHeight;
        },

        /**
         * search
         * @since 3.0.0
         */

        _search: function() {
            var self = this,
                i = 0,
                title = '',
                getTitle = function(i) {
                    return self._items[i].text.toUpperCase();
                },
                lockOn = function() {
                    self._focusedIndex = i;
                    self._focusItem();
                    self._scrollToView();
                };

            for (i = 0; i < self._items.length; i++) {
                title = getTitle(i);

                if (title.indexOf(self._query) === 0) {
                    lockOn();
                    return;
                }
            }

            for (i = 0; i < self._items.length; i++) {
                title = getTitle(i);

                if (title.indexOf(self._query) > 0) {
                    lockOn();
                    break;
                }
            }
        },

        /**
         * getScrollOffset
         * @since 3.0.0
         */

        _getScrollOffset: function(scrollTop, maxHeight){
            var self = this,
                range = {
                    min: scrollTop,
                    max: scrollTop + (window.innerHeight || document.documentElement.clientHeight)
                },
                menuBottom = scrollTop + self._eddBody.offsetTop + self._eddWrapper.getBoundingClientRect().top + maxHeight; 

            if (menuBottom >= range.min && menuBottom <= range.max) {
                return 0;
            } else {
                return (menuBottom - range.max) + 5;
            }
        },

        /* Public Methods
        ---------------------------------------------------------------------- */

        /**
         * open
         * @since 3.0.0
         */

        open: function() {
            var self = this,
                maxHeight = self._getMaxHeight(),
                scrollTop = window.scrollY || document.documentElement.scrollTop,
                scrollLeft = window.scrollX || document.documentElement.scrollLeft,
                scrollOffset = self._getScrollOffset(scrollTop, maxHeight);

            if (!self._open && !self._nativeMode) {
                self.closeAll();

                !self.scrolling.openAbove && window.scrollTo(scrollLeft, scrollTop + scrollOffset);

                // TODO: don't disable, just send the opposite direction

                self._scrollToView();
                self._renderScrollClasses();

                if (self._scrollable) {
                    _helpers._addClass(self._eddWrapper, self.markup.scrollableClass);
                }

                if (!self.animation.mixItUp) {
                    self._eddBody.style.height = maxHeight+'px';
                } else {
                    self._$eddBody.mixItUp('filter', 'all');
                }

                if (self.label.showOnOpen && self._label !== '') {
                    self._updateLabel(self._label);
                } 

                _helpers._addClass(self._eddWrapper, self.markup.openClass);

                self._open = true;
            }
        },

        /**
         * close
         * @since 3.0.0
         */

        close: function() {
            var self = this;

            if (self._open) {
                if (!self.animation.mixItUp) {
                    self._eddBody.style.height = '0';
                } else {
                    self._$eddBody.mixItUp('filter', '');
                }

                if (self.label.showOnOpen && self._label !== '') {
                    self._updateLabel();
                } 

                _helpers._removeClass(self._eddWrapper, self.markup.openClass);
                _helpers._removeClass(self._eddWrapper, self.markup.scrollableClass);

                _helpers._forEachItem(self, function(i) {
                    _helpers._removeClass(this, self.markup.focusClass);
                });

                self._query = '';

                self._open = false;
            }
        },

        /**
         * select
         * @since 3.0.0
         * @param {Number|String} key
         * @param {Boolean} programmatic
         */

        select: function(key, programmatic) {
            var self = this,
                option = null,
                nativeKey = (self._label !== '' && !self._nativeMode) ? key + 1 : key,
                deselect = false,
                clearSelected = function() {
                    self._selectedIndices[0] && (self._items[self._selectedIndices[0]].selected = false);
                },
                blockPoll = setTimeout(function() {
                    self._selecting = false;
                }, 300);

            // Block poll from triggering;

            self._selecting = true;

            // Select by numeric index

            if (typeof key === 'number') {
                option = self._select.options[nativeKey];

            // Select by string value

            } else if (typeof key === 'string') {
                for (var i = 0, item; item = self._items[i]; i++) {
                    if (key === item.value) {
                        key = i;
                        nativeKey = (self._label !== '' && !self._nativeMode) ? key + 1 : key;
                        option = self._select.options[nativeKey];
                        break;
                    }
                }

            // Reset to null

            } else if (key === false) {
                clearSelected();

                if (self._label === '' && !self._multiple) {
                    self._selectedIndices = [0];
                    option = self._select.options[0];
                    key = 0;
                } else {
                    self._selectedIndices = []
                }

                self._updateLabel();

                !self._nativeMode && (self._select.options[0].selected = true);
            }

            // Remove active styling for all options

            if (!self._multiple) {
                _helpers._forEachItem(self, function(i) {
                    _helpers._removeClass(this, self.markup.selectedClass);
                });
            }


            // TODO: allow passing of an array of multiple keys to select/deselect

            if(option && !option.disabled) {

                // Manipulate model / native options

                if (!self._multiple) {
                    !self._nativeMode && (option.selected = true);
                    
                    clearSelected();
                    
                    self._items[key].selected = true;
                    self._selectedIndices[0] = key;
                } else {

                    // TODO: Account for multiple in native mode

                    if (!self._items[key].selected) {
                        option.selected = true;
                        self._selectedIndices.push(key);
                        self._items[key].selected = true;
                    } else {
                        deselect = true;
                        option.selected = false;
                        self._items[key].selected = false;
                        self._selectedIndices.splice(self._selectedIndices.indexOf(key), 1);
                    }
                }

                // Add active styling for options

                _helpers._forEachItem(self, function(i) {
                    if (i === key) {
                        _helpers[(deselect ? '_remove' : '_add')+'Class'](this, self.markup.selectedClass);
                    }
                });

                // Update Label

                self._updateLabel();

                // Update polling values

                self._currentValue = self._newValue = self._select.value;

                // Close

                !self._multiple && self.close();

                // Re-focus

                if (!programmatic) {
                    self._select.focus();
                }

                // Trigger change event

                if (!self._nativeMode) {
                    _helpers._trigger(self._select, 'change', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                }
            }
        },

        /**
         * closeAll
         * @since 3.0.0
         */

        closeAll: function() {
            var self = this;

            for (var i = 0, instance; instance = EddSelect.prototype._instances[i]; i++) {
                instance.close();
            }
        },

        /**
         * refresh
         * @since 3.0.0
         */

        refresh: function() {
            var self = this;
        },

        /**
         * destroy
         * @since 3.0.0
         */

        destroy: function() {
            var self = this,
                parent = self._eddWrapper.parentElement;

            parent.insertBefore(self._select, self._eddWrapper);

            parent.removeChild(self._eddWrapper);

            clearInterval(self._pollInterval);

            delete EddSelect.prototype._instances[self._instanceIndex - 1];

            EddSelect.prototype._instances.splice(self._instanceIndex - 1, 1);

            // TODO: may need to unbind any handlers applied to select element
        },

        /* Event Handlers
        ---------------------------------------------------------------------- */

        /**
         * keydown
         * @since 3.0.0
         */

        _keydown: function(e) {
            var self = this,
                key = e.keyCode,
                setFocus = function() {
                    self._focusedIndex === false && (self._focusedIndex = self._selectedIndices[0] || false);
                    self._focusedIndex === false && (self._focusedIndex = 0);
                },
                buildSearch = function(key) {
                    var letter = String.fromCharCode(key);

                    self._query += letter;
                    self._typing = true;

                    self._search();
                };

            if (!self._inFocus) return false;

            // If not open:

            if (!self._open) {
                if (
                    key === 38 ||
                    key === 40 ||
                    key === 32
                ) {
                    // Open on Up/Down/Space

                    e.preventDefault();

                    self.open();

                    setFocus();
                    
                    self._scrollToView();
                    self._focusItem();

                    self._query = '';

                } else if (
                    key !== 9
                ) {
                    // Quick Select

                    buildSearch(key);

                    self.select(self._focusedIndex);

                    clearTimeout(self._resetQueryTimeout);
                }

                return false;
            }

            // Else, if open:

            // Scroll Up

            if (key === 38) {
                e.preventDefault();

                setFocus();

                self._focusedIndex = !self._focusedIndex ? 
                    (self._items.length - 1) : 
                    --self._focusedIndex;

                self._scrollToView();
                self._focusItem();
                
                return false;

            // Scroll Down
                
            } else if (key === 40) {
                e.preventDefault();

                setFocus();

                self._focusedIndex = (self._focusedIndex === self._items.length - 1) ?
                    0 : 
                    ++self._focusedIndex;

                self._scrollToView();
                self._focusItem();

                return false;

            // Select with Enter/Space

            } else if (key === 32 || key === 13) {
                e.preventDefault();

                // Override space select if textual search in progress

                if (self._typing && key === 32) {
                    self._query += ' ';

                    self._search();

                    clearTimeout(self._resetQueryTimeout);
                } else {
                    self.select(self._focusedIndex);
                }

                return false;

            // Backspace textual search

            } else if (key === 8) {
                e.preventDefault();

                self._query = self._query.slice(0,-1);

                self._search();

                clearTimeout(self._resetQueryTimeout);
                
                return false;

            // Textual search (ignore shift key)

            } else if (key !== 16) {
                buildSearch(key);

                clearTimeout(self._resetQueryTimeout);
            }
        },

        /**
         * keyup
         * @since 3.0.0
         */

        _keyup: function(e) {
            var self = this;

            self._resetQueryTimeout = setTimeout(function(){
                if (self._typing) {
                    self._query = '';
                    self._typing = false;
                }
            }, self._resetQueryDelay);
        }
    };

    /* Helpers
    ---------------------------------------------------------------------- */

    var _helpers = {

        /**
         * on
         * @since 3.0.0
         */

        _on: function(el, type, fn, useCapture) {
            if (el.attachEvent) {
                el['e'+type+fn] = fn;
                el[type+fn] = function(){el['e'+type+fn](window.event);};
                el.attachEvent('on'+type, el[type+fn]);
            } else
                el.addEventListener(type, fn, useCapture);
        },

        /**
         * off
         * @since 3.0.0
         */

        _off: function(el, type, fn) {
            if (el.detachEvent) {
                el.detachEvent('on'+type, el[type+fn]);
                el[type+fn] = null;
            } else
                el.removeEventListener(type, fn, false);
        },

        /**
         * hasClass
         * @since 3.0.0
         */

        _hasClass: function(el, cls) {
            return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
        },

        /**
         * addClass
         * @since 3.0.0
         */

        _addClass: function(el, cls) {
            if (!this._hasClass(el, cls)) el.className += el.className ? ' '+cls : cls;
        },

        /**
         * removeClass
         * @since 3.0.0
         */

        _removeClass: function(el, cls) {
            if (this._hasClass(el, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                el.className = el.className.replace(reg, ' ').trim();
            }
        },

        /**
         * prevSiblings
         * @since 3.0.0
         */

        _prevSiblings: function(el, match) {
            var group = el.parentElement,
                wrapper = group ? group.parentElement : false,
                index = this.index(group),
                total = 0;

            for (var i = 0; i < index; i++) {
                var item = wrapper.children[i],
                    children = match ? item.getElementsByClassName(match) : item.children;

                if (children.length) {
                    total += children.length;
                } else {
                    total++;
                }
            }

            return total;
        },

        /**
         * index
         * @since 3.0.0
         */

        _index: function(el, match) {
            var i = 0;

            while((el = el.previousElementSibling)!== null) {
                if (!match || this._hasClass(el, match)) {
                    ++i;   
                }
            }
            return i;
        },

        /**
         * forEachItem
         * @since 3.0.0
         */

        _forEachItem: function(self, fn) {
            for (var i = 0, eddItem; eddItem = self._eddItems[i]; i++) {
                (typeof fn === 'function') && fn.call(eddItem, i);
            }
        },

        /**
         * closestParent
         * @since 3.0.0
         */

        _closestParent: function(el, cls, tag) {
            var parent = el.parentNode;
            while (parent && parent != document.body) {
                if (cls && parent && this._hasClass(parent, cls)) {
                    return parent;
                } else if (tag && parent && parent.nodeName === tag.toUpperCase()) {
                    return parent;
                } else {
                   parent = parent.parentNode;
                }
            }
            return null;
        },

        /**
         * trigger
         * @since 3.0.0
         */

        _trigger: function(el, eventName, config) {
            var event = new Event(eventName, config);
            el.dispatchEvent(event);
        }
    };

    EddSelect.prototype._platformDetect();

    // TODO: Account for AMD loading, module.exports etc

    if (!document.addEventListener) {
        document.attachEvent('DOMContentLoaded', function() {
            EddSelect.prototype._trawlDOM();
        });    
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            EddSelect.prototype._trawlDOM();
        });
    }

    window.EddSelect = EddSelect;

})(window, document);