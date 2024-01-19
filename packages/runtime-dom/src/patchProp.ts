import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

export function patchProp(el, key, prevValue, nextValue) {
    if(key === 'class') {
        patchClass(el, nextValue);
    } else if(key === 'style') {
        patchStyle(el, prevValue, nextValue);
    } else if(/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextValue);
    } else {
        patchAttr(el, key, nextValue);
    }
}