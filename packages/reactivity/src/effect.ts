export let activeEffect = undefined;
class ReactiveEffect {
    public parent = null;
    // 表示当前effect默认为激活状态
    public active = true;
    // 保存某个属性对应的Set 便于后续解除跟踪 直接清除Set
    public deps = [];
    // public fn 为ts语法糖 相当于this.fn = fn;
    constructor(public fn, public scheduler) {
    }

    // 执行effect的方法
    run() {
        // 非激活状态 只需执行函数 不需要依赖收集
        if(!this.active) { return this.fn() };

        try {
            // 先保存当前全局activeEffect
            this.parent = activeEffect;
            // 依赖收集 核心是将当前effect和稍后渲染的属性关联在一起
            // 获取到全局的activeEffect
            activeEffect = this;
            
            // 需要在执行fn前将fn之前收集的属性清空
            /* 
            effect(() => {
                app.innerHTML = state.flag ? state.name : state.age;
            });
            比如第一次渲染state.flag为true，模板使用到state.name name收集依赖
            把state.flag设为false，之后渲染模板不使用state.name 但因为name还存在依赖 所以改变name会触发effect执行
            所以每次effect执行前要把上一次收集的依赖先清除
            */
            cleanupEffect(this);
            return this.fn();
        } finally {
            // 执行完后有外层activeEffect则赋值 没有则清空
            activeEffect = this.parent;
        }
    }

    // 停止effect的收集 即不触发更新
    stop() {
        if(this.active) {
            this.active = false;
            cleanupEffect(this);
        }
    }
}

export function effect(fn, options: any = {}) {
    // fn根据状态变化重新执行 effect可以嵌套
    // 创建响应式effect
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 默认先执行一次
    _effect.run();
    // 将this指向当前effect实例
    const runner = _effect.run.bind(_effect);
    // 将effect实例挂载到runner函数对象的effect属性中
    runner.effect = _effect;
    return runner;
}

// 多对多关系：一个effect对应多个属性 一个属性对应多个effect
// const data = { name: 'zf', age: 13 } -> WeakMap(data -> Map(name -> Set[], age -> Set[]))
const targetMap = new WeakMap();
export function track(target, type, key) {
    // 如果模板没有用到 不需要收集
    if(!activeEffect) return;
    let depsMap = targetMap.get(target);
    if(!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    // key -> name / age
    let dep = depsMap.get(key);
    if(!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    // 去重 比如某个effect多次用到某个key 只需跟踪一次：effect(() => { state.name; state.name; state.name;  })
    let shouldTrack = !dep.has(activeEffect);
    // 双向记录 属性记录多个effect / effect记录多个属性对应的Set
    if(shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}

export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    // 说明触发的值没有在模板中使用 不需要触发更新
    if(!depsMap) return;
    let effects = depsMap.get(key);
    // 在执行之前 先拷贝一份来执行 不要关联引用
    /* 
    比如effect调用run方法时 会先调用cleanupEffect清空上一次执行依赖的属性
    此时Set会调用delete删除 之后调用fn会触发track Set会调用add添加dep
    对于Set特性来说 一边删除一边添加会造成死循环 如 let a = new Set(1); a.forEach(() => { a.delete(1); a.add(1); })
    所以需要拷贝
    */
    effects = new Set(effects);
    effects.forEach(effect => {
        /* 
        比如：
        effect(() => {
            state.age = Math.random()
        })
        state.name 触发set中的trigger trigger触发effect的run方法
        run方法保存当前effect 并且run方法导致fn即() => { state.age = Math.random() }重新执行
        导致无限循环 所以要判断全局effect是否和当前需执行的effect相同 是的话就只执行一次即可
        */

        // 如果用户传入了调度函数 则调用调度函数 否则默认刷新视图
        if(effect !== activeEffect) {
            if(effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        }
    })
}

function cleanupEffect(effect) {
    // 比如name属性 deps保存的name对应的effect 需要先清除再将deps置为空 不能直接effect.deps = [];
    const { deps } = effect;
    for(let i = 0; i < deps.length; i++) {
        deps[i].delete(effect);
    }
    effect.deps.length = 0;
}

/* 
嵌套effect执行流程 类似于一个树形结构
需要一个parent记录外层effect对应的activeEffect
否则内层执行完run会把activeEffect置为undefined
外层的state.address就获取不到activeEffect 因此要重新获取parent记录的外层activeEffect
effect(() => {                     parent -> null; activeEffect = e1
    state.name                     name -> e1
    effect(() => {                 parent = e1; activeEffect = e2
        state.age                  age -> e2
    })
    state.address                  activeEffect = this.parent
})
*/