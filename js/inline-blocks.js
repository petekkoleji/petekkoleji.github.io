var replaceIt_EscapedTextNodes = []
var relaceIt_ran = false;

// a function for autocomplete
function currentText(element) {
    element.focus()
    var doc = element.ownerDocument || element.document
    var win = doc.defaultView || doc.parentWindow
    var sel
    var preCaretRange
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection()
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0)
            preCaretRange = range.cloneRange()
        }
        return {
            pos: (preCaretRange.endContainer.nodeType == 3) ? range.endOffset : range.endOffset,
            text: (preCaretRange.endContainer.nodeType == 3) ? preCaretRange.endContainer.textContent : '',
            el: (preCaretRange.endContainer.nodeType == 3) ? preCaretRange.endContainer : preCaretRange.endContainer
        }
    }
}

function placeCaretAtEnd(el) {
    el.focus()
    var spc = document.createTextNode('');
    el.appendChild(spc);
    if (typeof window.getSelection != "undefined" &&
        typeof document.createRange != "undefined") {
        var range = document.createRange()
            // range.selectNodeContents(el)
        range.setStartAfter(spc) //this does the trick
        range.collapse(false)
        var sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
    }
}


function moveCaretAfter(el, moveTo) {
    el.focus()
    if (typeof window.getSelection != "undefined" &&
        typeof document.createRange != "undefined") {
        var range = document.createRange()
            // range.selectNodeContents(el)
        range.setStartAfter(moveTo) //this does the trick
        range.collapse(false)
        var sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
    }
}

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

var replaceInsert = {
    text: function(el, $hlted, replaceWith) {
        var current = currentText(el)
        var node = current.el
        if ($hlted.find('.el-to-add').length !== 0) {
            $hlted = $hlted.find('.el-to-add')
        }
        var title = $hlted.attr('title')
        if (node.nodeType == 3) {
            var offset = current.pos
            var curText = current.text
            var beforeText = curText.slice(0, offset)
            if (replaceWith) beforeText = beforeText.replace(replaceWith, '')
            node.textContent = beforeText + ' ' + title + ' ' + curText.slice(offset, curText.length) + ' '
        } else {
            node.append(document.createTextNode(' ' + title + ' '))
        }
        $(el).change()
    },
    element: function(el, $hlted, replaceWith) {
        if ($hlted.find('.el-to-add').length !== 0) {
            $hlted = $hlted.find('.el-to-add')
        }
        var current = currentText(el)
        $hlted.attr('contenteditable', 'false').attr('data-converted', 'true').removeClass('ac-hlted ac-option')
        var node = current.el
        if (node.nodeType == 3) {
            var offset = current.pos
            var curText = current.text
            var beforeText = curText.slice(0, offset)
            var afterText = curText.slice(offset, curText.length)
            if (replaceWith) beforeText = beforeText.replace(replaceWith, '')
            node.parentNode.insertBefore(document.createTextNode(beforeText), node)
            if (node.nextSibling) {
                node.parentNode.insertBefore(document.createTextNode(' ' + afterText + ' '), node.nextSibling)
            } else {
                node.parentNode.append(document.createTextNode(' ' + afterText + ' '))
            }
            node.parentNode.replaceChild($hlted.get(0), node)
        } else {
            node.append($hlted.get(0))
        }
        moveCaretAfter(el, $hlted.get(0))
    }
}


