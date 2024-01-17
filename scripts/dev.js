const { resolve } = require('path');
const { build } = require('esbuild');
const args = require('minimist')(process.argv.slice(2))
// 根目录package.json中node scripts/dev.js reactivity -f global
// 解析取命令行参数args为{ _: [ 'reactivity' ], f: 'global' }

const target = args._[0] || 'reactivity';
const format = args.f || 'global';

// 开发环境只打包某一个模块 比如reactivity模块
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// iife 立即执行函数          var VueReactivity = (function(){})() 使用方法：<script src="./dist/xxx.global.js"></script>
// cjs  node中的模块          module.exports                       使用方法：require('./dist/xxx.cjs.js')
// esm  浏览器中的esModule模块 import                              使用方法：<script src="./dist/xxx.esm.js" type="module"></script>
const outputFormat = format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm';

const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`);

// esbuild天生支持ts
build({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)], // 打包的入口 为某个模块的src/index.ts
    outfile,    // 打包输出的出口
    bundle: true,   // 把所有的包全部打包到一起
    sourcemap: true,    // 输出sourcemap
    format: outputFormat, // 打包输出的格式
    globalName: pkg.buildOptions?.name, // 打包后的可以使用的全局变量 比如reactivity模块打包后是var VueReactivity = (function(){})()
    platform: format === 'cjs' ? 'node' : 'browser', // 打包输出适用的平台
}).then(() => { // 打包完毕后触发
    console.log('watching~~~')
})