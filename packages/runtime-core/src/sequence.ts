// 求最长递增子序列的个数
// 贪心算法 + 二分查找 + 溯源

// 1、当前项比结果最后一项大则直接放到结果末尾
// 2、当前项比结果最后一项小，需要遍历结果序列，通过二分查找找到第一个比当前项大的，替换
// 3、最优的情况，就是默认递增
export function getSequence(arr) {
    const len = arr.length;
    // 以默认第0个为基准值做序列 即以数组第0项为最长子序列第一个元素
    const result = [0];
    // 溯源 标记索引 存放的元素不用管 长度要和数组一样长
    const p = new Array(len).fill(0);
    let start;
    let end;
    let middle;
    // 取结果集最后一项 值为最长子序列最后一个元素在传入数组中的下标 如传入数组为[1, 2, 3]，resultLastIndex为2，即对应元素3
    let resultLastIndex;
    for(let i = 0; i < len; i++) {
        let arrI = arr[i];
        // 在patchKeyedChildren中 为0表示直接创建
        if(arrI !== 0) {
            resultLastIndex = result[result.length - 1];
            if(arr[resultLastIndex] < arrI) {
                result.push(i);
                // 当前值放到末尾时要记住它前面的那个值的下标
                p[i] = resultLastIndex;
                continue;
            }
            // 这里通过二分查找 在结果集中找到第一个比当前值大的值 用当前值的索引将其替换掉
            // 递增序列 采用二分查找 最快
            start = 0;
            end = result.length - 1;
            while(start < end) {
                middle = start + ((end - start) >> 1);
                if(arr[result[middle]] < arrI) {
                    start = middle + 1;
                } else {
                    end = middle;
                }
            }
            // 找到中间值后 需要做替换操作
            if(arr[result[end]] > arrI) {
                result[end] = i;
                // 记住它前面的那个值的下标
                p[i] = result[end - 1];
            }
        }
    }

    // 1、追加到末尾
    // 2、替换
    // 3、记录每个值的前驱节点
    // 4、通过最后一项进行回溯
    let i = result.length - 1;
    let last = result[i];
    while(i >= 0) {
        // 最后一项已经确定 每次向前追溯前驱节点替换
        result[i] = last;
        last = p[last];
        i--;
    }

    return result;
}