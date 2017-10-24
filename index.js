require('electron').webFrame.setZoomLevelLimits(1, 1)
const opn = require('opn') // used in html for opening external link
const remote = require('electron').remote
const {dialog} = require('electron').remote
const fs = require('fs')
const path = require('path')
const $ = require('jquery')
const mime = require('mime-types') // mime.lookup('path/to/filename.extension') !=== False .split('/')[1]

let win = remote.getCurrentWindow()
let isMaximized = true
let count = 0
let save_snd = new Audio('save.wav')

function alphanum(num) {
    if ((46 <= num && num <= 57) || (65 <= num && 90 <= num) || (97 <= num && 122 <= num)) {
        return true
    }
    return false
}

// '.' 0-9 A-Z a-z
CodeMirror.commands.autocomplete = (cm, options) => {
    CodeMirror.showHint(cm, null, options)
}

class FileObject {
    constructor(fullPath, fileName, elementid, editor) {
        this.fullPath = fullPath
        this.fileName = fileName
        this.saved = true
        this.editor = editor
        this.id = elementid
    }

    save() {
        try {
            fs.writeFileSync(this.fullPath, this.editor.getValue(), 'utf-8')
        } catch(e) {
            alert('Failed to save the file!')
        }
    }
}

let currentFile = null
let files = new class {
    constructor() {
        this.arr = []
    }

    push(fileObj) {
        this.arr.push(fileObj)
        if (currentFile !== null) {
            $('#open-files > li:nth-child('+currentFile+')').removeClass('activeFile')
        }
        currentFile = this.arr.length-1
        $('#current-file').text(fileObj.fileName)
        $('#open-files').append('<li class="activeFile">'+fileObj.fileName+'<span class="x"></span></li>')
    } // TODO: Handle hiding and showing of div.editors on methods remove and push

    remove(index) {
        if (index > this.arr.length) {
            return -1
        } else if (currentFile === index) {
            currentFile = null
        } else if (index < currentFile) {
            currentFile -= 1
        }
        $('#'+this.arr[index].id).remove()
        // this.arr[index].editor.
        this.arr.pop(index)
        $('#open-files > li:nth-child('+(index+1)+')').fadeOut(300, () => {
            $('#open-files > li:nth-child('+index+1+')').remove()
            if (this.arr.length === 0) {
                $('#no-edit').show()
            }
        })
        return 0
    }

    save(index) {
        if (this.arr.length === 0) {
            return -1
        }
        if (!index) {
            index = currentFile
        }
        if (this.arr[index].saved === false) {
            this.arr[index].save()
            this.arr[index].saved = true
            save_snd.play()
        }
        return 0
    }
}()

function initOption(string, defaultString) {
    if (localStorage.getItem(string) === null) {
        localStorage.setItem(string, defaultString)
    }
}

function getOption(string) {
    let opt = localStorage.getItem(string)
    if (opt !== '') {
        if (opt === 'true') {
            return true
        } else if (opt === 'false') {
            return false
        } else if (!isNaN(opt)) {
            return +opt
        }
    }
    return opt
}

initOption('theme','one-dark')
initOption('font-size','16')
initOption('lineNumbers','true')
initOption('lineWrap','false')
initOption('showDifferences','true')
initOption('tabSize','2')
initOption('indentWithTabs','true')

function getURL(url, c) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) return;
    if (xhr.status < 400) return c(null, xhr.responseText);
        var e = new Error(xhr.responseText || "No response");
        e.status = xhr.status;
        c(e);
    };
}

