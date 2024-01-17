export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
};

export const mutableHandler = {
    get(target, key, receiver) {
        // 代理对象（Proxy）__v_isReactive属性一定返回true
        if(key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }

        return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
        // 设置值成功会返回true
        return Reflect.set(target, key, value, receiver);
    }
}