import { ShapeFlags, isArray, isString } from "@vue/shared";

export const Text = Symbol('Text');

export function isVnode(value) {
    return !!(value && value.__v_isVnode);
}

export function createVnode(type, props, children = null) {
    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
    // 创建虚拟节点
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props?.['key'],
        __v_isVnode: true,
        shapeFlag
    };
    // 判断子节点是元素节点（一律处理成元素数组）还是文本节点
    if(children) {
        let type = 0;
        if(isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else {
            children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        // 或运算符为赋值
        vnode.shapeFlag |= type;
    }
    return vnode;
}