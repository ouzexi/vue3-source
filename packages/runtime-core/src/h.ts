import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";

// 第二个参数可能为属性props，也可能是子节点
export function h(type, propsChildren, children) {
    const l = arguments.length;
    // h('div', { style: {'color': 'red'} });
    // h('div', h('span'));
    // h('div', [h('span'), h('span')]);
    // h('div', 'hello');
    if(l === 2) {
        if(isObject(propsChildren) && !isArray(propsChildren)) {
            if(isVnode(propsChildren)) {
                // 子节点为虚拟节点 包装成数组
                return createVnode(type, null, [propsChildren]);
            }
            // propsChildren为属性
            return createVnode(type, propsChildren);
        } else {
            // propsChildren为子节点数组 或 文本
            return createVnode(type, null, propsChildren);
        }
    } else {
        if(l > 3) {
            // 取子节点（可能为元素或文本）数组
            children = Array.from(arguments).slice(2);
        } else if(l === 3 && isVnode(children)) {
            // 子元素包装为数组
            children = [children];
        }
        // 参数数量可能为1 所以children的情况有 空/子节点数组/文本
        return createVnode(type, propsChildren, children);
    }
}