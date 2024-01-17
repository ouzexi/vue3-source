import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";

class ComputedRefImpl {
    public effect;
    public _dirty = true;
    public __v_isReadonly = true;
    public __v_isRef = true;
    public _value;
    public dep = new Set;
    constructor(getter, public setter) {
        // 将用户的getter放到effect中 这里面依赖的属性 比如fullName依赖的firstName和lastName
        // 就会被这个effect收集起来 相当于getter就是effect(fn)的fn 第二个参数传入了调度器 会在属性改变触发trigger后执行
        this.effect = new ReactiveEffect(getter, () => {
            // 依赖的属性改变后 设置为脏值
            if(!this._dirty) {
                this._dirty = true;
                // 触发更新
                triggerEffects(this.dep);
            }
        })
    }
    // 类中的属性访问器 底层就是Object.defineProperty
    get value() {
        // 依赖收集
        trackEffects(this.dep);
        // 脏值才触发更新
        if(this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value;
    }
    set value(newValue) {
        this.setter(newValue);
    }
}

export const computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if(onlyGetter) {
        getter = getterOrOptions;
        setter = () => { console.warn('no setter') };
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    return new ComputedRefImpl(getter, setter);
}