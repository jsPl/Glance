import document from "document";

export function $(id) {
    return document.getElementById(id)
}

export function show(el, display = 'inline') {
    el.style.display = display;
    return el
}

export function hide(el, display = 'none') {
    el.style.display = display;
    return el
}