function openFile(fileName) {
    fileName = fileName.toString()
    mode = mime.lookup(fileName)
    let result = fs.readFileSync(path.normalize(fileName)).toString()
    let id = 'e'+count++
    $('.editors').append('<textarea class="edit" id="'+id+'"></textarea>')
    $('#'+id).hide()
    var el = document.getElementById(id)
    let editor = CodeMirror(
        (elt) => {
            elt.classList.add('codebox')
            elt.id = id
            el.parentNode.replaceChild(elt, el);
        }, {
        value: result,
        mode: mode,
        lineNumbers: getOption('lineNumbers'),
        lineWrapping: getOption('lineWrap'),
        autofocus: true,
        scrollbarStyle: 'overlay',
        showDifferences: getOption('showDifferences'),
        tabSize: getOption('tabSize'),
        indentWithTabs: getOption('indentWithTabs'),
        theme: getOption('theme')
    })
    if (mode === 'text/html' || mode === 'text/css') {
        editor.setOption(mode.split('/')[1])
        emmetCodeMirror(editor)
    }
    editor.on('change', function(editor, change) {
        files.arr[currentFile].saved = false
    })

    if (mode === 'application/javscript') {
        var server;
        getURL("codemirror/browser.json", function(err, code) {
            if (err) throw new Error("Request for ecmascript.json: " + err);
            server = new CodeMirror.TernServer({defs: [JSON.parse(code)]});
            editor.setOption("extraKeys", {
                "Ctrl-Space": function(cm) { server.complete(cm); },
                "Ctrl-I": function(cm) { server.showType(cm); },
                "Ctrl-O": function(cm) { server.showDocs(cm); },
                "Alt-.": function(cm) { server.jumpToDef(cm); },
                "Alt-,": function(cm) { server.jumpBack(cm); },
                "Ctrl-Q": function(cm) { server.rename(cm); },
                "Ctrl-.": function(cm) { server.selectName(cm); }
            })
                editor.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
        });
        editor.on("keyup", (cm, event) => {
            if (!cm.state.completionActive && /*Enables keyboard navigation in autocomplete list*/
                !event.ctrlKey && !event.altKey &&
                alphanum(event.keyCode) && (event.keyCode !== 8 ||
                (event.keyCode === 8 && alphanum(cm.getLine(cm.getCursor().line).charCodeAt(cm.getCursor().ch - 1))))) {
                    /* except escape tab enter space and backspace(if backspace doesn't lead to a word)*/
                server.complete(cm, {completeSingle: false});
            }
        });
    } else {
        editor.on("keyup", (cm, event) => {
            if (!cm.state.completionActive && /*Enables keyboard navigation in autocomplete list*/
                !event.ctrlKey && !event.altKey &&
                alphanum(event.keyCode) && (event.keyCode !== 8 ||
                (event.keyCode === 8 && alphanum(cm.getLine(cm.getCursor().line).charCodeAt(cm.getCursor().ch - 1))))) {
                    /* except escape tab enter space and backspace(if backspace doesn't lead to a word)*/
                CodeMirror.commands.autocomplete(cm, {completeSingle: false});
            }
        });
    }
    let callback = () => {
        $('.editors').show()
        $('#'+id).show()
        editor.refresh()
        files.push(new FileObject(fileName, path.basename(fileName), id, editor))
    }
    if (files.arr.length === 0) {
        $('#no-edit').hide(0, callback)
    } else if (currentFile !== null) {
        $('#'+files.arr[currentFile].id).hide(0, callback)
    }
}

window.onload = function () {}

window.onunload = function(){}

