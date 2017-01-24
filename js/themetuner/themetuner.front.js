

themetunerSortable = {

    themetunerSortableInited: false,

    changes: [], 

    enable: function(parentEditCallback, addBlockCallback)
    {
        if (themetunerSortable.themetunerSortableInited) {
            jQuery(".themetuner-column").sortable("enable");
        }
        else {
            themetunerSortable.themetunerSortableInited = true;

            jQuery(function()
            {
                jQuery(".themetuner-column").sortable({
                    connectWith : ".themetuner-column", 
                    update: function(event, ui) {
                        var blockId    = ui.item.attr("id");
                        var blockAlias = ui.item.attr("themetuner-alias");
                        parentEditCallback(themetunerSortable.getBlockChange(blockId, blockAlias));
                    }});
                
                $portlets = jQuery(".themetuner-portlet");
                
                $portlets
                    .addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all")
                    .find(".themetuner-portlet-header")
                    .addClass("ui-widget-header ui-corner-all")
                    .prepend("<span class='ui-icon ui-icon-minusthick'></span>")
                    .end()
                    .find(".themetuner-portlet-content");

                $portlets.find(".themetuner-remove").click(function()
                {
                    var $portlet   = jQuery(this).closest(".themetuner-portlet");
                    var blockId    = $portlet.attr("id");
                    var blockAlias = $portlet.attr("themetuner-alias");
                    $portlet.fadeOut().remove();
                    parentEditCallback(themetunerSortable.getBlockChange(blockId, blockAlias));
                });

                jQuery(".themetuner-portlet-header .ui-icon").click(function()
                {
                    jQuery(this).toggleClass("ui-icon-minusthick").toggleClass("ui-icon-plusthick");
                    jQuery(this).parents(".themetuner-portlet:first").find(".themetuner-portlet-content").toggle();
                });

                jQuery(".themetuner-column").disableSelection();

                jQuery(".themetuner-column-add button").click(function() {
                    addBlockCallback(jQuery(this).attr("id").replace("for::", ""));
                });
            });
        }
    }, 

    disable: function()
    {
        if (themetunerSortable.themetunerSortableInited) {
            jQuery(".themetuner-column").sortable("disable");
            }
    }, 

    getBlockChange: function(blockId, blockAlias)
    {
        var $block = jQuery(document.getElementById(blockId));

        if (0 == $block.length)
        {
            return {
                "type"  : "layout", 
                "id"    : blockId, 
                "alias" : blockAlias, 
                "action": "remove"
                };
        }
        else
        {
            var $after = $block.prev(".themetuner-portlet");
            return {
                "type"  : "layout", 
                "id"    : $block.attr("id"), 
                "alias" : blockAlias, 
                "parent": $block.closest(".themetuner-column").attr("id").split("::").pop(), 
                "after" : $after.length ? $after.attr("id").split("::").pop() : "", 
                "action": $block.hasClass('themetuner-new') ? "add" : "update"
                };
        }

        return {"type": "layout"};
    }
}

var themer = {
    
    isAdmin: function(){
        return window.location !== window.parent.location;
    },
    /**
     * Remove all event handlers from document
     */
    detachEvents: function(){
        if (!!jQuery.prototype.off){
            jQuery('*', document).off();
        } else if(!!jQuery.prototype.unbind){
            jQuery('*', document).unbind();
        } 
    },
    _loadTimer: null,
    captureIframeLoad: function( timeout ){
        timeout = parseInt(timeout) || 5000;
        var self = this;
        var load = window.parent.themer.iframeOnload || function(){};
        var unload = window.parent.themer.iframeBeforeLoad || function(){};
        
        this._loadTimer = window.setTimeout(function(){
            window.onload = null;
            load();
            return self._loadTimer = null;
        }, timeout);
        
        this._listen('load', window, function(){
            window.clearTimeout(self._loadTimer);
            self._loadTimer = null;
            //alert('loaded');
            return load();
        });
        
        this._listen('unload', window, function(){
           
            // include current active mode
            var mode = null;
            var tabs = window.parent.document.getElementById('themetuner-tabs');
            if(tabs.children.length){
                for (var i = 0; i < tabs.children.length; i++) {
                    var node = tabs.children[i];
                    if(node.getAttribute('type') === 'radio' && node.getAttribute('checked') === 'checked'){
                        mode = node.getAttribute('value');
                        break;
                    }
                }
            }

            return unload( mode );
        });
    },

    // Cross-browser implementation of element.addEventListener()
    _listen: function listen(evnt, elem, func) {
        if (elem.addEventListener)  // W3C DOM
            elem.addEventListener(evnt,func,false);
        else if (elem.attachEvent) { // IE DOM
             var r = elem.attachEvent("on"+evnt, func);
             return r;
        }
        else window.alert('error: Cannot bind "'+evnt+'" event');
    },

    /** @type {Object} handles themer screen sizes and their classNames */
    responsive: {

        screen : {},
        device : "desktop",
        setup: function(){
            this.detect();
            document.addEventListener("orientationchange", this.detect);
        },
        
        detect: function(){
            this._getScreenSize();
            
            var devices = themetunerDevices;
            
            var type = devices[0].type;
            for(var i=0, l=devices.length; i<l; i++){
                if( devices[i].width && this.screen.width <= devices[i].width ){
                    type = devices[i].type;
                }
            }
            this.device = type;
            this._setClassName( type );
            return;
        },
        
        _getScreenSize: function(){
            var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0];

            
            var x = w.innerWidth || e.clientWidth || g.clientWidth,
                y = w.innerHeight|| e.clientHeight|| g.clientHeight;

            this.screen.width = x;
            this.screen.height = y;
        },
        _hasDevice: function( value, array ){
            var l = array.length;
            while(l--){
                if(array[l] === value) return l;
            }
            return false;
        },
        _setClassName: function( name ){
            var b = document.body;           
            if( b ){
                var c = b.className.split(' ');
                var devices = themetunerDevices;

                for(var i=0, l=devices.length; i<l; i++){
                    var key = this._hasDevice(devices[i].type, c);
                    if(key){
                        c.splice(key, i);
                    }
                }
                c.push( name );
                b.className = c.join(' ');  
            } else {
                setTimeout( function(){
                    themer.responsive._setClassName( name );
                }, 10);
            }
        }
    }

}


if( !themer.isAdmin() ){
    themer.responsive.setup();
} else {
    themer.captureIframeLoad(); 
}

