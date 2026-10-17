import fs from 'node:fs/promises';
import terser from 'next/dist/compiled/terser/bundle.min.js';
import webpackPackage from 'next/dist/compiled/webpack/webpack.js';
import path from 'node:path';
const {webpack}=webpackPackage;
await new Promise((resolve,reject)=>webpack({mode:'none',target:'web',entry:path.resolve('lib/interactive-entry.tsx'),output:{path:path.resolve('public'),filename:'interactive-dashboard.js'},resolve:{extensions:['.tsx','.ts','.js'],alias:{'@':process.cwd()}},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.resolve('scripts/tsx-loader.cjs')}]},plugins:[new webpack.DefinePlugin({'process.env.NODE_ENV':JSON.stringify('production')})],optimization:{splitChunks:false,runtimeChunk:false,minimize:false,minimizer:[]},performance:{hints:false}},(error,stats)=>{if(error||stats.hasErrors())reject(error||new Error(stats.toString({all:false,errors:true})));else{console.log('Offline interactive dashboard bundle built.');resolve()}}));

const scriptPath=path.resolve('public/interactive-dashboard.js');const minified=await terser.minify(await fs.readFile(scriptPath,'utf8'),{compress:true,mangle:true,format:{comments:false}});await fs.writeFile(scriptPath,minified.code);
