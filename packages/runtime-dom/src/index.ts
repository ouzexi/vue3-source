import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const renderOptions = Object.assign(nodeOps, { patchProp });


export function render(vnode, container) {
    // 传入渲染选项 创建渲染器 渲染器写在core模块而不在dom模块 是因为使渲染可以与平台解耦
    // 比如浏览器 通过createElement等web API渲染元素，小程序可以通过canvas等渲染
    createRenderer(renderOptions).render(vnode, container);
}

export * from "@vue/runtime-core";