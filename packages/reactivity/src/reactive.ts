import { isObject } from "@vue/shared";
import { ReactiveFlags, mutableHandler } from "./baseHandler";
// 将源对象生成的代理对象存起来 之后传入同一个源对象时不需要new新的代理对象 可直接复用
const reactiveMap = new WeakMap();

// 将数据转化成响应式的数据
export function reactive(target) {
    if(!isObject(target)) {
        return
    }

    // 判断对象是否为代理对象 是的话直接返回
    if(target[ReactiveFlags.IS_REACTIVE]) return target;

    // 判断对象的代理对象是否已被缓存 是的话返回代理对象
    let existingProxy = reactiveMap.get(target);
    if(existingProxy) return existingProxy;

    const proxy = new Proxy(target, mutableHandler);
    reactiveMap.set(target, proxy);
    return proxy;
}

/*
上面需要用到return Reflect.get(target, key, receiver);作用是把源对象this指向代理对象
let target = {
    name: 'zf',
    get alias() {
        return this.name;
    }
}
比如上面对象取const proxy = reactive(target); proxy.alias
此时alias会被get捕获到，而alias依赖this.name，this为源对象时获取name的值不会被get捕获到
而用Refect将this指向代理对象，此时this.name获取值时会被get捕获到
那么就能实现name改变了，alias也会响应式改变
*/