$(document).ready(function() {
    if (localStorage.getItem('intro') === null) {
        $('#right, .home, #file-menus, #editor, #settings, #help, .editors').hide()
        localStorage.setItem('intro', 'done')
        setTimeout(() => {
            $('.hello').html('<h1 class="typingText typeAnimLen29">Welcome to my Senior Project.</h1>')
            setTimeout(() => {
                $('.hello').hide()
                $('.home, .home *').fadeIn(800)
            }, 6250)
        }, 3000)
    } else {
        $('.hello, #right, #file-menus, #editor, #settings, #help, .editors').hide()
    }

    $('#edit-inner-wrapper select.theme-selector').val($('#edit-inner-wrapper select.theme-selector option[value='+getOption('theme')+']').val())
    $(window).keydown(function(event) {
        if (!event.ctrlKey && event.altKey && event.keyCode === 87) { // ALT+W
            exit()
        }
        if ($('#editor').is(':visible')) {
            if (event.ctrlKey && !event.altKey && event.keyCode === 87) { // CTRL+W
                if (currentFile !== null) {
                    // console.log('removing file: '+files.arr[currentFile].fileName)
                    files.remove(currentFile)
                }
                event.preventDefault()
            } else if (event.ctrlKey && event.shiftKey && event.keyCode === 79) { // CTRL+SHIFT+O: Open Folder
                dialog.showOpenDialog({
                    filters: [{name: 'All Files', extensions: ['*']}],
                    properties: ["openFolder"]
                }, function(folderName) {

                })
                event.preventDefault()
            }
            if (event.ctrlKey && event.keyCode === 79) { // CTRL+O: Open File
                dialog.showOpenDialog({
                    filters: [{name: 'All Files', extensions: ['*']}],
                    properties: ["openFile"]
                }, function(fileNames) {
                    if (fileNames) {
                        openFile(fileNames[0])
                    }
                })
                event.preventDefault()
            } else if (event.ctrlKey && event.keyCode === 83) { // CTRL+S Save File
                files.save()
                event.preventDefault()
            } else if (event.ctrlKey && event.keyCode === 187) { // CTRL+'+'
                let font_size = parseInt(localStorage.getItem('font-size'))
                if (font_size < 20) {
                    localStorage.setItem('font-size', ++font_size)
                }
                $('codebox').css('font-size',font_size)
                event.preventDefault()
            } else if (event.ctrlKey && event.keyCode === 189) { // CTRL+'-'
                let font_size = parseInt(localStorage.getItem('font-size'))
                if ( font_size > 10) {
                    localStorage.setItem('font-size', --font_size)
                }
                $('codebox').css('font-size',font_size)
                event.preventDefault()
            } else if (event.ctrlKey && event.altKey && event.keyCode === 72 && $('#editor').is(':visible')) { // CTRL+ALT+H Hide left
                if ($('#left').toggle().is(':visible')) {
                    $('#right').css('width','calc(100vw - 200px)')
                } else {
                    $('#right').css('width','100vw')
                }
                $('#top-buttons').toggle()
                event.preventDefault()
            }
        }
        // console.log('Key press '+event.keyCode)
    })
    $('.folder-name-wrap').click(function(e) {
        $(this).parent().toggleClass('folder-open')
    })
    $('#folders li').click(function(e) {
        openFile($(this).val())
    })
    $('#open-files').on('click', 'li', function(e) {
        if ($(this).index() !== currentFile) {
            if (currentFile !== null) {
                $('#'+files.arr[currentFile].id).hide()
            }
            $('#'+files.arr[$(this).index()].id).show()
            files.arr[$(this).index()].editor.refresh()
        }
    })
    $('#open-files').on('click', 'li .x', function(e) {
        files.remove($(this).parent().index())
    })
    $('.theme-selector').change(function(e) { // TODO: update theme setting method
        localStorage.setItem('theme', $('#theme-selector').find(':selected').val())
        if (files.arr.length > 0) {
            for (let i = 0; i < files.arr.length; i++) {
                // files.arr[i].editor.setTheme('ace/theme/'+getOption('theme'))
            }
        }
        e.preventDefault()
    })
    $('button').mousedown(function(e) {
        e.preventDefault()
    })
    $('#welcome div').hover(function() {
        setTimeout(function(){$('#welcome div button span').text('AT GITHUB.COM')}, 250)
    }, function() {
        setTimeout(function(){$('#welcome div button span').text('SEE THE CODE')}, 250)
    })
    $('.drag').on('mousedown', function(e) {
        let area1 = $('.area1'),
            area2 = $('.area2'),
            startWidth_a1 = area1.width(),
            startWidth_a2 = area2.width(),
            pX = e.pageX
        area1.css({'user-select':'none','cursor':'col-resize'})
        area2.css({'user-select':'none','cursor':'col-resize'})
        $(document).on('mouseup', function(e) {
            area1.css({'user-select':'','cursor':''})
            area2.css({'user-select':'','cursor':''})
            $(document).off('mouseup').off('mousemove')
        })
        $(document).on('mousemove', function(e) {
            let mx = (e.pageX - pX)
            area1.css({'width': startWidth_a1 + mx})
            area2.css({'width': startWidth_a2 - mx})
        })
    })
    $(window).resize(function(e) {
        if ($('.area2').is(':visible')) {
            $('.area1').width('200px')
            $('.area2').width('calc(100vw - 200px)')
        }
    })
})

function load_page(id) {
    if (id === 'home') {
        $('#right').hide()
        $('#left').removeClass('left').addClass('homescreen').css('width','')
        $('#file-menus, #editor, #settings, #help').fadeOut(400)
        $('.home, .home *').delay(400).show()
        for (let i = 1; i < 5; i++) {
            $('.menu > li:nth-child('+i+')').delay(i*125).animate({
                top:'0'
            }, 250, 'swing', () => {})
        }
    } else {
        for (let i = 4; i > 0; i--) {
            $('.menu > li:nth-child('+i+')').delay((4-i)*125).animate({
                top:(35*(5-i))+'vh'
            }, 250, 'swing', function() {
                $(this).hide()
                if (!$('.menu li').is(':visible')) {
                    if (id === 'editor') {
                        $('#left').removeClass('homescreen').addClass('left').css('width','200px')
                        $('#right').show()
                        $('.home, .home *, #settings, #help').hide()
                        $('#editor, #file-menus').fadeIn(800)
                    }
                }
            })
        }
    }
}

function exit() {
    for (let i = files.arr.length-1; i >= 0; i--) {
        files.remove(i)
    }
    $('#open-files li').remove()
    win.close()
}

function minimize() {
    win.minimize()
}

function maximize() {
    if (isMaximized) {
        win.unmaximize()
        isMaximized = false
    } else {
        win.maximize()
        isMaximized = true
    }
}