function replaceIt(argObj) {
    // addStyles once
    if (!relaceIt_ran) {
        $('<style>' +
      '.ac-option {' +
      'transition: box-shadow 0.1s ease-out, transform 0.1s ease-out;'+
      'padding: 2px;'+
       'margin: 3px 0px;}'+
      '.ac-hlted {'+
     ' box-shadow: 0 0 6px 0 rgba(0, 96, 245, 0.68);'+
      'transform: scale(1.003);'+
    ' }</style>').appendTo('body')
        relaceIt_ran = true
    }

    /*  argObj = {
        e: event,
        el: element,
        replace: {
        $asdasd: {
          regex:
          convertTo:
        },
        autoComplete_...: {
        initiator:
        listEl:
        }
        }
    }*/
    var replaces = []
    var autoCompleteArray = []
    var element, event;

    for (var arg in argObj) {
        var acKey = arg.match(/autoComplete\S+/i)
        if (acKey !== null) {
            autoCompleteArray.push(argObj[arg])
        } else {
            switch (arg) {
                case 'e':
                    event = argObj[arg]
                case 'el':
                    element = argObj[arg]
                    break
                default:
                    replaces.push(argObj[arg])
                    break
            }
        }
    }

    //   fix for jumping cursor
    if (event.type == 'input') {
        var curText = currentText(element)
        if (curText.text == '') {
            curText.el.appendChild(document.createTextNode(' '))
        }
    }

    //   fix for jumping cursor
    if ($(element).text() == ' ' && $(element).find('*').length == 0) $(element).text('')

    // fix for whitespace overall

    var wait = []
    if (event.type == 'input') {
        autoCompleteArray.forEach(function(autoComp){
            autoComp.previousResults = undefined
            wait.push(autoCompleter(autoComp))
        })
        wait = wait.filter(function(el, i){
            return el //means true
        })
    }
    if (wait.length > 0) return
    $(element).next('.autocomp-list').hide()
    replaces.forEach(function(e, i) {
        replace(element, e.find, e.convertTo)
    })

    function replace(el, regex, convertFunc) {
        $.each(el.childNodes,function (i, e) {
            var node = e
            var nodeIndex = i

            var matches = node.textContent.match(new RegExp(regex, 'gi'))
            var data = (typeof node.getAttribute == 'function') ? node.getAttribute('data-converted') : false
            if (matches && !data) {
                var e = matches[0]
                var start = node.textContent.indexOf(e)
                var end = node.textContent.indexOf(e) + e.length

                var stringToConvert = node.textContent.slice(start, end)

                var temp_container = document.createElement('div');
                var converted = convertFunc(stringToConvert);

                if (converted instanceof Promise) {
                    converted.then(function(responseHTML) {
                        if (!responseHTML) return;
                        temp_container.innerHTML = responseHTML;
                        var convertedBlock = temp_container.firstElementChild;
                        convertedBlock.setAttribute('data-converted', 'true')
                        convertedBlock.setAttribute('title', stringToConvert)
                        convertedBlock.setAttribute('draggable', 'false')
                        convertedBlock.style.display = 'inline-block'
                        if (convertedBlock.textContent.length > 0) {
                            convertedBlock.setAttribute('contenteditable', 'false')
                        }

                        var beforeText = document.createTextNode(node.textContent.slice(0, start))
                        var afterText = document.createTextNode(node.textContent.slice(end) || '')

                        node.parentNode.insertBefore(beforeText, node)
                        node.parentNode.insertBefore(afterText, node.nextSibling)
                        node.parentNode.replaceChild(convertedBlock, node)
                        moveCaretAfter(el, convertedBlock)
                        replace(el, regex, converted) // check for other
                    })
                } else {
                    temp_container.innerHTML = converted;
                    var convertedBlock = temp_container.firstElementChild;
                    if (!convertedBlock) return;
                    convertedBlock.setAttribute('data-converted', 'true')
                    convertedBlock.setAttribute('title', stringToConvert)
                    convertedBlock.setAttribute('draggable', 'false')
                    convertedBlock.style.display = 'inline-block'
                    if (convertedBlock.textContent.length > 0) {
                        convertedBlock.setAttribute('contenteditable', 'false')
                    }

                    var beforeText = document.createTextNode(node.textContent.slice(0, start))
                    var afterText = document.createTextNode(node.textContent.slice(end) || '')

                    node.parentNode.insertBefore(beforeText, node)
                    node.parentNode.insertBefore(afterText, node.nextSibling)
                    node.parentNode.replaceChild(convertedBlock, node)
                    moveCaretAfter(el, convertedBlock)
                    replace(el, regex, converted) // check for other
                }

            }
        })
    }

    //   autocomplete
    //end of function
    function autoCompleter(autoComplete) {
        var $listDiv = $(element).next()
        if (!($listDiv.hasClass('autocomp-list'))) {
            $listDiv = $(document.createElement('div'))
            $listDiv.addClass('autocomp-list')
            $(element).after($listDiv)
        }
        if (curText.text == '') {
            $listDiv.hide();
            return
        }
        // off detect
        function offDetect($el) {
            // el = $listDiv
            $el.css({
                position: 'absolute',
                top: $(element).position().top + $(element).outerHeight(),
                left: $(element).position().left,
                width: $(element).outerWidth(),
                padding: $(element).css('padding'),
                backgroundColor: $(element).css('background-color'),
                zIndex: 1,
                border: '1px solid #ccc',
                maxHeight: 250,
                overflowY: 'scroll',
                overflowX: 'hidden'
            })

            if ((($el.offset().top - $(window).scrollTop()) + $el.outerHeight()) > window.innerHeight) {
                //bot is off
                $el.css('top', $el.prev().position().top - $el.outerHeight())
            }
        }
        // off detect

        var reg = autoComplete.initiator
        var insertChoice = autoComplete.insert || 'text'
        var text = currentText(element).text
        var textNode = currentText(element).el

        // update escapeNodes
        if (reg) {
            replaceIt_EscapedTextNodes.forEach(function (e, i) {
                if (textNode.nodeType == 3) {
                    if (textNode.isSameNode(e.node)) {
                        if (e.escapedFor == reg) {
                            var matching = e.node.textContent.match(new RegExp(escapeRegExp(e.escapedFor), 'g'))
                            var matchLength = matching ? matching.length : 0
                            if (matchLength == 0) {
                                var spliced = replaceIt_EscapedTextNodes.splice(i, 1)
                            } else if (matchLength < e.escaped) {
                                replaceIt_EscapedTextNodes[i] = {
                                    node: textNode,
                                    escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length || 0,
                                    escapedFor: reg
                                }
                            }
                        }
                    }
                }
            })
        }
        // update escapeNodes

        //escape Decision

        var start, sliced, matched;
        var ac_escaped = {
            is: false,
            for: null,
            times: null
        }
        if (reg) {
            replaceIt_EscapedTextNodes.forEach(function(e, i) {

                if (textNode.nodeType == 3) {

                    if (textNode.isSameNode(e.node)) {
                        ac_escaped.for = e.escapedFor

                        if (e.escapedFor == reg) {
                            var matching = e.node.textContent.match(new RegExp(escapeRegExp(e.escapedFor), 'g'))
                            var matchLength = matching ? matching.length : 0
                            ac_escaped.times = e.escaped
                            if (matchLength == e.escaped) {
                                ac_escaped.is = true
                            }
                        }
                    }
                }
            })

            var match = text.match(new RegExp(escapeRegExp(reg), 'g'))
            matched = match ? true : false
            start = match ? text.indexOf(reg) : -1

            var chopped = text
            var chopInd = chopped.indexOf(reg)
            for (var i = 0; i < ac_escaped.times; i++) {
                chopped = chopped.slice(chopped.indexOf(reg) + 1, chopped.length)
                chopInd += chopped.indexOf(reg)
            }
            start = chopInd + ac_escaped.times

            //escape Decision

            var beforeText = text.slice(0, start)
            sliced = text.slice(start)
            var end = (sliced.indexOf(' ') == -1) ? sliced.length : sliced.indexOf(' ')
            var afterText = sliced.slice(end)
            sliced = sliced.slice(0, end)

        } else {
            start = 0;
            sliced = text;
            matched = true;
            console.log(ac_escaped.is);
        }

        if (matched && !ac_escaped.is) {
            var listHtml = autoComplete.listEl(sliced)
            if (listHtml == []) return
            $listDiv.html('')
            $listDiv.show()

            function addToListDiv(arr) {
                var elArr = [];
                arr.forEach(function(e) {
                    var tempContainer = document.createElement('div')
                    tempContainer.innerHTML = e
                    var $el = $($(tempContainer).find('*')[0])
                    $listDiv.prepend($el)
                    $el.addClass('ac-option')
                    elArr.push($el)
                    $el.click(function (e) {
                        if (autoComplete.hasOwnProperty('action')) {
                            autoComplete.action(e.currentTarget)
                        } else {
                            replaceInsert[insertChoice](element, $(e.currentTarget), sliced)
                        }
                        $(element).off('.ac-keys')
                        $el.off('click')
                        $listDiv.hide()
                    })
                })
                this.remove = function() {
                    $(elArr).each(function(i, $el) {
                        console.log('el to remove', $el)
                        $el.remove()
                    })
                }
                return this
            }
            if (listHtml instanceof Array) {
                addToListDiv(listHtml);
                offDetect($listDiv)
            }
            if (listHtml instanceof Promise) {
                listHtml.then(function (listHtmlArray) {
                    if (autoComplete.previousResults) autoComplete.previousResults.remove();
                    autoComplete.previousResults = addToListDiv(listHtmlArray)
                    offDetect($listDiv)
                })
            }

            $(document).on('click.ac-elsewhere', function(e) {
                if ($(e.originalEvent.path).hasClass('autocomp-list')) return
                $listDiv.hide()
                if (reg && replaceIt_EscapedTextNodes.length > 0) {
                    replaceIt_EscapedTextNodes.forEach(function (e, i) {
                        if (textNode.nodeType == 3) {
                            if (textNode.isSameNode(e.node)) {
                                if (e.escapedFor == reg) {
                                    replaceIt_EscapedTextNodes[i] = {
                                        node: textNode,
                                        escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')) ? textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length : 0,
                                        escapedFor: reg
                                    }
                                } else {
                                    replaceIt_EscapedTextNodes.push({
                                        node: textNode,
                                        escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')) ? textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length : 0,
                                        escapedFor: reg
                                    })
                                }
                            } else {
                                replaceIt_EscapedTextNodes.push({
                                    node: textNode,
                                    escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')) ? textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length : 0,
                                    escapedFor: reg
                                })
                            }
                        }
                    })
                    $(document).off('.ac-elsewhere')
                    $(element).off('.ac-keys')
                }
            })
        }
        if (matched) {
            $(element).off('.ac-keys');
            $(element).on('keydown.ac-keys',function (e) {
                if (e.which == 32 || e.which == 13 || e.which == 27) { //space | enter | esc

                    if (e.which == 13) e.preventDefault()

                    if ($listDiv.find('.ac-hlted').length !== 0) {
                        // selection
                        if (e.which == 32 || e.which == 13) {
                            //enter or space
                            var $hlted = $listDiv.find('.ac-hlted').eq(0)
                            console.log(autoComplete)
                            if (autoComplete.hasOwnProperty('action')) {
                                autoComplete.action($hlted.get(0))
                            } else {
                                replaceInsert[insertChoice](element, $hlted, sliced)
                            }
                            $(element).off('.ac-keys')
                            $listDiv.hide()
                            e.stopImmediatePropagation()
                            return
                        }
                    }

                    if (reg && replaceIt_EscapedTextNodes.length > 0) {
                        replaceIt_EscapedTextNodes.forEach(function (e, i) {
                            if (textNode.nodeType == 3) {
                                if (textNode.isSameNode(e.node)) {
                                    if (e.escapedFor == reg) {
                                        replaceIt_EscapedTextNodes[i] = {
                                            node: textNode,
                                            escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length || 0,
                                            escapedFor: reg
                                        }
                                    } else {
                                        replaceIt_EscapedTextNodes.push({
                                            node: textNode,
                                            escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length || 0,
                                            escapedFor: reg
                                        })
                                    }
                                } else {
                                    replaceIt_EscapedTextNodes.push({
                                        node: textNode,
                                        escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length || 0,
                                        escapedFor: reg
                                    })
                                }
                            }
                        })
                    } else if (reg) {
                        replaceIt_EscapedTextNodes.push({
                            node: textNode,
                            escaped: textNode.textContent.match(new RegExp(escapeRegExp(reg), 'g')).length || 0,
                            escapedFor: reg
                        })
                    }

                    $(element).change()
                    $listDiv.hide()
                }
                if (e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) { // left | up | right | bottom
                    var $hlted;
                    var $options = $listDiv.find('.ac-option');
                    if ($listDiv.find('.ac-hlted').length == 0) {
                        if (e.which == 37 || e.which == 38) {
                            $hlted = $options.eq($options.length - 1)
                        } else {
                            $hlted = $options.eq(0)
                        }
                        $hlted.addClass('ac-hlted')
                        return
                    } else {
                        $hlted = $listDiv.find('.ac-hlted')
                    }
                    switch (e.which) {
                        case 37:
                            $hlted.removeClass('ac-hlted')
                            if ($hlted.is(':first-child')) {
                                $options.eq($options.length - 1).addClass('ac-hlted')
                                return
                            }
                            $hlted.prev('.ac-option').addClass('ac-hlted')
                            break
                        case 38:
                            $hlted.removeClass('ac-hlted')
                            if ($hlted.is(':first-child')) {
                                $options.eq($options.length - 1).addClass('ac-hlted')
                                return
                            }
                            $hlted.prev('.ac-option').addClass('ac-hlted')
                            break
                        case 39:
                            $hlted.removeClass('ac-hlted')
                            if ($hlted.is(':last-child')) {
                                $options.eq(0).addClass('ac-hlted')
                                return
                            }
                            $hlted.next('.ac-option').addClass('ac-hlted')
                            break
                        case 40:
                            $hlted.removeClass('ac-hlted')
                            if ($hlted.is(':last-child')) {
                                $options.eq(0).addClass('ac-hlted')
                                return
                            }
                            $hlted.next('.ac-option').addClass('ac-hlted')
                            break
                        default:
                            break
                    }
                    $listDiv.get(0).scrollTop = $hlted.length !== 0 ? $hlted.get(0).offsetTop : null

                    e.preventDefault()
                    return false
                } else {
                    $(element).off('.ac-keys')
                }
            })
        }
        return matched
    }
}