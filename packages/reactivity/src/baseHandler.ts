import { track, trigger } from "./effect";

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
};

export const mutableHandler = {
    get(target, key, receiver) {
        // 代理对象（Proxy）__v_isReactive属性一定返回true
        if(key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        // 收集属性依赖的视图
        track(target, 'get', key);
        return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
        let oldValue = target[key];
        let result = Reflect.set(target, key, value, receiver);
        // 触发视图更新
        if(oldValue !== value) {
            trigger(target, 'set', key, value, oldValue);
        }
        // 设置值成功会返回true
        return result;
    }
}