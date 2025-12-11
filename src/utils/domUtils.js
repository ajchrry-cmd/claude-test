export function createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
}

export function clearElement(element) {
    if (element) {
        element.innerHTML = '';
    }
}

export function show(element) {
    if (element) {
        element.style.display = 'block';
    }
}

export function hide(element) {
    if (element) {
        element.style.display = 'none';
    }
}

export function toggle(element) {
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

export function addClass(element, className) {
    if (element) {
        element.classList.add(className);
    }
}

export function removeClass(element, className) {
    if (element) {
        element.classList.remove(className);
    }
}

export function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

export function vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}
