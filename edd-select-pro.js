(function(window, document) {

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
                    maxHeight: false
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
                _nativeMode: false,
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

                _eddWrapper: null,
                _eddHead: null,
                _eddSelectWrapper: null,
                _eddLabel: null,
                _eddCarat: null,
                _eddBody: null,
                _eddItemsWrapper: null,
                _eddItems: [],

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

        self.init();
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

        /* Static Methods
        ---------------------------------------------------------------------- */

        /**
         * trawlDOM
         * @since 3.0.0
         */

        _trawlDOM: function() {
            var self = this,
                selects = document.getElementsByTagName('select');

            for (var i = 0, select; select = selects[i]; i++) {
                if (self._helpers.hasClass(select, 'edd-select')) {
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

        init: function() {
            var self = this;

            EddSelect.prototype._instances.push(self);

            self._instanceIndex = EddSelect.prototype._instances.length;

            self._platformDetect();

            self._parseSelect();
            self._renderDropDown();
            self._updateLabel();
            self._bindEvents();

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
         * platformDetect
         * @since 3.0.0
         */

        _platformDetect: function() {
            var self = this;

            /* Polyfills
            ---------------------------------------------------------------------- */

            /**
             * previousElementSibling
             * @since 3.0.0
             */

            if (typeof self._select.previousElementSibling === 'undefined') {
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
        },

        /**
         * parseSelect
         * @since 3.0.0
         */

        _parseSelect: function() {
            var self = this,
                hasLabel = false,
                parseOption = function(option) {
                    if (i === 0 && option.getAttribute('data-label') !== null) {
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
            !self._nativeMode && (self._eddBody = div(classes.bodyClass));
            self._eddItemsWrapper = div(classes.itemsWrapperClass);
            self._eddItems = [];

            frag.appendChild(self._eddWrapper);
            !self._nativeMode && self._eddWrapper.appendChild(self._eddBody);
            self._eddWrapper.insertBefore(self._eddHead, self._eddBody);
            !self._nativeMode && self._eddBody.appendChild(self._eddItemsWrapper);

            parent.insertBefore(frag, self._select);

            self._eddSelectWrapper.appendChild(self._select);
            self._eddHead.appendChild(self._eddCarat);
            self._eddHead.insertBefore(self._eddLabel, self._eddCarat);
            self._eddHead.insertBefore(self._eddSelectWrapper, self._eddLabel);

            if (!self._nativeMode) {
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
            }
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

            self._helpers[((selected || text) ? 'add' : 'remove') + 'Class'](self._eddWrapper, 'selected');

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
                self._helpers.removeClass(self._eddWrapper, 'selected');
                self._eddLabel.innerHTML = text;
            } else if (selected) {
                self._eddLabel.innerHTML = selected.label ? selected.label : selected.text;
            } else {
                self._helpers.removeClass(self._eddWrapper, 'selected');
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

            if(self._helpers.hasClass(el.parentElement, ns+self.markup.groupClass)) {
                prevSiblings = self._helpers.prevSiblings(el, ns+self.markup.itemClass);
            }

            return self._helpers.index(el, ns+self.markup.itemClass) + prevSiblings;
        },

        /**
         * bindEvents
         * @since 3.0.0
         */

        _bindEvents: function() {
            var self = this,
                ns = self.markup.nameSpace;

            // Click to open + focus

            self._helpers.on(self._eddHead, 'click', function(e) {
                if (self._helpers.hasClass(e.target, ns+self.markup.tagClass)) {
                    var index = self._helpers.index(e.target, ns+self.markup.tagClass);

                    self.select(self._selectedIndices[index]);
                } else {
                    self[(!self._open ? 'open' : 'close')]();

                    self._select.focus();
                }
            });

            self._helpers.on(self._eddHead, 'mousedown', function(e) {
                self._clicking = true;
            });

            self._helpers.on(self._eddHead, 'mouseup', function(e) {
                self._clicking = false;
            });

            // Click to blur

            self._helpers.on(document.documentElement, 'click', function(e) {
                if (
                    self._open && 
                    !self._helpers.closestParent(e.target, self.markup.nameSpace+self.markup.wrapperClass)
                ) {
                    self.close();
                }
            }, true);

            // Change event

            self._helpers.on(self._select, 'change', function(e) {
                // !important: EDD's must only be changed via their own API
            });

            // Keydown/up event while focused

            self._helpers.on(self._select, 'keydown', function(e) {
                self._keydown(e);
            });

            self._helpers.on(self._select, 'keyup', function(e) {
                self._keyup(e);
            });

            // Focus event

            self._helpers.on(self._select, 'focus', function(e) {
                self._helpers.addClass(self._eddWrapper, self.markup.focusClass);
                self._inFocus = true;
            });

            // Blur event

            self._helpers.on(self._select, 'blur', function(e) {
                if (!self._clicking) {
                    self._helpers.removeClass(self._eddWrapper, self.markup.focusClass);
                    self._inFocus = false;
                    self.close();
                }
            });

            // Internal sroll event

            self._helpers.on(self._eddItemsWrapper, 'scroll', function(e) {
                self._renderScrollClasses();
            });

            // Item handlers

            self._helpers.forEachItem(self, function() {
                self._helpers.on(this, 'mouseenter', function() {
                    if (self._open && !self._scrollingToView) {
                        self._focusedIndex = self._indexAll(this);
                        self._focusItem();
                    }
                });

                self._helpers.on(this, 'mouseleave', function() {
                    if (self._open && !self._scrollingToView) {
                        self._focusedIndex = false;
                        self._helpers.removeClass(this, self.markup.focusClass);
                    }
                });

                self._helpers.on(this, 'mousedown', function(e) {
                    self._clicking = true;
                });

                self._helpers.on(this, 'mouseup', function(e) {
                    self._clicking = false;
                });

                self._helpers.on(this, 'click', function(e) {
                    var index = self._indexAll(e.target);

                    self.select(index);
                });
            });
        },

        /**
         * focusItem
         * @since 3.0.0
         */

        _focusItem: function() {
            var self = this;

            self._helpers.forEachItem(self, function() {
                self._helpers.removeClass(this, self.markup.focusClass);
            });

            if (self._focusedIndex !== false && self._focusedIndex < self._items.length) {
                !self._items[self._focusedIndex].disabled && self._helpers.addClass(self._eddItems[self._focusedIndex], self.markup.focusClass);
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
                    self._helpers.addClass(self._eddWrapper, self.markup.bottomClass);
                    self._atTop = true;
                }
            } else {
                if(self._atTop) {
                    self._helpers.removeClass(self._eddWrapper, self.markup.bottomClass);
                    self._atTop = false;
                }
            }

            if (self._eddItemsWrapper.scrollTop === 0) {
                if (!self._atBottom) {
                    self._helpers.addClass(self._eddWrapper, self.markup.topClass);
                    self._atBottom = true;
                }
            } else {
                if (self._atBottom) {
                    self._helpers.removeClass(self._eddWrapper, self.markup.topClass);
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
                menuBottom = self._eddBody.offsetTop + self._eddWrapper.getBoundingClientRect().top + maxHeight; 

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

            if (!self._open) {

                window.scrollTo(scrollLeft, scrollTop + scrollOffset);

                self._scrollToView();
                self._renderScrollClasses();

                if (self._scrollable) {
                    self._helpers.addClass(self._eddWrapper, self.markup.scrollableClass);
                }

                if (!self.animation.mixItUp) {
                    self._eddBody.style.height = maxHeight+'px';
                } else {
                    self._$eddBody.mixItUp('filter', 'all');
                }

                if (self.label.showOnOpen && self._label !== '') {
                    self._updateLabel(self._label);
                } 

                self._helpers.addClass(self._eddWrapper, self.markup.openClass);

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

                self._helpers.removeClass(self._eddWrapper, self.markup.openClass);
                self._helpers.removeClass(self._eddWrapper, self.markup.scrollableClass);

                self._helpers.forEachItem(self, function(i) {
                    self._helpers.removeClass(this, self.markup.focusClass);
                });

                self._query = '';

                self._open = false;
            }
        },

        /**
         * select
         * @since 3.0.0
         */

        select: function(key) {
            var self = this,
                option = null,
                nativeKey = self._label !== '' ? key + 1 : key,
                deselect = false;

            // Find native option

            if (typeof key === 'number') {
                option = self._select.options[nativeKey];
            } else {
                for (var i = 0, op; op = self._select.options[i]; i++) {
                    if (key === op.value) {
                        option = op;
                        key = i;
                        break;
                    }
                }
            }

            // TODO: allow passing of an array of multiple keys to select/deselect

            if(option && !option.disabled) {

                // Manipulate model / native options

                if (!self._multiple) {
                    option.selected = true;
                    self._selectedIndices[0] && (self._items[self._selectedIndices[0]].selected = false);
                    self._items[key].selected = true;
                    self._selectedIndices[0] = key;
                } else {
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

                // Manipulate EDD Items

                self._helpers.forEachItem(self, function(i) {
                    !self._multiple && self._helpers.removeClass(this, self.markup.selectedClass);

                    if (i === key) {
                        self._helpers[(deselect ? 'remove' : 'add')+'Class'](this, self.markup.selectedClass);
                    }
                });

                // Update Label

                self._updateLabel();

                // Close

                !self._multiple && self.close();

                // Re-focus

                self._select.focus();

                // Trigger change event

                self._helpers.trigger(self._select, 'change', {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                });
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

            delete EddSelect.prototype._instances[self._instanceIndex - 1];

            EddSelect.prototype._instances.splice(self._instanceIndex - 1, 1);

            // TODO: may need to unbind any handlers applied to select element
        },

        /* Helpers
        ---------------------------------------------------------------------- */

        _helpers: {

            /**
             * on
             * @since 3.0.0
             */

            on: function(el, type, fn, useCapture) {
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

            off: function(el, type, fn) {
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

            hasClass: function(el, cls) {
                return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
            },

            /**
             * addClass
             * @since 3.0.0
             */

            addClass: function(el, cls) {
                if (!this.hasClass(el, cls)) el.className += el.className ? ' '+cls : cls;
            },

            /**
             * removeClass
             * @since 3.0.0
             */

            removeClass: function(el, cls) {
                if (this.hasClass(el, cls)) {
                    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                    el.className = el.className.replace(reg, ' ').trim();
                }
            },

            /**
             * prevSiblings
             * @since 3.0.0
             */

            prevSiblings: function(el, match) {
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

            index: function(el, match) {
                var i = 0;

                while((el = el.previousElementSibling)!== null) {
                    if (!match || this.hasClass(el, match)) {
                        ++i;   
                    }
                }
                return i;
            },

            /**
             * forEachItem
             * @since 3.0.0
             */

            forEachItem: function(self, fn) {
                for (var i = 0, eddItem; eddItem = self._eddItems[i]; i++) {
                    (typeof fn === 'function') && fn.call(eddItem, i);
                }
            },

            /**
             * closestParent
             * @since 3.0.0
             */

            closestParent: function(el, cls) {
                var parent = el.parentNode;
                while (parent && parent != document.body) {
                    if (parent && this.hasClass(parent, cls)) {
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

            trigger: function(el, eventName, config) {
                var event = new Event(eventName, config);
                el.dispatchEvent(event);
            }
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

    // TODO: account for ie8, also account for ASM loading

    document.addEventListener('DOMContentLoaded', function(){
        EddSelect.prototype._trawlDOM();
    });

    window.EddSelect = EddSelect;

})(window, document);