// 性能优化 存储绑定的事件函数
function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
}

export function patchEvent(el, eventName, nextValue) {
    // 缓存事件 避免频繁卸载/挂载事件
    let invokers = el._vei || (el._vei = {});
    let exist = invokers[eventName];
    // 如果有缓存即绑定过事件 更新缓存值即可
    if(exist && nextValue) {
        exist.value = nextValue;
    } else {
        // onClick -> click
        let event = eventName.slice(2).toLowerCase();
        // 无缓存 设置缓存值
        if(nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue);
            el.addEventListener(event, invoker);
        } else if(exist) {
            // 如果有老值 将老的绑定事件移除
            el.removeEventListener(event, exist);
            invokers[eventName] = undefined;
        }
    }
}