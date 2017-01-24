/*global backUrl:false, saveUrl:false, saveAndCloseButtonText:false, saveTuneAsButtonText:false, theme:false, tuneName:false, savePresetSelectionAjaxUrl:false, ActiveObject:false, isNewTheme:false, MediabrowserUtility:false, getFileBrowserUrl:false, setLocation:false, convertColors:true, generateUsedColors:true */
var data = [];
/**
 * Global themer namespace
 */
var themer = {
    name: "THEMER-MG",
    version: "1.0.0",
    // executed by the iframe when ready 
    iframeOnload: function() {},
    // executed by the iframe before load 
    iframeBeforeLoad: function() {}
};


jQuery(function($) {

    Array.prototype.diff = function(a) {
        return this.filter(function(i) {
            return !(a.indexOf(i) > -1);
        });
    };

    var COMPONENT = {
        CONTENT: 'THEMER-MG-CONTENT',
        DESIGN: 'THEMER-MG-DESIGN',
        LAYOUT: 'THEMER-MG-LAYOUT'
    };
    var _fonts = [];
    var _currentDevice = 'desktop';
    //var oyeLicense = new OyeLicense(COMPONENT, 'THEMER-MG-ALL');
    var iframe = document.getElementById('magento-themetuner-frame');
    var editorId = 'preset_' + Math.random();
    var holder = document.getElementById('themetuner');
    var current = document.getElementById('currentSelector');
    var layoutContext = $(document.getElementById("layout-context"));
    var pageTemplate = $(document.getElementById("page-template"));
    var selects = document.getElementById('themetuner-values').getElementsByTagName('select');
    var inputs = document.getElementById('themetuner-values').getElementsByTagName('input');
    var saveBtn = document.getElementById('btn-save');
    var saveAsBtn = document.getElementById('btn-save-as');
    var resetBtn = document.getElementById('btn-reset');
    var closeBtn = document.getElementById('btn-close');
    var editModeBtn = $('#mode-edit');
    var layoutModeBtn = $('#mode-layout');
    var viewModeBtn = $('#mode-view');
    var devicesModeBtn = $('#mode-devices');
    var activeClass = '.active-selector';
    var activeCssFile = $('<style id="theme-tuner-active" media="all" type="text/css">' + activeClass + ' { outline: 1px dotted red !important; } .active-area { background: rgba(113, 240, 121, 0.2) !important; }</style>');
    var cssFile = $('<style id="theme-tuner-css" media="all" type="text/css"></style>');
    var arrStyles = [];
    var usedColors = [];
    var borderTop = false;
    var borderRight = false;
    var borderBottom = false;
    var borderLeft = false;
    var tmpActive;
    var restoreDefaults = false; // if set to 'true' then script clears all preset styles on iframe load
    var clearLogo = false; // works with 'restoreDefaults' flag, if set then script also clears logo
    var enableDesign = false;
    var save = false;
    var ready = false;
    var resizeIframe = true;
    var unitX = 'px';
    var unitY = 'px';
    var layoutChanges = {}; // format: {"handle": {"@columns": {"type": "layout", "action": "columns", "id": "null_or_page_one_column"}, "block_id": {"type": "layout", "action": "insert"}}}
    var arrAllowed = [
        'font-family', 'font-size', 'color', 'font-weight', 'font-style', 'text-transform', 'letter-spacing', 'text-decoration', 'text-align', 'line-height',
        'background-color', 'background-image', 'background-position', 'background-repeat',
        'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'width', 'height', 'float', 'clear', 'display', 'direction'
    ];
    var arrBorder = [
        'border', 'border-top-width', 'border-top-style', 'border-top-color', 'border-right-width', 'border-right-style', 'border-right-color', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color', 'border-left-width', 'border-left-style', 'border-left-color'
    ];
    var inlineItems = [
        'body', 'a', 'ul', 'li', 'dl', 'dt', 'dd', 'span', 'b', 'strong', 'input', 'button', 'textarea', 'select'
    ];

    var active = new ActiveObject(iframe, inlineItems);
    active.setDevices(themetunerDevices);
    //JS func overwrites
    var originalSetLocation;

    // Class definitions
    var BulkEdit;

    // global functions (XXX: try to minimize global functions)
    var saveStyles,
        _clearIframeStylesheet,
        parseStylesheet,
        addItemsToArray,
        refreshStyles,
        activeStyles,
        deleteItemsFromArray,
        writeStyles,
        toggleHeight,
        resetInputs,
        resetColors,
        setRange,
        resetSelects,
        createRanges, // XXX: not used? when commenting this method out (and method calls), everything remains working
        createColors,
        setColor,
        setBackground, // XXX: not used, refactor out
        setBorder,
        observeButtons,
        hasChanges,
        showThemerIntro,
        getSerializedData,
        zeroFill,
        fillSelects,
        currentPath,
        setObj,
        addObjHover,
        removeObjHover,
        setIframeData,
        hideThemerIntro,
        loadStyles,
        getAllColors,
        init,
        reloadIframe,
        _afterIframeLoaded = [],
        getDevice,
        setDevice,
        goResponsive,
        getGoogleFonts,
        initSelectBox,
        setupGoogleFonts,
        loadFonts,
        registerPermanentIframeLoadEvent;


    var showLoader = function(msg, hideIframe) {
        hideIframe = hideIframe || true;
        msg = msg || null;
        var $mask = $('#loading-mask');
        if ($mask.size()) {
            if (hideIframe)
                $(iframe).hide();
            if ($('.msg', $mask).size())
                $('.msg', $mask).remove();
            if (msg)
                $('.loader', $mask).append('<span class="msg"><br>' + msg + '</span>');

            $mask.show();
        }
    };

    var hideLoader = function() {
        toggleHeight();
        var $mask = $('#loading-mask');
        if ($mask.size()) {
            $mask.hide();

            if ($('.msg', $mask).size())
                $('.msg', $mask).remove();
            if ($(iframe).is(':hidden'))
                $(iframe).fadeIn(200);
        }
    };

    var loaderMsg = function(msg) {
        msg = msg || null;
        var $mask = $('#loading-mask');
        if ($mask.size()) {
            if ($('.msg', $mask).size()) {
                $('.msg', $mask).html('<br>' + msg);
            } else {
                $('.loader', $mask).append('<span class="msg"><br>' + msg + '</span>');
            }
        }
    }

    var setSaveNeeded = function(state) {
        if (!state) {
            $(saveBtn).addClass('disabled');
            $(saveBtn).attr('disabled', 'disabled');
        } else {
            if (!isNewTheme) {
                // activate 'save' button only if it's existing theme we are editing
                // otherwise user should use 'save as' button
                $(saveBtn).removeClass('disabled');
                $(saveBtn).removeAttr('disabled');
            }
        }
        save = state;
    };


    var license = {
        //components: [],
        allComponentsName: 'THEMER-MG-ALL',
        _allowed: [],
        invalid: 0,
        genKey: function( str ){
            var B64 = {
                alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
                lookup: null,
                encode: function (s) {
                    var buffer = B64.toUtf8(s),
                        position = -1,
                        len = buffer.length,
                        nan1, nan2, enc = new Array(4),
                        result = '';
        
                        while (++position < len) {
                            nan1 = buffer[position + 1], nan2 = buffer[position + 2];
                            enc[0] = buffer[position] >> 2;
                            enc[1] = ((buffer[position] & 3) << 4) | (buffer[++position] >> 4);
                            if (isNaN(nan1)) enc[2] = enc[3] = 64;
                            else {
                                enc[2] = ((buffer[position] & 15) << 2) | (buffer[++position] >> 6);
                                enc[3] = (isNaN(nan2)) ? 64 : buffer[position] & 63;
                            }
                            result += B64.alphabet[enc[0]] + B64.alphabet[enc[1]] + B64.alphabet[enc[2]] + B64.alphabet[enc[3]];
                        }
                        return result;
        
                },
                toUtf8: function (s) {
                    var position = -1,
                        len = s.length,
                        chr, buffer = [];
                    if (/^[\x00-\x7f]*$/.test(s)) while (++position < len)
                    buffer.push(s.charCodeAt(position));
                    else while (++position < len) {
                        chr = s.charCodeAt(position);
                        if (chr < 128) buffer.push(chr);
                        else if (chr < 2048) buffer.push((chr >> 6) | 192, (chr & 63) | 128);
                        else buffer.push((chr >> 12) | 224, ((chr >> 6) & 63) | 128, (chr & 63) | 128);
                    }
                    return buffer;
                }
            }
            return B64.encode( str );
        }, 
        getDomain: function(){
            //return (location.hostname.substring(0,3) === 'www') ? location.hostname.slice(4) : location.hostname;
            return 'themeforestdemo.oyenetwork.com';
        },
        /**
         *  Generates unique integer for rpc request
         */
        uniqueNumber: function(){
            return new Date().valueOf() + Math.floor(Math.random() * 1000) + 1;
        }, 
        authRequest: function( method, params, callback ) {
            var o = {
                "jsonrpc":"2.0",
                "id":this.uniqueNumber(),
                "method":method,
                "params": params
            }
            //console.log('o:');
            //console.log(o);
            jQuery.ajax({
                url: "http://oyenetwork.com:7890/rpc/p",
                type: "POST",
                dataType : "json",
                contentType : 'application/json',
                crossDomain : true, 
                data: JSON.stringify(o),
                success: function(res){
                	//console.log('res:');
            		//console.log(res);
                    callback(res);          
                },
                error: function(e, xhr, options){
                    var msg = '';
                    if(xhr.status) msg += xhr.status;
                    if(xhr.statusText) msg += ' ' + xhr.statusText;
                    if(!xhr.status && !xhr.statusText) msg += ' bad request';
                    
                    alert("License verification failure: " + msg );
                    callback({error:true});
                }
            }); 
        }, 
        check: function( callback ){
        	//console.log('callback:');
        	//console.log(callback);
            var self = this;
            str = this.getDomain() + '+' + themer.name + '+' + themer.version;
			//console.log('str:');
            //console.log(str);

            /*
            //this.authRequest( 'auth', { key : this.genKey(str) }, function( res ){
                /**
                 *  disable access for invalid licenses only
                 *  other requests are granted full access.
                 */

            /*     
                if(res.result && res.result.invalid){
                	console.log('res.result:');
                	console.log(res.result);
                	console.log('res.result.invalid:');
                	console.log(res.result.invalid);
                    self._allowed = [];
                    self.invalid = 1;
                    return self.requestActivation( callback );
                }
                self._allowed = [self.allComponentsName];
                console.log('self._allowed:');
                console.log(self._allowed);
                return callback();
            });
			*/
            self._allowed = [self.allComponentsName];
            //console.log('self._allowed:');
            //console.log(self._allowed);
            return callback();

        },
        /**
         * Request for themeforest activation
         */
        requestActivation: function( callback ){
            var self = this; 
            var prompt = this.modalPopup( '#activate-purchase-popup', function( modal ){
                var input = $('#themetuner-purchase-id', modal);
                var msgHolder = $('.msg', modal);
                
                $('.content > .title', modal).text('License invalid for "' + self.getDomain() + '"');
                    $('.content > .desc', modal)
                        .text('Or please purchase a valid license here:')
                        .append(' <a href="http://www.oyenetwork.com/products/themer-mg.html" >href="http://www.oyenetwork.com/products/themer-mg.html</a>');
                    
                this.resize();

                $('#popup-activate-ok', modal).click(function(e) {
                    var domain = self.getDomain();
                    var pid = input.val();
                    
                    
                    //console.log('domain:');
                    //console.log(domain);


                    /*
                    self.authRequest( 'verify', { pid:pid, domain:domain, module:themer.name }, function( res ){
                        if(!res.error){
                            if(res.result.components){
                                self._allowed = [self.allComponentsName];
                            }
                            $.colorbox.close();
                            modal.hide();
                            return callback();
                            
                        } else {
                            var errTitle = res.error.message || 'Error';
                            var errMsg = res.error.data || 'undefined';
                            msgHolder.html('<strong>'+errTitle+'</strong> ' + errMsg);
                        }
                    });
					*/
					var componentsArr = new Array("THEMER-MG-ALL");
                    if(componentsArr){
                        self._allowed = [self.allComponentsName];
                    }
                    $.colorbox.close();
                    modal.hide();
                    return callback();

                });
                $('#popup-activate-cancel, #popup-activate-close', modal).click(function(e) {
                    input.val('');
                    msgHolder.html('');
                    $.colorbox.close();
                    modal.hide();
                    callback();
                });
                
            });     
        },
        modalPopup: function( id, callback ) {
            var modal = jQuery(id) || null;
                modal.show();   
            
            $.colorbox({
                href: id,
                escKey: false,
                scrolling: false,
                overlayClose: false,
                inline: true,
                innerWidth: 440,
                onComplete: function(){
                    callback.call( $.colorbox, modal );
                }
            });
        },
        /**
         *  Check for components allowed by license. 
         *  @param comp - (String/Array) - component name(s) to check
         *  @return Boolean
         */
        hasAccess: function( component ){
            component = component || null;
            if ( !component || this.invalid ) {
                return false;
            }
            // first check if have access to all components
            if (this.allComponentsName && this._allowed.indexOf(this.allComponentsName) != -1) {
                return true;
            }
            return (-1 != this._allowed.indexOf(component));
        }
    };


    BulkEdit = function() {
        this.el = document.getElementById('themetuner-bulk');
        this.modes = ['SINGLE', 'SIMILAR'];
        this.activeMode = 0;
    }
    BulkEdit.prototype.getMode = function() {
        return this.modes[this.activeMode];
    }
    BulkEdit.prototype.bindHandlers = function() {
        $(this.el).on('change', function(e) {});
    }




    var savePresetPopup = function() {
        $.colorbox({
            href: savePresetSelectionAjaxUrl + (savePresetSelectionAjaxUrl.indexOf('?') > -1 ? '&' : '?') + 'presetId=' + $('#presetId').val(),
            escKey: false,
            scrolling: false,
            overlayClose: false,
            innerWidth: 550,
            onComplete: function() {
                var savingInProgress = false;
                var errorsContainerEl = $('#popup-saveas-errors');

                $('#popup-saveas-cancel, #popup-saveas-close').click(function(e) {
                    if (!savingInProgress) {
                        $.colorbox.close();
                    }
                    e.preventDefault();
                });

                $('#popup-saveas-yes').click(function(e) {
                    savingInProgress = true;
                    $('#popup-saveas-cancel, #popup-saveas-yes').attr('disabled', 'disabled');

                    var presetId = $('input:radio[name=saveas_preset_id]:checked').val();
                    var presetName = '';
                    if (presetId === '0') {
                        presetName = $('#popup-saveas-preset-name').val();
                    }

                    errorsContainerEl.hide().empty();

                    saveStyles(function(response) {
                        var responseHash = $.evalJSON(response);
                        // there was some errors, show them to user
                        if (Object.keys(responseHash.errors).length) {
                            $.each(responseHash.errors, function(errorType, errorDescr) {
                                errorsContainerEl.append('<p>' + errorDescr + '</p>');
                            });
                            errorsContainerEl.show();
                            savingInProgress = false;
                            $('#popup-saveas-cancel, #popup-saveas-yes').removeAttr('disabled');

                            $.colorbox.resize(); // resize popup, so that error messages would fit
                        } else {
                            // save was a success, redirect to newly created preset edit page
                            document.location.href = responseHash.redirect_url;
                        }
                    }, {
                        'preset_id': presetId,
                        'preset_name': presetName
                    });

                    e.preventDefault();
                });

                $('#popup-saveas-preset-id--0').click(function() {
                    $('#popup-saveas-preset-name').focus().select();
                });

                $('input:radio[name=saveas_preset_id]').change(function() {
                    errorsContainerEl.hide().empty();

                    if ($('input:radio[name=saveas_preset_id]:checked').val() === '0') {
                        $('#popup-saveas-preset-name').removeAttr('disabled');
                    } else {
                        $('#popup-saveas-preset-name').attr('disabled', 'disabled');
                    }
                });

                $('#popup-saveas-preset-name').click(function() {
                    $('#popup-saveas-preset-id--0').attr('checked', 'checked');
                });

                $('#popup-saveas-form').submit(function(e) {
                    $('#popup-saveas-yes').trigger('click');
                    e.preventDefault();
                });

                $('#popup-saveas-preset-id--0').trigger('click');
            }
        });
    };

    var _getStylesheetById = function(stylesheetId) {
        var files = iframe.contentWindow.document.styleSheets;

        for (var i = 0; i < files.length; i++) {
            var css = files[i].ownerNode.id;
            if (css.indexOf(stylesheetId) > -1) {
                return files[i];
            }
        }
        return null;
    };

    var _resetStyles = function() {
        data = [];

        if ($('#theme-tuner-css', iframe.contentWindow.document).length) {
            // empty dynamically (with javascript) changed stylesheet
            _clearIframeStylesheet('theme-tuner-css');
        }
        if ($('#themetuner-css', iframe.contentWindow.document).length) {
            // empty static stylesheet (styles loaded from database)
            _clearIframeStylesheet('themetuner-css');
        }
    };

    /**
     * Cleat sylesheet dom element and also browser computed styles.
     */
    _clearIframeStylesheet = function(stylesheetId) {
        if ($('#' + stylesheetId, iframe.contentWindow.document).length) {
            var stylesheet = _getStylesheetById(stylesheetId);
            while ((stylesheet.cssRules ? stylesheet.cssRules.length : stylesheet.rules.length) > 0) {
                if (stylesheet.removeRule) {
                    stylesheet.removeRule(0);
                } else {
                    stylesheet.deleteRule(0);
                }
            }
        }
    };

    parseStylesheet = function(stylesheetId) {
        var rules = [];
        var stylesheet = _getStylesheetById(stylesheetId);

        var replaceNativePasudoClasses = function(selectorName) {
            $.each(['hover', 'active', 'visited'], function(indx, pseudoClass) {
                selectorName = selectorName.replace(':' + pseudoClass, '.themetuner-pseudo--' + pseudoClass, 'g');
            });
            return selectorName;
        };

        if (stylesheet) {
            rules = stylesheet.cssRules || stylesheet.rules;
        }

        if (rules.length > 0) {
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                var name = $.trim(rule.selectorText);
                var arr2 = rule.style.cssText.split(';');
                arr2.pop(); // last item is always empty


                for (var k = 0; k < arr2.length; k++) {
                    var arr3 = arr2[k].split(':');
                    var prop = $.trim(arr3[0]).toLowerCase();
                    var value = '';

                    if ($.inArray(prop, arrAllowed) > -1) {

                        if (arr3[2]) {
                            arr3[1] = arr3[1] + ':' + arr3[2];
                        }

                        if (prop == 'color' || prop == 'background-color' || prop == 'border-top-color' || prop == 'border-right-color' || prop == 'border-bottom-color' || prop == 'border-left-color') {
                            value = convertColors($.trim(arr3[1]));
                        } else {
                            value = $.trim(arr3[1]);
                        }

                        if (prop == 'background-position-x') {
                            if (value == '%') {
                                unitX = '%';
                            }
                        }
                        if (prop == 'background-position-y') {
                            if (value == '%') {
                                unitY = '%';
                            }
                        }

                        value = value.replace(' !important', '');




                        if (value == 'initial' || value == 'initial initial') {
                            value = '';
                        }

                        if (prop && value && name) {
                            name = replaceNativePasudoClasses(name);
                            addItemsToArray(prop, value, name);
                        }
                    }

                    if ($.inArray(prop, arrBorder) > -1) {

                        if (arr3[2]) {
                            arr3[1] = arr3[1] + ':' + arr3[2];
                        }

                        if (prop == 'border-top-color' || prop == 'border-right-color' || prop == 'border-bottom-color' || prop == 'border-left-color') {
                            value = convertColors($.trim(arr3[1]));
                        } else {
                            value = $.trim(arr3[1]);
                        }

                        if (prop && value && name) {
                            name = replaceNativePasudoClasses(name);
                            addItemsToArray(prop, value, name);
                        }
                    }
                }
            }

            refreshStyles();
        } else {
            _resetStyles();
        }
    };

    activeStyles = function(id, value) {
        var x, y;

        if (id == 'border' || id == 'border-width' || id == 'border-style' || id == 'border-color') {
            var a = document.getElementById('border');
            var b = document.getElementById('border-width');
            var c = document.getElementById('border-style');
            var d = document.getElementById('border-color');

            if (!b.value) {
                b.value = '';
            }

            if (a.value && b.value && c.value && d.value) {
                value = b.value + 'px ' + c.value + ' ' + d.value;
            } else {
                value = '';
            }

            if (a.value == 'none') {
                id = 'border';
                value = 'none';
                b.value = '';
                c.value = '';
                d.value = '';
            } else if (a.value == 'full') {
                id = 'border';
            } else {
                id = 'border-' + a.value;
            }
        }

        if (id == 'width' || id == 'height') {
            x = document.getElementById(id);
            value = x.value + 'px';
        }

        if (id == 'background-color') {
            if (!value) {
                value = 'transparent';
            }
        }

        if (id == 'background-image') {
            if (value) {
                value = 'url(' + value + ')';
            } else {
                value = 'none';
            }
        }

        if (id == 'background-position-x' || id == 'background-position-y') {
            id = 'background-position';
            var bgPosX = document.getElementById('background-position-x');
            var bgPosY = document.getElementById('background-position-y');

            if (bgPosX.value || bgPosY.value) {
                if (!bgPosX.value) {
                    x = '0';
                } else {
                    x = bgPosX.value;
                }
                if (!bgPosY.value) {
                    y = '0';
                } else {
                    y = bgPosY.value;
                }
                value = y + unitY + ' ' + x + unitX;
            }
        }

        if (id == 'background-repeat') {
            if (!value || value == '-') {
                value = 'no-repeat';
            }
        }

        if (id && ready) {
            if (value) {
                addItemsToArray(id, value);
            } else {
                deleteItemsFromArray(id);
            }
            refreshStyles();
            setSaveNeeded(true);
        }
    };

    refreshStyles = function() {
        _clearIframeStylesheet('theme-tuner-css'); // clear dynamic stylesheet
        _clearIframeStylesheet('themetuner-css'); // clear static stylesheet
        writeStyles();
    };

    writeStyles = function() {
        var file = _getStylesheetById('theme-tuner-css');

        if (data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var rule = data[i];
                var ruleName = rule.name;
                var pseudoRuleName = ruleName.replace('.themetuner-pseudo--', ':', 'g');

                if (rule.styles.length > 0) {
                    var ruleStyles = '';
                    for (var a = 0; a < rule.styles.length; a++) {
                        var style = rule.styles[a];
                        ruleStyles += style.prop + ':' + style.value.replace(' !important', '') + ' !important;';
                    }
                    if (file.addRule) {
                        file.addRule(ruleName, ruleStyles, i);
                        if (pseudoRuleName != ruleName) {
                            file.addRule(pseudoRuleName, ruleStyles, i);
                        }
                    } else if (file.insertRule) {
                        file.insertRule(ruleName + '{' + ruleStyles + '}', i);
                        if (pseudoRuleName != ruleName) {
                            file.insertRule(pseudoRuleName + '{' + ruleStyles + '}', i);
                        }
                    }
                }
            }
        }
    };

    reloadIframe = function(callback) {
        if (typeof callback != 'undefined') {
            callback = $.isArray(callback) ?
                _afterIframeLoaded.concat(callback) :
                _afterIframeLoaded.push(callback);
        }
        showLoader();
        iframe.contentWindow.document.location.reload();
    };

    toggleHeight = function() {
        var wH = $(window).height(),
            haveCurrentBar = $('#currentSelector').is(':visible'),
            barH = $('#themetuner-top-bar').outerHeight(),
            tabsH = $('#themetuner-tabs').outerHeight(),
            headH = $('#themetuner-header').outerHeight(),
            holdH = $(holder).outerHeight(),
            full = wH - headH - tabsH,
            frame = full - holdH;

        $('#themetuner .scroller').height(($('#themetuner-top-bar').is(':visible') ? full - barH : full));
        $('#themetuner-iframe-scroll').height(wH);

        if (haveCurrentBar) {
            //$('#themetuner-frame-holder').css('top', headH + 'px');
            //$('#themetuner-device-img').css('top', headH + 'px');
        } else {
            $('#themetuner-frame-holder').css('top', '0px');
            $('#themetuner-device-img').css('top', '0px');
        }
    };
    // get screen object by screen type.
    // if no type is specified current screen type is used (_currentDevice)
    getDevice = function(type) {
        type = type || _currentDevice;
        if (themetunerDevices && $.isArray(themetunerDevices)) {
            var len = themetunerDevices.length;
            while (len--) {
                if (themetunerDevices[len].type === type) {
                    return themetunerDevices[len];
                }
            }
        }
        return null;
    };
    // set current screen
    setDevice = function(type) {
        if (themetunerDevices && $.isArray(themetunerDevices)) {
            var len = themetunerDevices.length;
            while (len--) {
                if (themetunerDevices[len].type === type) {
                    return _currentDevice = type;
                }
            }
        }
        return false;
    };
    getDeviceTypes = function() {
        var types = [];
        if (themetunerDevices && $.isArray(themetunerDevices)) {
            var len = themetunerDevices.length;
            while (len--) {
                types.push(themetunerDevices[len].type);
            }
        }
        return types;
    }
    resizeDeviceFrames = function(type) {
        var device = getDevice(type);
        var deviceImg = $('#themetuner-device-img');
        var topBar = $('#currentSelector').is(':visible') ? $('#currentSelector').outerHeight() : 0;
        var f = $(iframe);
        var imgMargin = parseInt(deviceImg.css('margin-top').split('px')[0]);
        var imgW, imgH, mTop, w, height, diff, hide = 0,
            header = 0;


        var x = device.ratio ? parseInt(device.ratio.split(':')[0]) : 0;
        var y = device.ratio ? parseInt(device.ratio.split(':')[1]) : 0;


        switch (device.type) {
            case 'tablet-landscape':
                deviceImg.attr('src', themetunerSkinUrl + 'images/ipad-landscape.jpg');
                imgW = 1253;
                imgH = 1097;
                w = 1024;
                mTop = 100;
                header = 123;
                break;
            case 'tablet-portrait':
                deviceImg.attr('src', themetunerSkinUrl + 'images/ipad-portrait.jpg');
                imgW = 969;
                imgH = 1357;
                w = 768;
                mTop = 116;
                header = 123;
                break;
            case 'mobile-landscape':
                deviceImg.attr('src', themetunerSkinUrl + 'images/iphone-landscape.jpg');
                imgW = 746;
                imgH = 463;
                w = 480;
                mTop = 27;
                header = 22;
                break;
            case 'mobile-portrait':
                deviceImg.attr('src', themetunerSkinUrl + 'images/iphone-portrait.jpg');
                imgW = 384;
                imgH = 875;
                w = 320;
                mTop = 133;
                header = 22;
                break;
            default:
                hide = 1;
        }

        if (hide) {
            deviceImg.hide();

            f.css({
                width: '100%',
                height: '100%'
            }).parent().css({
                'height': '100%',
                'marginTop': 0,
                'min-width': 0
            });

            toggleHeight();

        } else {

            diff = device.width / w;

            height = Math.floor(device.width / (x / y)) - (header * diff);
            deviceImg.css({
                width: imgW * diff,
                height: imgH * diff
            });

            f.css({
                'width': device.width,
                'height': height
            }).parent().css({
                'height': height,
                'marginTop': imgMargin + (mTop + header) * diff,
                'min-width': imgW
            });

            deviceImg.show();
        }
    }


    goResponsive = function() {
        //console.log('here1');
        var holder = $('#themetuner-devices');
        var items = $('ul li a', holder);
        //console.log(items);

        items.click(function() {
            var obj = $(this);
            //console.log('click');
            //console.log(obj);

            var parent = $(iframe).parent('.frame');

            items.removeClass('active');
            obj.addClass('active');
            setDevice(obj.data('screen'));
            parent.attr('class', _currentDevice);



            if (_currentDevice == 'desktop') {
                resizeIframe = true;
                $('#themetuner-iframe-scroll').css({
                    'overflow': 'hidden'
                });
                $(iframe.contentWindow.document.body).removeClass(getDeviceTypes().join(' '));
            } else {
                $('#themetuner-iframe-scroll').css({
                    'overflow': 'auto'
                });
                $(iframe.contentWindow.document.body)
                    .removeClass(getDeviceTypes().join(' '))
                    .addClass(_currentDevice);
                resizeIframe = false;
            }
            resizeDeviceFrames();
            changeSelectorByDevice();
            return false;
        });

        $('#btn-toggle-devices').click(function() {
            var left = holder.offset().left;
            left = (left === 0) ? -52 : 0;

            holder.animate({
                left: left
            }, 300);
            return false;
        });
    };
    changeSelectorByDevice = function() {
        var selectorArray = active.getSelectorParts(),
            d = getDevice();
        selectorArray[0] = 'body' + ((d.type.length) ? '.' + d.type : '');
        // selector change
        active.setSelector(selectorArray.join(' '), null, ['withoutPseudoClass']);
        setObj(active, 0);
    }




    resetInputs = function() {
        resetColors();
        $(inputs).each(function() {
            $(this).val('');
            if ($(this).hasClass('range')) {
                setRange(this);
            }
        });
    };

    resetSelects = function() {
        for (var i = 0; i < selects.length; i++) {
            selects[i].selectedIndex = 0;
        }
    };

    // XXX: not used? when commenting this method out (and method calls), everything remains working
    /** commented out to speed up initialization 
     * @author Yury
     */
    createRanges = function() {
        return false;
        var createSlider = function(inputEl, maxValue) {
            $(inputEl).next().slider({
                value: 0,
                min: 0,
                max: maxValue,
                slide: function(event, ui) {
                    $(inputEl).prev().val(ui.value);
                    activeStyles($(inputEl).prev().attr('id'), ui.value + 'px');
                }
            });
        };
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].className == 'range') {
                var m = 100;
                if (inputs[i].id == 'background-position-x' || inputs[i].id == 'background-position-y') {
                    m = 600;
                }
                createSlider(inputs[i], m);
            }
        }
    };

    setRange = function(obj) {
        var value = (!obj.value) ? 0 : obj.value;
        var m = 100;

        if (obj.id == 'background-position-x' && unitX == 'px') {
            m = 600;
        }
        if (obj.id == 'background-position-y' && unitY == 'px') {
            m = 600;
        }

        $(obj).next().slider({
            value: value,
            min: 0,
            max: m,
            slide: function(event, ui) {
                $(this).prev().val(ui.value);
                activeStyles(obj.id, ui.value + 'px');
            }
        });
    };

    createColors = function() {
        $(inputs).each(function() {
            if ($(this).hasClass('color')) {
                $(this).miniColors({
                    change: function(hex) {
                        activeStyles($(this).attr('id'), hex);
                    }
                });
            }
        });
    };

    resetColors = function() {
        $('input.miniColors').each(function() {
            $(this).miniColors('destroy');
        });
        createColors();
    };

    setColor = function(obj) {
        $(obj).miniColors('value', obj.value);
    };

    setBackground = function(obj) {
        activeStyles(obj.id, obj.value);
    };

    setBorder = function(prop, value) {
        var obj = document.getElementById('border');
        var items = prop.split('-');
        var i;

        if (borderTop && borderRight && borderBottom && borderLeft) {
            for (i = 0; i < obj.options.length; i++) {
                if ('full' == obj.options[i].value) {
                    obj.selectedIndex = i;
                }
            }
        } else if (items[2]) {
            for (i = 0; i < obj.options.length; i++) {
                if (items[1] == obj.options[i].value) {
                    obj.selectedIndex = i;
                }
            }
        } else {
            for (i = 0; i < obj.options.length; i++) {
                if (items[1] == obj.options[i].value) {
                    obj.selectedIndex = i;
                }
            }
        }

        if (value.indexOf('#') != -1) {
            obj = document.getElementById('border-color');
            obj.value = value;
            setColor(obj);
        } else if (value.indexOf('px') != -1) {
            obj = document.getElementById('border-width');
            obj.value = parseFloat(value);
            setRange(obj);
        } else {
            obj = document.getElementById('border-style');
            for (i = 0; i < obj.options.length; i++) {
                if (value == obj.options[i].value) {
                    obj.selectedIndex = i;
                }
            }
        }
    };

    addItemsToArray = function(prop, value, name) {
        if (!name) {
            name = active.getSelector();
        }

        var elementExists = false;
        var element, exists;

        var i;
        if (data.length > 0) {
            for (i = 0; i < data.length; i++) {
                if (data[i].name == name) {
                    element = data[i];
                    elementExists = true;
                    break;
                }
            }

            if (elementExists) {
                if (element.styles) {
                    exists = false;
                    for (var j = 0; j < element.styles.length; j++) {
                        if (element.styles[j].prop == prop) {
                            element.styles[j].value = value;
                            exists = true;
                            break;
                        }
                    }

                    if (!exists) {
                        element.styles.push({
                            'prop': prop,
                            'value': value
                        });
                    }
                } else {
                    element.styles = [];
                    element.styles.push({
                        'prop': prop,
                        'value': value
                    });
                }
                data[i] = element;
            } else {
                i = data.length;
                data[i] = {
                    'name': name
                };
                data[i].styles = [];
                data[i].styles.push({
                    'prop': prop,
                    'value': value
                });
            }
        } else {
            i = data.length;
            data[i] = {
                'name': name
            };
            data[i].styles = [];
            data[i].styles.push({
                'prop': prop,
                'value': value
            });
        }
    };

    deleteItemsFromArray = function(prop) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].name == active.getSelector()) {
                if (data[i].styles) {
                    for (var j = 0; j < data[i].styles.length; j++) {
                        if (data[i].styles[j].prop == prop) {
                            data[i].styles.splice(j, 1);
                            break;
                        }
                    }
                }
                break;
            }
        }
    };

    var saveConfirmationPopup = function() {
        var id = '#save-confirm-popup';
        var obj = $(id);
        obj.show();

        $.colorbox({
            href: id,
            escKey: false,
            scrolling: false,
            overlayClose: false,
            inline: true,
            innerWidth: 440,
            onLoad: function() {
                var themeNameHolderEl = $('#save-confirm-popup-tune-name', obj);
                themeNameHolderEl.empty();
                if (tuneName) {
                    themeNameHolderEl.append('"' + tuneName + '"');
                }

                // change 'save' button text
                if (isNewTheme) {
                    $('#popup-save-yes').attr('title', saveTuneAsButtonText);
                    $('#popup-save-yes span:not(:has("*"))').text(saveTuneAsButtonText); // change inner most span text
                } else {
                    $('#popup-save-yes').attr('title', saveAndCloseButtonText);
                    $('#popup-save-yes span:not(:has("*"))').text(saveAndCloseButtonText); // change inner most span text
                }

            },
            onComplete: function() {
                $('#popup-save-yes', obj).click(function(e) {
                    obj.hide();
                    if (isNewTheme) {
                        savePresetPopup();
                    } else {
                        saveStyles(function() {
                            setLocation(backUrl);
                        });
                    }
                    e.preventDefault();
                });

                $('#popup-save-no', obj).click(function(e) {
                    save = false;
                    setLocation(backUrl);
                    e.preventDefault();
                });

                $('#popup-save-cancel, #popup-save-close', obj).click(function(e) {
                    $.colorbox.close();
                    obj.hide();
                    e.preventDefault();
                });
            }
        });
    };

    // update or reset logo
    var updateLogo = function(src) {
        $('#logo_image').val(src || '');
        var logoImgEl = $('.logo img', iframe.contentDocument);
        if (src) {
            // set new logo
            logoImgEl.attr('src', src);
            clearLogo = false;
        } else {
            // restore original logo
            logoImgEl.attr('src', $('#logo_orig_image').val());
        }
    };

    var resetStylesPopup = function() {
        var id = '#save-reset-popup';
        var obj = $(id);
        obj.show();

        $.colorbox({
            href: id,
            escKey: false,
            scrolling: false,
            overlayClose: false,
            inline: true,
            innerWidth: 440,
            onComplete: function() {
                $('#popup-reset-yes', obj).click(function(event) {
                    resetInputs();
                    resetSelects();
                    active.reset();
                    _resetStyles();
                    updateLogo();
                    setSaveNeeded(true);

                    restoreDefaults = true;
                    clearLogo = true;

                    $.colorbox.close();
                    obj.hide();
                    event.preventDefault();
                });

                $('#popup-reset-cancel, #popup-reset-close', obj).click(function(event) {
                    $.colorbox.close();
                    obj.hide();
                    event.preventDefault();
                });
            }
        });
    };
    var changeMode = function(view) {

        switch (view) {

            case 'edit':
                enableDesign = true;
                showThemerIntro();
                if(iframe.contentWindow.themer.detachEvents)
                    iframe.contentWindow.themer.detachEvents(); // remove all iframe event handlers in edit mode
                break;
            case 'layout':
                active.reset();
                enableDesign = false;
                hideThemerIntro();
                break;
            /*
            case 'devices':
                active.reset();
                enableDesign = false;
                break;*/
            case 'view':
                active.reset();
                enableDesign = false;
                showThemerIntro();
                iframe.contentWindow.setLocation = originalSetLocation;
                break;
        }

        return switchViewOptions(view);
    }
    observeButtons = function() {
        $(closeBtn).click(function(event) {
            var mayClose = false;
            if (hasChanges()) {
                saveConfirmationPopup();
            } else {
                mayClose = true;
            }

            if (mayClose) {
                if (!window.opener) {
                    setLocation(backUrl);
                } else {
                    window.close();
                }
            }
            event.preventDefault();
        });

        $('#themetuner-tabs').on('click', 'input[type="radio"]', function() {

            var current = $('#themetuner-tabs input[checked="checked"]').val();
            var target = $(this).val();

            if (current === 'edit' && target !== 'edit') {
                // if we navigating away from edit view we need to reattach all event handlers
                // and to do so we reload the iframe. 
                reloadIframe(function() {
                    changeMode(target)
                });

            } else {
                changeMode(target);
            }
        });

        $(saveAsBtn).click(function(e) {
            savePresetPopup();
            e.preventDefault();
        });

        $(saveBtn).click(function(e) {
            if (hasChanges()) {
                $(iframe).hide();
                saveStyles(function(response) {
                    var res = $.evalJSON(response);
                    if (Object.keys(res.errors).length) {
            
                        var msg = 'Error: ';
                        $.each(res.errors, function(errorType, errorDescr) {
                            msg += errorDescr + '\n';
                        });
                        alert(msg);

                    } else {
                        // save was a success, redirect to newly created preset edit page
                        $(iframe).fadeIn(400);
                    }
                });
            }
            e.preventDefault();
        });

        $(resetBtn).click(function(event) {
            resetStylesPopup();
            event.preventDefault();
        });

        $('input.color, input.background').each(function() {
            var btn = $('<a href="#" class="clear">Clear</a>');
            var obj = $(this);
            var parent = obj.parents('div.item');
            var prop = $(this).attr('id');
            parent.append(btn);

            btn.click(function() {
                obj.val('');
                activeStyles(prop, '');
                obj.trigger('keyup');
                return false;
            });
        });

        $('a.unit').click(function() {
            var obj = $(this);
            var input = obj.parent().find('input.range');

            if (obj.text() == 'px') {
                obj.text('%');
                if (obj.attr('id') == 'unit-x') {
                    unitX = '%';
                } else {
                    unitY = '%';
                }
            } else {
                obj.text('px');
                if (obj.attr('id') == 'unit-x') {
                    unitX = 'px';
                } else {
                    unitY = 'px';
                }
            }
            setRange(input);
            input.trigger('keyup');

            return false;
        });

    };

    var toggleTopBar = function(show) {

        if (show) {
            $('#themetuner-top-bar').show();
            $('#themetuner .scroller').css('margin-top', '40px');
            $('#themetuner .scroller > .padding').css('padding-top', '10px');

        } else {
            $('#themetuner-top-bar').hide();
            $('#themetuner .scroller').css('margin-top', '0');
            $('#themetuner .scroller > .padding').css('padding-top', '20px');
        }
    }

    var switchViewOptions = function(view) {

        $('#themetuner .tab').each(function() {
            var $tab = $(this);

            if ($tab.hasClass('tab-' + view)) {
                $tab.addClass('active');
            } else {
                $tab.removeClass('active');
            }
        });
        $('#themetuner-tabs > input[type="radio"]').removeAttr('checked');
        $('#mode-' + view).attr('checked', 'checked');

        // if(view === 'edit'){
        //     toggleTopBar(true);
        // } else {
        //     toggleTopBar(false);
        // }

        switch (view) {
            case 'edit':
                toggleLayoutEditor(false);
                initEmptyBreadcrumbs();
                $('#welcome-message').hide();
                $('#styling-message').show();
                $('#themetuner-layout-values').hide();
                $(current).show();
                $('#themetuner-values').fadeIn(400, "swing", toggleHeight);
                //$('#themetuner-devices').hide();
                //$('#themetuner-devices').show();
                break;

            case 'layout':
                toggleLayoutEditor(true);
                $('#themetuner-layout-values').fadeIn(400, "swing", toggleHeight);
                $(current).hide();
                $('#themetuner-values').hide();
                //$('#themetuner-devices').hide();
                break;

            case 'view':
                toggleLayoutEditor(false);
                $('#welcome-message').show();
                $('#styling-message').hide();
                $('#themetuner-layout-values').hide();
                $('#themetuner-values').hide();
                //$('#themetuner-devices').hide();
                $('#themetuner-top-bar').hide();
                showThemerIntro();
                break;
            /*
            case 'devices':
                toggleLayoutEditor(false);
                $('#themetuner-layout-values').hide();
                $('#themetuner-values').hide();
                $('#themetuner-devices').show();
                $(current).hide();
                hideThemerIntro();
                break;
            */
        }
        toggleHeight();
    };


    hasChanges = function() {
        return save;
    };

    getSerializedData = function(dontCheckLicense) {

        var layoutData = collectLayoutData();
        var newData = [];

        if (license.hasAccess(COMPONENT.DESIGN)) {
            for (var i = 0; i < data.length; i++) {
                newData.push(data[i]);
            }
        }

        if (dontCheckLicense || license.hasAccess(COMPONENT.LAYOUT)) {
            for (var i = 0; i < layoutData.length; i++) {
                newData.push(layoutData[i]);
            }
        }

        backupToJson(true);

        // replace themetuners pseudo classes with native css pseudo classes
        var newData = $.toJSON(newData).replace('.themetuner-pseudo--', ':', 'g');
        backupToJson(false);

        return newData;
    };

    saveStyles = function(callback, presetData) {
        restoreDefaults = false;     
        Element.show('loading-mask');
        new Ajax.Request(saveUrl, {
            method: 'post',
            parameters: {
                data: getSerializedData(),
                logo: $('#logo_image').val(),
                presetId: (presetData && presetData.preset_id) || $('#presetId').val(),
                presetName: (presetData && presetData.preset_name) || '',
                store_id: $('#store_id').val(),
                theme: theme
            },
            onComplete: function(transport) {

                var res = $.evalJSON(transport.responseText);
                if (!Object.keys(res.errors).length) {
                    setSaveNeeded(false);
                }

                if (callback) {
                    callback(transport.responseText);
                }
            }
        });
    };

    zeroFill = function(number, limit) {
        for (var i = number.toString().length; i < limit; i++) {
            number = '0' + number;
        }
        return number;
    };

    convertColors = function(colors) {
        //if ( colors == 'rgba(0, 0, 0, 0)' ) return '';
        if (colors == 'transparent' || colors == 'rgba(0, 0, 0, 0)') {
            return '';
        }
        var m = /rgba?\((\d+), (\d+), (\d+)/.exec(colors);
        if (m) {
            return '#' + zeroFill((m[1] << 16 | m[2] << 8 | m[3]).toString(16), 6);
        } else {
            return colors;
        }
    };

    fillSelects = function() {
        ready = false;
        resetInputs();
        resetSelects();
        var styles = arrStyles;
        var value, items;

        for (var i = 0; i < styles.length; i++) {
            if ($.inArray(styles[i].prop, arrBorder) > -1) {
                setBorder(styles[i].prop, styles[i].value);
            } else {
                var obj = document.getElementById(styles[i].prop);

                if (styles[i].prop == 'background-position') {
                    value = styles[i].value.split(' ');

                    if (value[0].indexOf('%') != -1) {
                        unitY = '%';
                        $('a#unit-y').text('%');
                    }
                    if (value[1].indexOf('%') != -1) {
                        unitX = '%';
                        $('a#unit-x').text('%');
                    }

                    obj = document.getElementById(styles[i].prop + '-y');
                    obj.value = parseInt(value[0], 10);
                    obj = document.getElementById(styles[i].prop + '-x');
                    obj.value = parseInt(value[1], 10);
                } else {
                    if (obj) {
                        if (styles[i].prop == 'background-position') {
                            value = styles[i].value.split(' ');
                            obj = document.getElementById(styles[i].prop + '-y');
                            obj.value = parseInt(value[0], 10);
                            obj = document.getElementById(styles[i].prop + '-x');
                            obj.value = parseInt(value[1], 10);
                        } else if ($(obj).hasClass('range')) {
                            value = parseInt(styles[i].value, 10);
                            if (isNaN(value) || value === 0) {
                                value = '';
                            }
                            obj.value = value;
                            setRange(obj);
                        } else if ($(obj).hasClass('color')) {
                            value = convertColors(styles[i].value);
                            obj.value = value;
                            setColor(obj);
                        } else if ($(obj).hasClass('background')) {
                            value = styles[i].value;
                            value = value.replace('url(', '');
                            value = value.replace(')', '');
                            obj.value = value;
                            //activeStyles(obj.id, obj.value);
                            //setBackground(obj);
                        } else if (styles[i].prop == 'width' || styles[i].prop == 'height') {
                            value = styles[i].value;
                            obj.value = parseInt(value, 10);
                        } else {
                            if (styles[i].prop == 'font-family') {
                                styles[i].value = styles[i].value.replace(/'/g, '');
                                items = styles[i].value.split(',');
                                styles[i].value = $.trim(items[0]);
                            }
                            if (styles[i].prop == 'background-repeat') {
                                items = styles[i].value.split(' ');
                                styles[i].value = $.trim(items[0]);
                            }
                            for (var j = 0; j < obj.options.length; j++) {
                                if (styles[i].value == obj.options[j].value) {
                                    obj.selectedIndex = j;
                                    $(obj).change();
                                }
                            }
                        }
                    }
                }
            }
        }

        ready = true;
    };

    currentPath = function() {
        var path = [];

        var activeArray = active.getSelectorTree();
        var allParts = active.extractSelectorStructure(activeArray);
        var selectorParts = active.extractSelectorStructure();

        var i;
        for (i = 0; i < activeArray.length; i++) {
            var string = '<li>';

            var array = allParts[i].components;

            string += '<a href="#" class="' + (i == activeArray.length - 1 ? 'last' : '') + '" data-counter="' + i + '">' + selectorParts[i].part + '</a>';

            if (array.length > 1) {
                string += '<ul>';
                for (var j = 0; j < array.length; j++) {
                    if (array[0]) {
                        if (j !== 0) {
                            string += '<li>';
                            string += '<input type="checkbox" ' + ($.inArray(array[j], selectorParts[i].components) > -1 ? 'checked="checked"' : '') + ' name="path_selectors[' + i + ']" value="' + array[0] + array[j] + '" />';
                            string += array[j] + '</li>';
                        }
                    }
                }
                if (array[0] == 'a') {
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':hover" />:hover</li>';
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':active" />:active</li>';
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':visited" />:visited</li>';
                }
                string += '</ul>';
            } else {
                if (array[0] == 'a') {
                    string += '<ul>';
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':hover" />:hover</li>';
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':active" />:active</li>';
                    string += '<li><input type="checkbox" name="path_selectors[' + i + ']" value="' + array[0] + ':visited" />:visited</li>';
                    string += '</ul>';
                }
            }

            string += '</li>';
            path.push(string);
        }

        $(current).html(path.join(''));

        $('li', current).live({
            mouseenter: function() {
                $(this).find('ul').show();
            },
            mouseleave: function() {
                $(this).find('ul').hide();
            }
        });

        $('ul li', current).bind('click', function(event) {
            $(this).find('input').trigger('click');
            event.preventDefault();
        });

        $('ul li input', current).click(function(event) {
            event.stopImmediatePropagation();
        });

        $('ul li input', current).change(function() {
            var checkboxEl = $(this);
            if (enableDesign && !checkboxEl.attr('disabled')) {

                var isChecked = !! checkboxEl.attr('checked');
                var val = checkboxEl.val();
                var allCheckboxes = $('input', checkboxEl.parent('li').parents('li'));

                if (val.indexOf(':') != -1) {
                    // disable other pseudo-class selectboxes, only one can be selected at once
                    $.each(allCheckboxes, function(indx, el) {
                        var element = $(el);
                        if (element.val().indexOf(':') != -1 && element.val() != val) {
                            element.attr('disabled', isChecked);
                        }
                    });
                }

                // combine selected classes and id to atomic selector part
                var combinedSelectorPart = '';
                var splitSymbol;
                $.each(allCheckboxes, function(indx, el) {
                    var element = $(el);
                    if (element.val().indexOf('.') != -1) {
                        splitSymbol = '.';
                    } else if (element.val().indexOf('#') != -1) {
                        splitSymbol = '#';
                    } else { // split by ":"
                        splitSymbol = ':';
                    }
                    var valueChunks = element.val().split(splitSymbol);

                    if (indx === 0) {
                        combinedSelectorPart += valueChunks[0];
                    }
                    if ( !! element.attr('checked')) {
                        combinedSelectorPart += splitSymbol + valueChunks[1];
                    }
                });

                var selectorPartEl = $(this).parent('li').parents('li').find('a');
                selectorPartEl.text(combinedSelectorPart);


                // replace active selector
                var tmpArray = active.getSelector().split(' ');
                for (i = 0; i < tmpArray.length; i++) {
                    if (i == selectorPartEl.data('counter')) {
                        tmpArray[i] = selectorPartEl.text();
                    }
                }

                // selector changes, tree remains the same
                active.setSelector(tmpArray.join(' '));
                setObj(active, 1);
            }
        });
    };

    setObj = function(activeObj, flag) {
        var obj = activeObj.getElements();
        arrStyles = [];
        borderTop = false;
        borderRight = false;
        borderBottom = false;
        borderLeft = false;

        var i, prop, value;
        for (i = 0; i < arrAllowed.length; i++) {
            prop = arrAllowed[i];
            value = obj.css(prop);

            if (value == 'undefined') {
                value = '';
            }

            if (value) {
                // quick fix. ( don't know why but "solid rgb(255, 255, 255)" was added to text-decoration value... )
                if (prop == 'text-decoration') {
                    value = value.split(' ')[0];
                }

                if (prop == 'background-image') {
                    if (value == 'none') {
                        value = '';
                    } else {
                        // remove domain part
                        value = value.replace(document.location.protocol + '//' + document.location.host, '');
                        value = value.replace('"', '', 'g');
                    }
                }

                if (prop == 'color' || prop == 'background-color') {
                    value = convertColors(value);
                }

                if (prop == 'font-weight') {
                    if (value == 400) {
                        value = 'normal';
                    } else if (value == 700) {
                        value = 'bold';
                    }
                }

                if (prop && value) {
                    arrStyles.push({
                        'prop': prop,
                        'value': value
                    });
                }
            }
        }

        for (i = 0; i < arrBorder.length; i++) {
            prop = arrBorder[i];
            value = obj.css(prop);

            if (value == 'undefined') {
                value = '';
            }

            if (value && value != '0px') {
                if (prop == 'border-top-width') {
                    borderTop = true;
                    arrStyles.push({
                        'prop': 'border-top-color',
                        'value': convertColors(obj.css('border-top-color'))
                    });
                    arrStyles.push({
                        'prop': 'border-top-style',
                        'value': obj.css('border-top-style')
                    });
                    arrStyles.push({
                        'prop': 'border-top-width',
                        'value': value
                    });
                } else if (prop == 'border-right-width') {
                    borderRight = true;
                    arrStyles.push({
                        'prop': 'border-right-color',
                        'value': convertColors(obj.css('border-right-color'))
                    });
                    arrStyles.push({
                        'prop': 'border-right-style',
                        'value': obj.css('border-right-style')
                    });
                    arrStyles.push({
                        'prop': 'border-right-width',
                        'value': value
                    });
                } else if (prop == 'border-bottom-width') {
                    borderBottom = true;
                    arrStyles.push({
                        'prop': 'border-bottom-color',
                        'value': convertColors(obj.css('border-bottom-color'))
                    });
                    arrStyles.push({
                        'prop': 'border-bottom-style',
                        'value': obj.css('border-bottom-style')
                    });
                    arrStyles.push({
                        'prop': 'border-bottom-width',
                        'value': value
                    });
                } else if (prop == 'border-left-width') {
                    borderLeft = true;
                    arrStyles.push({
                        'prop': 'border-left-color',
                        'value': convertColors(obj.css('border-left-color'))
                    });
                    arrStyles.push({
                        'prop': 'border-left-style',
                        'value': obj.css('border-left-style')
                    });
                    arrStyles.push({
                        'prop': 'border-left-width',
                        'value': value
                    });
                }
            }
        }

        if (!flag) {
            currentPath();
        }
        active.markElements();
        fillSelects();
    };

    addObjHover = function(obj) {
        $('label.hover-selector', iframe.contentDocument).remove();
        var holder = $('body', iframe.contentDocument);
        var tag = obj.prop('tagName').toLowerCase();
        var hover = $('<label/>');
        var top = obj.offset().top;
        var left = obj.offset().left;
        var title = tag;
        var klass = tag;

        if (obj.attr('class')) {
            title += '.' + obj.attr('class');
        } else if (obj.attr('id')) {
            title += '#' + obj.attr('id');
        }
        hover.text(title);

        if (obj.attr('class')) {
            klass += '-' + obj.attr('class');
        }
        if (obj.attr('id')) {
            klass += '-' + obj.attr('id');
        }
        klass += '-' + obj.index(holder);

        hover.css({
            'position': 'absolute',
            'display': 'block',
            'z-index': 9999,
            'padding': '2px 6px',
            'background': '#2bfde0',
            'font-size': '10px',
            'line-height': '10px',
            'top': top,
            'left': left
        });
        hover.addClass('hover-selector');
        hover.addClass(klass);
        hover.appendTo(holder);
    };

    removeObjHover = function(obj) {
        var klass = 'label.' + obj.prop('tagName').toLowerCase();
        if (obj.attr('class')) {
            klass += '-' + obj.attr('class');
        }
        if (obj.attr('id')) {
            klass += '-' + obj.attr('id');
        }
        klass += '-' + obj.index(holder);

        $(klass, iframe.contentDocument).remove();
    };


    setIframeData = function() {


        originalSetLocation = iframe.contentWindow.setLocation;
        if (!$("#mode-view").attr('checked')) {
            iframe.contentWindow.setLocation = function() {
                return false;
            };
        }

        $('#themetuner-css', iframe.contentDocument).after(activeCssFile);
        $('#themetuner-css', iframe.contentDocument).after(cssFile);

        $(iframe.contentDocument).on('mouseover.themer', '*', function(event) {
            if (enableDesign && $(event.target).attr('alt') != '[TR]') {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }

                //addObjHover(obj);
                $('*', iframe.contentDocument).css('outline', '');
                $(this).css('outline', '1px dotted #2bfde0');
            }
        });
        $(iframe.contentDocument).on('mouseout.themer', '*', function(event) {
            if (enableDesign) {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }

                //removeObjHover(obj);
                $(this).css('outline', '');
            }
        });
        $(iframe.contentDocument).on('click.themer', '*', function(event) {

            var $target = $(event.target);

            if (enableDesign && $target.attr('alt') != '[TR]') {

                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                if (event.stopImmediatePropagation) {
                    event.stopImmediatePropagation();
                }

                hideThemerIntro();

                var obj = $(this);
                var activeArray = obj.getPath().reverse();

                if (!tmpActive) {
                    tmpActive = obj;
                    obj.data('counter', activeArray.length);
                }

                if (obj[0] != tmpActive[0]) {
                    obj.data('counter', activeArray.length);
                }

                activeArray = activeArray.slice(0, obj.data('counter'));

                // get selector from selector tree and apply modifiers
                active.setSelector(null, activeArray, ['oneClassOnly']);
                tmpActive = obj;

                setObj(active, 0);

                if (obj.data('counter') < 2) {
                    activeArray = obj.getPath().reverse();
                    // get selector from selector tree
                    active.setSelector(null, activeArray);
                    obj.data('counter', activeArray.length);
                } else {
                    obj.data('counter', (obj.data('counter') - 1));
                }
                return false;
            }
        }).data('counter');

        $('a', current).live('click', function(event) {
            if (enableDesign && $(event.target).attr('alt') != '[TR]') {
                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }

                if (!$(this).hasClass('last')) { // last breadcrumb element is not clickable
                    var treeArray = active.getSelectorTree().slice(0, $(this).data('counter') + 1);
                    var selectorArray = active.getSelectorParts().slice(0, $(this).data('counter') + 1);

                    // selector and tree both change, apply also modifier
                    active.setSelector(selectorArray.join(' '), treeArray, ['withoutPseudoClass']);
                    setObj(active, 0);
                }
            }
        });


    };

    loadStyles = function(stylesheetId) {
        parseStylesheet(stylesheetId || 'themetuner-css');
        $(iframe).fadeIn(400);
    };

    function eliminateDuplicates(arr) {
        arr.sort();
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] === arr[i - 1]) {
                arr.splice(i--, 1);
            }
        }
        arr.reverse();
        return arr;
    }

    generateUsedColors = function() {
        var rows = 7;
        var cols = Math.ceil(usedColors.length / rows);
        var width = cols * 20 + cols;
        var holder = $('<div id="usedColors" style="width:' + width + 'px;"></div>');

        for (var i = 0; i < usedColors.length; i++) {
            var obj = $('<div style="background:' + usedColors[i] + '">&nbsp;</div>');
            holder.append(obj);
        }

        return holder;
    };

    getAllColors = function() {
        var files = iframe.contentWindow.document.styleSheets;
        var value;

        for (var f = 0; f < files.length; f++) {
            var stylesheet = files[f];

            if (stylesheet) {
                var rules = [];
                try {
                    rules = stylesheet.cssRules || stylesheet.rules;
                } catch (err) {
                    // just ignore this stylesheet as it is probably cross domain issue and gives security error
                }

                if (rules && rules.length > 0) {
                    for (var i = 0; i < rules.length; i++) {
                        if (rules[i].style) {
                            var props = rules[i].style.cssText.split(';');

                            for (var k = 0; k < props.length; k++) {
                                var arr3 = props[k].split(':');
                                var prop = $.trim(arr3[0]).toLowerCase();

                                if (prop == 'color' || prop == 'background-color' || prop == 'border-top-color' || prop == 'border-right-color' || prop == 'border-bottom-color' || prop == 'border-left-color') {
                                    value = convertColors($.trim(arr3[1]));
                                    value = value.replace(' !important', '');
                                    if (value != 'transparent') {
                                        usedColors.push(value);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        usedColors = eliminateDuplicates(usedColors);
    };

    showThemerIntro = function() {
        var obj = $('#themetuner-intro');
        obj.fadeIn(400);
    };

    hideThemerIntro = function() {
        var obj = $('#themetuner-intro');
        obj.fadeOut(400);
    };

    initSelectBox = function() {
        $('dl.dropdown').remove();

        var obj = $('#font-family');
        var visible = 25;
        var options = $('option', obj);
        var title = $('option:selected', obj).text();
        var holder = $('<dl class="dropdown" />');
        var cta = $('<dt>' + title + '</dt>');
        var x = 1;

        holder.append(cta);
        holder.insertAfter(obj);
        $(obj).hide();

        $('#themetuner').append('<dd id="themer-fonts"><ul></ul></dd>');
        var box = $('#themer-fonts');

        box.css({
            "left": holder.offset().left,
            "top": 0
        });

        if (options.length > 1) {

            for (var i = 0; i < options.length; i++) {
                var li = $('<li data-value="' + options.eq(i).val() + '"><span>' + options.eq(i).text() + '</span></li>');

                if (options.eq(i).val()) {
                    li.append('<span style="font-family:' + options.eq(i).val() + '">sample</span>');
                }
                $('ul', box).append(li);
            }

            var height = ($('li', box).first().outerHeight()) * visible;
            if (options.length > visible) {
                $('ul', box).css('height', height);
            }

            $('ul', box).hide();

            cta.click(function() {
                //$('dl.dropdown ul').not( $('ul', box) ).hide();
                $('ul', box).toggle();
                return false;
            });

            $('li', box).click(function() {
                $('li', box).removeClass('selected');
                $(this).addClass('selected');
                var text = $('span:first-child', this).text();
                $('dt', holder).text(text);
                $('ul', box).hide();

                if ($(obj).val() != $(this).data('value')) {
                    $(obj).val($(this).data('value'));
                    $(obj).change();
                }

                return false;
            });
        }

        obj.change(function() {
            var value = $(this).val();
            $('li', box).removeClass('selected');
            $('li[data-value="' + value + '"]', box).addClass('selected');
            $('dt', holder).text(value);
            $('ul', box).hide();
        });

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (!$clicked.parents().hasClass('dropdown'))
                $('ul', box).hide();
        });
    };



    /**
     * Preload google fonts
     * Uses google webfont library.
     *
     * @param  {Array} data     [font definitions]
     * @param  {Object} context  [document context]
     * @param  {Function} complete [success callback]
     * @param  {Function} error    [error callback]
     * @param  {Function} progress [progress callback]
     *
     * @return {void}
     */
    loadFonts = function(data, context, success, error, progress) {
        data = data || [];
        success = success || function() {};
        error = error || function() {};
        progress = progress || function() {};
        context = context || document;




        var fonts = [];
        var baseUrl = 'http://fonts.googleapis.com/css?family=';
        var chunkSize = 40;
        var n = 0;

        var _createChunks = function(arr) {
            var R = [];
            for (var i = 0; i < arr.length; i += chunkSize)
                R.push(arr.slice(i, i + chunkSize));
            return R;
        }

        var _fetchStylesheet = function(url, callback, fail) {
            var done = false;
            var node = context.createElement("link");
            node.rel = 'stylesheet';
            node.href = url;

            node.onload = node.onreadystatechange = function() {
                if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
                    done = true;
                    return callback();
                }
            };
            node.onerror = fail;
            context.getElementsByTagName("head")[0].appendChild(node);
        }


        for (var i = 0; i < data.length; i++) {
            var name = data[i].family.replace(/ /g, '+');
            fonts.push(name);
        }
        i = 0;
        var er = 0;
        var chunks = _createChunks(fonts);
        var count = chunks.length;
        var l = count;
        var __nextFrame = function() {
            if (i < l && !er) {
                var url = baseUrl;
                var len = chunks[i].length;
                for (var n = 0; n < len; n++) {
                    url += chunks[i][n] + '|';
                }
                url = url.slice(0, -1);
                _fetchStylesheet(url, function() {

                    count--;
                    progress(100 / (l / (l - count)));
                    if (count <= 0) {
                        success();
                    }
                }, function() {
                    er = 1;
                    error();
                });
                i++;
                setTimeout(function() {
                    __nextFrame()
                }, 500);
            }
        }
        __nextFrame();
    }

    setupGoogleFonts = function(data) {

        if (data && data.length) {
            var sel = $('#font-family'),
                len = data.length,
                fonts = [];

            // Append fonts to selectbox
            for (var i = 0; i < len; i++) {
                var name = data[i].family.replace(/ /g, '+');
                fonts.push(name);
                sel.append($('<option>', {
                    value: data[i].family
                }).text(data[i].family));
            }

            /**
             * setup loading callbacks
             */
            var count = 2;
            var success = function() {
                count--;
                if (count <= 0) {
                    //showLoader('Google fonts loaded');
                    loaderMsg('Google fonts loaded');
                    initSelectBox();
                    window.setTimeout(hideLoader, 2000);
                }
                return;
            };

            var err = function() {
                initSelectBox();
                hideLoader();
            }

            /**
             * Create progress indication by combining two values
             * (iframe and document)
             */
            var p1 = 0,
                p2 = 0;
            var showProgress = function() {
                var val = (p1 + p2) > 0 ? Math.round((p1 + p2) / 2) : 0;
                loaderMsg('Loading Google fonts (' + val + '% completed)');
            };


            loadFonts(data, iframe.contentDocument, success, err, function(val) {
                p1 = val;
                showProgress();
            });
            loadFonts(data, document, success, err, function(val) {
                p2 = val;
                showProgress();
            });
        }
    };

    /**
     * fetch font definitions & setup fonts
     * @return {void}
     */
    getGoogleFonts = function() {
        //var url = 'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyCzoWw6fsHHbhB8Ow2jDOS7Or78eD61yQo&callback=?';
        $.getJSON('/js/themetuner/googlefonts.json', function(data) {
            _fonts = data.items.slice(0, 100);
            setupGoogleFonts(_fonts);
        });
    };

    initEmptyBreadcrumbs = function() {
        $(current).html("<li class=\"no-selection\">" + $("#empty_breadcrumbs_text").val() + "</li>");
    }

    var BackupJSON = {}
    backupToJson = function(isDelete) {
        // remove prototype implementation if toJSON
        if (window.Prototype) {
            if (isDelete) {
                BackupJSON.Object = Object.prototype.toJSON;
                BackupJSON.Array = Array.prototype.toJSON;
                BackupJSON.Hash = Hash.prototype.toJSON;
                BackupJSON.String = String.prototype.toJSON;
                delete Object.prototype.toJSON;
                delete Array.prototype.toJSON;
                delete Hash.prototype.toJSON;
                delete String.prototype.toJSON;
            } else {
                Object.toJSON = BackupJSON.Object;
                Array.prototype.toJSON = BackupJSON.Array;
                Hash.prototype.toJSON = BackupJSON.Hash;
                String.prototype.toJSON = BackupJSON.String;
            }
        }
    }

    init = function() {

        getGoogleFonts();
        setSaveNeeded(false);

        createColors();
        createRanges();
        toggleHeight();
        goResponsive();
        observeButtons();
        initEmptyBreadcrumbs();

        themer.iframeBeforeLoad = function(mode) {
            showLoader();

            // reset layout editing after navigating inside frame 
            if (mode === 'layout') {
                _afterIframeLoaded.push(function() {
                    switchViewOptions(mode);
                });
            }
        }
        // recalc. iframe height when window is resized.   
        $(window).resizeend({
            'onDragEnd': toggleHeight
        });


        var getSelectboxStyleActivator = function(caller) {
            return function() {
                activeStyles(caller.id, caller.value);
            };
        };

        var getInputStyleActivator = function(caller, type) {
            if (type == 'keyup') {
                return function() {
                    if ($(caller).hasClass('range')) {
                        activeStyles(caller.id, caller.value + 'px');
                        setRange(caller);
                    } else if (!$(caller).hasClass('background') || !$(caller).hasClass('background-image')) {
                        activeStyles(caller.id, caller.value);
                    }
                };

            } else if (type == 'keydown') {
                return function(event) {
                    if ($(caller).hasClass('range') || $(caller).hasClass('dimension')) {
                        var value = parseInt($(caller).val(), 10);

                        if (event.which == 38) {
                            if (value < 9999) {
                                value++;
                                $(caller).val(value);
                            } else if (!value) {
                                $(caller).val(1);
                            }
                        } else if (event.which == 40) {
                            if (value > 0) {
                                value--;
                                $(caller).val(value);
                            } else {
                                $(caller).val('');
                            }
                        }
                    }
                };
            } else if (type == 'change') {
                return function() {
                    activeStyles(caller.id, caller.value);
                };
            }
        };

        var i;
        for (i = 0; i < selects.length; i++) {
            selects[i].onchange = getSelectboxStyleActivator(selects[i]);
        }

        for (i = 0; i < inputs.length; i++) {
            inputs[i].onkeyup = getInputStyleActivator(inputs[i], 'keyup');
            inputs[i].onkeydown = getInputStyleActivator(inputs[i], 'keydown');

            if (inputs[i].className == 'background') {
                inputs[i].onchange = getInputStyleActivator(inputs[i], 'change');
            }
        }

        var addLogoBtn = function() {
            var btn = $('#btn-logo');
            var clearBtn = $('#btn-logo-clear');
            var img = $('.logo img', iframe.contentDocument);

            btn.show().css({
                'opacity': 0
            });
            clearBtn.show().css({
                'opacity': 0
            });

            var getLogoPosition = function() {
                return {
                    'left': (img.offset().left + $(iframe).offset().left + 5),
                    'top': (img.offset().top + $(iframe).offset().top + 5)
                };
            };

            img.hover(function(event) {
                // animate only when event was not triggered by hovering 'Change logo' button
                if (event.relatedTarget && enableDesign) {
                    var logoPosition = getLogoPosition();

                    btn.show().css({
                        'top': logoPosition.top,
                        'left': logoPosition.left
                    });
                    btn.stop(true).animate({
                        opacity: 1
                    }, 400);

                    if ($('#logo_image').val()) {
                        clearBtn.show().css({
                            'top': logoPosition.top,
                            'left': logoPosition.left + btn.outerWidth() + 5
                        });
                        clearBtn.stop(true).animate({
                            opacity: 1
                        }, 400);
                    }
                }
            }, function(event) {
                // animate only when event was not triggered by hovering 'Change logo' button
                if (event.relatedTarget) {
                    var logoPosition = getLogoPosition();

                    btn.show().css({
                        'top': logoPosition.top,
                        'left': logoPosition.left
                    });
                    btn.stop(true).animate({
                        opacity: 0
                    }, 400);

                    if ($('#logo_image').val()) {
                        clearBtn.show().css({
                            'top': logoPosition.top,
                            'left': logoPosition.left + btn.outerWidth() + 5
                        });
                        clearBtn.stop(true).animate({
                            opacity: 0
                        }, 400);
                    }
                }
            });

            btn.click(function() {
                var self = this;
                MediabrowserUtility.openDialog(getFileBrowserUrl('logo_image'), 962, 550, 'Insert logo image');
                setTimeout(window.pollWindow, 300);

                $('#logo_image').observe(function() {
                    updateLogo($(this).val());
                    $(self).stop(true).css({
                        'opacity': 0
                    });
                    setSaveNeeded(true);
                });

                return false;
            });

            clearBtn.click(function(event) {
                updateLogo();
                $(this).stop(true).css({
                    'opacity': 0
                });
                setSaveNeeded(true);
                event.preventDefault();
            });
        };


        var iframeInitialized = 0;
        var onFirstIframeLoad = function() {

            if (!iframeInitialized) {
                observeIframeLoad();
                setIframeData();
                loadStyles();
                getAllColors();
                updateLogo($('#logo_image').val());
                addLogoBtn();
                registerPermanentIframeLoadEvent();
                changeMode('edit');
            }
        }

        registerPermanentIframeLoadEvent = function() {

            // actions that must be triggered on every iframe load   
            themer.iframeOnload = function() {

                observeIframeLoad();

                setIframeData();
                writeStyles(); // write preset css changes from 'data' array to stylesheet
                getAllColors();
                updateLogo($('#logo_image').val());
                addLogoBtn();


                if (restoreDefaults) {
                    // empty static stylesheet (styles loaded from database)
                    if ($('#themetuner-css', iframe.contentWindow.document).length) {
                        _clearIframeStylesheet('themetuner-css');
                    }
                    // if logo is not changed after "restore defaults" action then clear also logo
                    if (clearLogo) {
                        updateLogo();
                    }
                }

                // attach themetuner query parameters to iframe url if user is navigating page inside iframe
                // if themetuner params are missing, they are attached and iframe makes reload
                // thats why hide/show logics is added (to remove flickr)

                var iframeUrl = $(iframe).contents().get(0).location.href;

                if (iframeUrl.indexOf('&amp;') != -1) { // special ampersand case

                    return iframe.src = iframeUrl.replace('&amp;', '&', 'g');

                } else if (iframeUrl.indexOf('in_admin') == -1) { // missing themetuner query params

                    var urlPart = '';
                    var anchorPart = '';

                    if (iframeUrl.indexOf('#') != -1) { // url has anchor part
                        urlPart = iframeUrl.slice(0, iframeUrl.indexOf('#'));
                        anchorPart = iframeUrl.slice(iframeUrl.indexOf('#') + 1);
                    } else {
                        urlPart = iframeUrl;
                    }

                    urlPart += ((iframeUrl.indexOf('?') != -1) ? '&' : '?') + 'in_admin=true&themetuner_preset_id=' + $('#presetId').val() + '&themetuner_theme=' + encodeURIComponent(theme) + '&themetuner_editor_id=' + editorId;
                    var newUrl = urlPart + (anchorPart ? '#' + anchorPart : '');


                    return iframe.src = newUrl;

                } else {
                    hideLoader();
                }

                var len = _afterIframeLoaded.length;
                if (len) {
                    while (len--) {
                        _afterIframeLoaded[len]();
                        _afterIframeLoaded.splice(len, 1);
                    }
                    _afterIframeLoaded = [];
                }

                loadFonts(_fonts, iframe.contentDocument);
            };
        };

        window.onbeforeunload = function() {
            if (save) {
                return 'You have not saved your changes!';
            }
        };

        pageTemplate.change(function() {
            logLayoutChanges({
                "type": "layout",
                "action": "columns",
                "id": $(this).val()
            }, true);
        });

        layoutContext.change(loadCurrentColumns);

        onFirstIframeLoad();
    };




    var logLayoutChanges = function(changeItem, isReloadIframe) {
        setSaveNeeded(true);

        if (typeof(changeItem) == "object") {
            var currentHandle = layoutContext.val();

            if (typeof(layoutChanges[currentHandle]) == "undefined") {
                layoutChanges[currentHandle] = [];
            }

            // Find and remove changes with the same id
            for (var i = 0; i < layoutChanges[currentHandle].length; i++) {
                var iteratorItem = layoutChanges[currentHandle][i];
                if (iteratorItem.action == changeItem.action) {
                    if ("columns" == changeItem.action || iteratorItem.id == changeItem.id) {
                        layoutChanges[currentHandle].splice(i, 1);
                    }
                }
            }

            layoutChanges[currentHandle].push(changeItem);
            var saveCallback = null;
            if (isReloadIframe) {
                var appendEditorId = "?";
                if (iframe.contentWindow.location.search.length > 1) {
                    appendEditorId = "&";
                }

                if (-1 == iframe.contentWindow.location.search.indexOf("themetuner_editor_id=")) {
                    appendEditorId += "themetuner_editor_id=" + editorId;
                }

                saveCallback = function() {
                    _afterIframeLoaded.push(function() {
                        switchViewOptions('layout')
                    });
                    showLoader();
                    iframe.src = iframe.src + appendEditorId;
                };
            }

            layoutSaveTmpData(saveCallback);
        }
    }

    var toggleLayoutEditor = function(isEnable) {

        if (isEnable) {
            $('body', iframe.contentDocument).addClass('themetuner-layout');

            if (iframe.contentWindow.themetunerSortable)
                iframe.contentWindow.themetunerSortable.enable(logLayoutChanges, popupNewBlock);
        } else {
            $('body', iframe.contentDocument).removeClass('themetuner-layout');

            if (iframe.contentWindow.themetunerSortable)
                iframe.contentWindow.themetunerSortable.disable();
        }
    };


    var collectLayoutData = function() {
        var changes = [];
        for (var handle in layoutChanges) {
            for (var i = 0; i < layoutChanges[handle].length; i++) {
                layoutChanges[handle][i].handle = handle;
                changes.push(layoutChanges[handle][i]);
            }
        }
        return changes;
    };

    var observeIframeLoad = function() {

        if (iframe.contentWindow.OyeThemetunerInfo) {
            var handles = iframe.contentWindow.OyeThemetunerInfo.handles;
            var layoutContextValue = layoutContext.val();

            layoutContext.find("option[value!=default]").remove();

            for (var i = 0; i < handles.length; i++) {
                if (handles[i] != "default") {
                    layoutContext.append($('<option />').val(handles[i]).html(handles[i]));
                }

                if (handles[i] == layoutContextValue) {
                    layoutContext.val(layoutContextValue);
                }
            }
            loadCurrentColumns();
        }


    };

    var loadCurrentColumns = function() {

        var savedColumns = iframe.contentWindow.OyeThemetunerInfo.columns;

        for (var handle in layoutChanges) {
            for (var i = 0; i < layoutChanges[handle].length; i++) {
                if ("columns" == layoutChanges[handle][i].action) {
                    savedColumns[handle] = layoutChanges[handle][i].id;
                }
            }
        }

        if (typeof(savedColumns[layoutContext.val()]) != "undefined") {
            pageTemplate.val(savedColumns[layoutContext.val()]);
        } else {
            pageTemplate.val("");
        }
    }

    var layoutSaveTmpData = function(callback) {
        var ajaxParams = {
            url: $("#layout_save_url").val(),
            type: 'POST',
            data: {
                "id": editorId,
                "data": getSerializedData(true),
                "form_key": FORM_KEY
            },
            success: callback || function() {}
        };

        $.ajax(ajaxParams);
    }

    var popupNewBlock = function(columnId) {
        var dialogUrl = $('#add_block_url').val() + '?column=' + columnId + '&in_admin=1&themetuner_editor_id=' + editorId + '&themetuner_preset_id=' + $('#presetId').val();
        //MediabrowserUtility.openDialog(dialogUrl, 962, 550, 'Add block');
        widgetTools.openDialog(dialogUrl);
        widgetTools.logLayoutChanges = logLayoutChanges;
    }

    // media manager functionality
    window.pollWindow = function() {
        var overlay = $('#overlay_modal');
        if (overlay.length > 0) {
            var bw = $('#browser_window');
            $('#overlay_modal').insertAfter('#colorbox');
            bw.insertAfter('#overlay_modal');
            bw.css({
                position: 'absolute'
            });
        } else {
            window.setTimeout(window.pollWindow, 300);
        }
    };

    $('a.browse').click(function() {
        MediabrowserUtility.openDialog(getFileBrowserUrl('background-image'), 962, 550, 'Insert background image');
        window.setTimeout(window.pollWindow, 300);

        $('#background-image').observe(function() {
            $('#background-image').trigger('keyup');
        });

        return false;
    });

    var ready = function(callback) {
        showLoader();
        var count = 2;
        var next = function() {
            count--;
            if (count < 1) {

                themer.iframeOnload = function() {}; // clear the callback because we want to use this on first time only
                return callback();


            }
        }
        themer.iframeOnload = next;
        license.check( next );
        
    }

    ready(function() {
        contentAllowed = license.hasAccess(COMPONENT.CONTENT);

        if (typeof TranslateInline != "undefined") {
            TranslateInline.isAllowed = contentAllowed;
        }

        for (var cmp in COMPONENT) {

            if ($('div.component-' + COMPONENT[cmp]).length && !license.hasAccess(COMPONENT[cmp])) {
                $('div.component-' + COMPONENT[cmp]).show();
            }
        }

        init();
    });

});