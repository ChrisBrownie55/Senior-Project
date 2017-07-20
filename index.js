//const remote = require("electron").remote
//const $ = require("jquery")
//let win = remote.getCurrentWindow()
var isMaximized = false

window.onload = function(){
    setTimeout(() => {
        var typer = document.getElementsByClassName("typingText")[0]
        typer.innerHTML = "Welcome to my Senior Project."
        typer.className = "typingText typeAnimLen29"
        var newone = typer.cloneNode(true);
        typer.parentNode.replaceChild(newone, typer);
        setTimeout(() => {
            var left = document.getElementsByClassName("HelloScreen")[0]
            left.className = "left"
            var menu_buttons = document.getElementById("menu-buttons")
            menu_buttons.style.display = "inline-block"
            menu_buttons.style.opacity = "1"
            for (var i = 0; i < menu_buttons.children.length; i++) {
                menu_buttons.children[i].style.opacity = "1"
            }
            var right = document.getElementById("right")
            right.style.display = "inline"
            right.style.width = "100vw"
        }, 7700)
    }, 3000)
}

window.onunload = function(){}

function exit() {
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

function load_welcome() {
    if ($("#welcome").css("display") !== "none") {
        return
    }
    if ($("#editor").css("display") !== "none") {
        $("#editor").fadeOut(800)
        $("#editor").css({"display": "none"})
    }
    if ($("#settings").css("display") !== "none") {
        $("#settings").fadeOut(800)
        $("#settings").css({"display": "none"})
    }
    $("#welcome").fadeIn(800)
    setTimeout(() => {$("#welcome").fadeIn(800, () => {$("#welcome").css({"display": "default"})})}, 800)
}

function load_editor() {
    if ($("#editor").css("display") !== "none") {
        return
    }
    if ($("#settings").css("display") !== "none") {
        $("#settings").fadeOut(800)
        $("#settings").css({"display": "none"})
    }
    if ($("#welcome").css("display") !== "none") {
        $("#welcome").fadeOut(800)
        $("#welcome").css({"display": "none"})
    }
    $("#editor").fadeIn(800)
    setTimeout(() => {$("#editor").fadeIn(800, () => {$("#editor").css({"display": "default"})})}, 800)
}

function load_settings() {
    if ($("#settings").css("display") !== "none") {
        return
    }
    if ($("#welcome").css("display") !== "none") {
        $("#welcome").fadeOut(800)
        $("#welcome").css({"display": "none"})
    }
    if ($("#editor").css("display") !== "none") {
        $("#editor").fadeOut(800)
        $("#editor").css({"display": "none"})
    }
    setTimeout(() => {$("#settings").fadeIn(800, () => {$("#settings").css({"display": "default"})})}, 800)
}