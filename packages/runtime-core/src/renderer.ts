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

    const normalize = (children, i) => {
        // 如果子节点是文本 要包装成Text类型元素
        if(isString(children[i])) {
            let vnode = createVnode(Text, null, children[i]);
            children[i] = vnode;
        }
        return children[i];
    }

    const mountChildren = (children, container) => {
        for(let i = 0; i < children.length; i++) {
            let child = normalize(children, i);
            patch(null, child, container);
        }
    }

    const mountElement = (vnode, container, anchor) => {
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
        hostInsert(el, container, anchor);
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
                hostPatchProp(el, key, oldProps[key], undefined);
            }
        }
    }

    const unmountChildren = (children) => {
        for(let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    }

    const patchKeyedChildren = (c1, c2, el) => {
        // 先两边往中间聚 遇到差异就跳出循环 新老节点头指针都为i 尾指针为各自尾部
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        
        // sync from start
        while(i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if(isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            i++;
        }

        // sync from end
        while(i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if(isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            e1--;
            e2--;
        }

        // common sequence + mount
        // i比e1大说明有新增的 i到e2之间是新增的部分 如果e2后面一位有元素 说明是头插 否则尾插
        if(i > e1) {
            if(i <= e2) {
                while(i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < c2.length ? c2[nextPos].el : null;
                    patch(null, c2[i], el, anchor);
                    i++;
                }
            }
        }
        // common sequence + unmount
        // i比e2大说明有卸载的 i到e1之间是卸载的部分
        else if(i > e2) {
            if(i <= e1) {
                while(i <= e1) {
                    unmount(c1[i]);
                    i++;
                }
            }
        }
    }

    const patchChildren = (n1, n2, el) => {
       const c1 = n1 && n1.children; 
       const c2 = n2 && n2.children;
       const prevShapeFlag = n1.shapeFlag;
       const shapeFlag = n2.shapeFlag;
       // 子节点可能为 文本 空 数组 
       // 比较新老子节点的差异
       // 新的    老的
       // 文本    数组    （删除老节点儿子 设置文本内容）
       // 文本    文本    （更新文本即可）
       // 数组    数组    （diff算法）
       // 数组    文本    （清空文本 进行挂载）
       // 空      数组    （删除所有儿子）
       // 空      文本    （清空文本）
       // 空      空      （无操作）

       if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
            }
            if(c1 !== c2) {
                hostSetElementText(el, c2);
            }
       } else {
        // 新儿子可能为数组或者空
        if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // diff算法
                patchKeyedChildren(c1, c2, el);
            } else {
                unmountChildren(c1);
            }
        } else {
            if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(el, '');
            }
            if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                mountChildren(c2, el);
            }
        }
       }
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

    const processElement = (n1, n2, container, anchor) => {
        if(n1 === null) {
            mountElement(n2, container, anchor);
        } else {
            patchElement(n1, n2);
        }
    }

    const patch = (n1, n2, container, anchor = null) => {
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
                    processElement(n1, n2, container, anchor);
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