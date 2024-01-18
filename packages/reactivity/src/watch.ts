import { isFunction, isObject } from "@vue/shared";
import { isReactive } from "./reactive";
import { ReactiveEffect } from "./effect";

// 避免循环引用 如 let obj = { a: obj };
function traversal(value, set = new Set()) {
    if(!isObject(value)) return value;
    if(set.has(value)) {
        return value;
    }
    set.add(value);
    for(let key in value) {
        traversal(value[key], set);
    }
    return value;
}

// watch也类似computed可看作一个扩展过的effect
export function watch(source, cb) {
    let getter;
    // 只能监听响应式对象（代理对象/reactive/ref）
    if(isReactive(source)) {
        getter = () => traversal(source);
    } else if(isFunction(source)) {
        getter = source;
    } else {
        return;
    }
    let cleanup;
    const onCleanup = (fn) => {
        // 保存传入的清除函数
        cleanup = fn;
    }
    let oldValue;
    const job = () => {
        // 下一次执行watch触发上一次watch的清除函数
        if(cleanup) cleanup();
        const newValue = effect.run();
        cb(newValue, oldValue, onCleanup);
        oldValue = newValue;
    }
    // 在effect中访问属性就会依赖收集
    // 监控构造的函数 变化后重新执行
    const effect = new ReactiveEffect(getter, job);
    oldValue = effect.run();
}