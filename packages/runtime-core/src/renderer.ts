import { ShapeFlags } from "@vue/shared";

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

    const mountChildren = (children, container) => {
        for(let i = 0; i < children.length; i++) {
            patch(null, children[i], container);
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

    const patch = (n1, n2, container) => {
        if(n1 === n2) return;

        // 初次渲染 挂载元素
        if(n1 == null) {
            mountElement(n2, container);
        } else {

        }
    }

    const render = (vnode, container) => {
        if(vnode == null) {
            // 卸载组件
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