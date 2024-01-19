export function patchStyle(el, prevValue, nextValue) {
    // 样式对比差异 新的覆盖老的
    for(let key in nextValue) {
        el.style[key] = nextValue[key];
    }
    // 删除老的有但新的没有的属性
    if(prevValue) {
        for(let key in prevValue) {
            if(nextValue[key] == null) {
                el.style[key] = null;
            }
        }
    }
}