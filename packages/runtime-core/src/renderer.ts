import { ShapeFlags, isString } from "@vue/shared";
import { Text, createVnode, isSameVnode } from "./vnode";

export function createRenderer(renderOptions) {

    const {
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        createElement: hostCreateElement,
        createText: hostCreateText,
        patchProp: hostPatchProp
    } = renderOptions;

    const normalize = (child) => {
        // 如果子节点是文本 要包装成Text类型元素
        if(isString(child)) {
            return createVnode(Text, null, child);
        }
        return child;
    }

    const mountChildren = (children, container) => {
        for(let i = 0; i < children.length; i++) {
            let child = normalize(children[i]);
            patch(null, child, container);
        }
    }

    const mountElement = (vnode, container) => {
        const { type, props, children, shapeFlag } = vnode;
        // 将真实dom挂载到虚拟dom的el属性上 便于后续更新复用
        let el = vnode.el = hostCreateElement(type);
        if(props) {
            for(let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        // 文本
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        hostInsert(el, container);
    }

    const processText = (n1, n2, container) => {
        if(n1 == null) {
            n2.el = hostCreateText(n2.children);
            hostInsert(n2.el, container);
        } else {
            // 文本内容改变 复用老节点 仅改变节点内文本
            const el = n2.el = n1.el;
            if(n1.children !== n2.children) {
                hostSetText(el, n2.children);
            }
        }
    }

    const patchProps = (oldProps, newProps, el) => {
        // 新的节点有的属性 直接覆盖旧的节点
        for(let key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key]);
        }
        // 如果新的节点没有属性 在旧的节点里面有 删除
        for(let key in oldProps) {
            if(newProps[key] == null) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }

    const patchChildren = (n1, n2, el) => {
       const c1 = n1 && n1.children; 
       const c2 = n2 && n2.children;
       // 子节点可能为 文本 空 数组 
    }

    // 老的节点和新的节点一样 复用老的 属性可能不一样 更新属性
    const patchElement = (n1, n2) => {
        let el = n2.el = n1.el;

        let oldProps = n1.props || {};
        let newProps = n2.props || {};

        patchProps(oldProps, newProps, el);
        // 父层级比较完毕 再比较子层级
        patchChildren(n1, n2, el);
    }

    const processElement = (n1, n2, container) => {
        if(n1 === null) {
            mountElement(n2, container);
        } else {
            patchElement(n1, n2);
        }
    }

    const patch = (n1, n2, container) => {
        if(n1 === n2) return;

        // 如果前后节点不一样 删除老的 添加新的
        if(n1 && !isSameVnode(n1, n2)) {
            unmount(n1);
            n1 = null;
        }

        const { type, shapeFlag } = n2;
        // 初次渲染 挂载元素
        switch(type) {
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if(shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                }
        }
    }

    const unmount = (vnode) => {
        hostRemove(vnode.el);
    }

    const render = (vnode, container) => {
        if(vnode == null) {
            // 卸载组件
            if(container._vnode) {
                // 之前渲染过 container._vnode.el可以获取真实dom
                unmount(container._vnode);
            }
        } else {
            // patch既有初始化（第一个参数为空）又有更新的逻辑（有老的虚拟节点）
            patch(container._vnode || null, vnode, container);
        }
        // 存储老的虚拟节点
        container._vnode = vnode;
    };

    return {
        render
    } 
}

// 更新的逻辑
// - 如果前后节点不一样 删除老的 添加新的
// - 老的节点和新的节点一样 复用老的 属性可能不一样 更新属性
// - 父层级比较完毕 再比较子层级