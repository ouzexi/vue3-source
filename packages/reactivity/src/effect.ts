export let activeEffect = undefined;
class ReactiveEffect {
    // 表示当前effect默认为激活状态
    public active = true;
    constructor(public fn) {
        this.fn = fn;
    }

    // 执行effect的方法
    run() {
        // 非激活状态 只需执行函数 不需要依赖收集
        if(!this.active) { this.fn() };

        try {
            // 依赖收集 核心是将当前effect和稍后渲染的属性关联在一起
            // 获取到全局的activeEffect
            activeEffect = this;
            return this.fn();   
        } finally {
            // 执行后清空
            activeEffect = undefined;
        }
    }
}

export function effect(fn) {
    // fn根据状态变化重新执行 effect可以嵌套
    // 创建响应式effect
    const _effect = new ReactiveEffect(fn);
    // 默认先执行一次
    _effect.run();
}