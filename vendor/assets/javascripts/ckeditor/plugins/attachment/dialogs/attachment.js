﻿(function () {
    CKEDITOR.dialog.add('attachment', function (editor) {
        var selectableTargets = /^(_(?:self|top|parent|blank))$/;
        var parseLink = function (editor, element) {
            var href = element ? (element.getAttribute('_cke_saved_href') || element.getAttribute('href')) : '', emailMatch, anchorMatch, urlMatch, retval = {};
            retval.type = 'url';
            retval.url = href;
            if (element) {
                var target = element.getAttribute('target');
                retval.target = {};
                if (target) {
                    var targetMatch = target.match(selectableTargets);
                    if (targetMatch)retval.target.type = retval.target.name = target; else {
                        retval.target.type = 'frame';
                        retval.target.name = target
                    }
                }
                var me = this;
                retval.title = element.getAttribute('title')
            }
            var elements = editor.document.getElementsByTag('img'), realAnchors = new CKEDITOR.dom.nodeList(editor.document.$.anchors), anchors = retval.anchors = [];
            for (var i = 0; i < elements.count(); i++) {
                var item = elements.getItem(i);
                if (item.getAttribute('_cke_realelement') && item.getAttribute('_cke_real_element_type') == 'anchor') {
                    anchors.push(editor.restoreRealElement(item))
                }
            }
            for (i = 0; i < realAnchors.count(); i++)anchors.push(realAnchors.getItem(i));
            for (i = 0; i < anchors.length; i++) {
                item = anchors[i];
                anchors[i] = {name:item.getAttribute('name'), id:item.getAttribute('id')}
            }
            this._.selectedElement = element;
            return retval
        };
        var targetChanged = function () {
            var dialog = this.getDialog(), targetName = dialog.getContentElement('general', 'linkTargetName'), value = this.getValue();
            if (!targetName)return;
            targetName.setLabel(editor.lang.link.targetFrameName);
            this.getDialog().setValueOf('general', 'linkTargetName', value.charAt(0) == '_' ? value : '')
        };

        function parseUrl(url) {
            var filename = url.split('/').pop();
            var extname = filename.split('.').pop();
            return{filename:filename, className:"attach_" + extname}
        }

        return{title:editor.lang.attachment.title, minWidth:420, minHeight:200, onShow:function () {
            this.fakeObj = false;
            var editor = this.getParentEditor(), selection = editor.getSelection(), ranges = selection.getRanges(), element = null, me = this;
            if (ranges.length == 1) {
                var rangeRoot = ranges[0].getCommonAncestor(true);
                element = rangeRoot.getAscendant('a', true);
                if (element && element.getAttribute('href')) {
                    selection.selectElement(element)
                } else if ((element = rangeRoot.getAscendant('img', true)) && element.getAttribute('_cke_real_element_type') && element.getAttribute('_cke_real_element_type') == 'anchor') {
                    this.fakeObj = element;
                    element = editor.restoreRealElement(this.fakeObj);
                    selection.selectElement(this.fakeObj)
                } else element = null
            }
            this.setupContent(parseLink.apply(this, [editor, element]))
        }, onOk:function () {
            var attributes = {href:'javascript:void(0)/*' + CKEDITOR.tools.getNextNumber() + '*/'}, removeAttributes = [], data = {href:attributes.href}, me = this, editor = this.getParentEditor();
            this.commitContent(data);
            var url = data.url || '';
            attributes._cke_saved_href = (url.indexOf('/') === 0) ? url : "http://" + url;
            attributes.href = attributes._cke_saved_href;
            var file = parseUrl(url);
            var title = data.title || '';
            attributes.title = (data.title.length == 0) ? file.filename : data.title;
            attributes.class = file.className;
            if (data.target) {
                if (data.target.type != 'notSet' && data.target.name)attributes.target = data.target.name; else removeAttributes.push('target');
                removeAttributes.push('_cke_pa_onclick', 'onclick')
            }
            if (!this._.selectedElement) {
                var selection = editor.getSelection(), ranges = selection.getRanges();
                if (ranges.length == 1 && ranges[0].collapsed) {
                    var text = new CKEDITOR.dom.text(attributes.title, editor.document);
                    ranges[0].insertNode(text);
                    ranges[0].selectNodeContents(text);
                    selection.selectRanges(ranges)
                }
                var style = new CKEDITOR.style({element:'a', attributes:attributes});
                style.type = CKEDITOR.STYLE_INLINE;
                style.apply(editor.document)
            } else {
                var element = this._.selectedElement;
                if (CKEDITOR.env.ie && attributes.name != element.getAttribute('name')) {
                    var newElement = new CKEDITOR.dom.element('<a name="' + CKEDITOR.tools.htmlEncode(attributes.name) + '">', editor.document);
                    selection = editor.getSelection();
                    element.moveChildren(newElement);
                    element.copyAttributes(newElement, {name:1});
                    newElement.replace(element);
                    element = newElement;
                    selection.selectElement(element)
                }
                element.setAttributes(attributes);
                element.removeAttributes(removeAttributes);
                if (element.getAttribute('title'))element.setHtml(element.getAttribute('title'));
                if (element.getAttribute('name'))element.addClass('cke_anchor'); else element.removeClass('cke_anchor');
                if (this.fakeObj)editor.createFakeElement(element, 'cke_anchor', 'anchor').replace(this.fakeObj);
                delete this._.selectedElement
            }
        }, contents:[
            {label:editor.lang.common.generalTab, id:'general', accessKey:'I', elements:[
                {type:'vbox', padding:0, children:[
                    {type:'html', html:'<span>' + CKEDITOR.tools.htmlEncode(editor.lang.attachment.url) + '</span>'},
                    {type:'hbox', widths:['280px', '110px'], align:'right', children:[
                        {id:'src', type:'text', label:'', validate:CKEDITOR.dialog.validate.notEmpty(editor.lang.flash.validateSrc), setup:function (data) {
                            if (data.url)this.setValue(data.url);
                            this.select()
                        }, commit:function (data) {
                            data.url = this.getValue()
                        }},
                        {type:'button', id:'browse', filebrowser:'general:src', hidden:true, align:'center', label:editor.lang.common.browseServer}
                    ]}
                ]},
                {type:'vbox', padding:0, children:[
                    {id:'name', type:'text', label:editor.lang.attachment.name, setup:function (data) {
                        if (data.title)this.setValue(data.title)
                    }, commit:function (data) {
                        data.title = this.getValue()
                    }}
                ]},
                {type:'hbox', widths:['50%', '50%'], children:[
                    {type:'select', id:'linkTargetType', label:editor.lang.link.target, 'default':'notSet', style:'width : 100%;', 'items':[
                        [editor.lang.link.targetNotSet, 'notSet'],
                        [editor.lang.link.targetFrame, 'frame'],
                        [editor.lang.link.targetNew, '_blank'],
                        [editor.lang.link.targetTop, '_top'],
                        [editor.lang.link.targetSelf, '_self'],
                        [editor.lang.link.targetParent, '_parent']
                    ], onChange:targetChanged, setup:function (data) {
                        if (data.target)this.setValue(data.target.type)
                    }, commit:function (data) {
                        if (!data.target)data.target = {};
                        data.target.type = this.getValue()
                    }},
                    {type:'text', id:'linkTargetName', label:editor.lang.link.targetFrameName, 'default':'', setup:function (data) {
                        if (data.target)this.setValue(data.target.name)
                    }, commit:function (data) {
                        if (!data.target)data.target = {};
                        data.target.name = this.getValue()
                    }}
                ]}
            ]},
            {id:'Upload', hidden:true, filebrowser:'uploadButton', label:editor.lang.common.upload, elements:[
                {type:'file', id:'upload', label:editor.lang.common.upload, size:38},
                {type:'fileButton', id:'uploadButton', label:editor.lang.common.uploadSubmit, filebrowser:{target:'general:src', action:'QuickUpload', params:editor.config.filebrowserParams()}, 'for':['Upload', 'upload']}
            ]},
        ]}
    })
})();
