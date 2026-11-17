import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const root='/workspace/advance-video-edior';const require=createRequire(root+'/editor/apps/web/package.json');const ts=require('typescript');
const m=JSON.parse(fs.readFileSync(root+'/AnalyseFuture/migration-records/functional-moves.json','utf8'));
function resolve(source,spec){
 let pure=spec.split(/[?#]/)[0],base;
 if(pure.startsWith('.'))base=path.posix.normalize(path.posix.join(path.posix.dirname(source),pure));
 else if(pure.startsWith('@/'))base='editor/apps/web/src/'+pure.slice(2);
 else if(pure.startsWith('/src/'))base='editor/apps/web'+pure;
 else return null;
 const candidates=[base];
 if(/\.(js|jsx|mjs)$/.test(base))candidates.push(base.replace(/\.[^.]+$/,'.ts'),base.replace(/\.[^.]+$/,'.tsx'));
 for(const e of ['.ts','.tsx','.d.ts','.js','.jsx','.mjs','.json','.css','.wgsl'])candidates.push(base+e);
 for(const e of ['.ts','.tsx','.js','.jsx'])candidates.push(base+'/index'+e);
 return candidates.find(p=>fs.existsSync(root+'/'+p)&&fs.statSync(root+'/'+p).isFile())??null;
}
const errors=[];const literalCache=new Map();
for(const ref of m.module_reference_rewrites){
 if(!literalCache.has(ref.to)){
  const tree=ts.createSourceFile(ref.to,fs.readFileSync(root+'/'+ref.to,'utf8'),ts.ScriptTarget.Latest,true);const values=new Set();
  function visit(n){if(ts.isStringLiteralLike(n))values.add(n.text);ts.forEachChild(n,visit)}visit(tree);literalCache.set(ref.to,values);
 }
 const actual=resolve(ref.to,ref.after);
 if(actual!==ref.newTarget)errors.push({file:ref.to,spec:ref.after,expected:ref.newTarget,actual});
 if(!literalCache.get(ref.to).has(ref.after))errors.push({file:ref.to,missing_literal:ref.after});
}
const report={method:'Static AST literal reference inspection only; no test/build/typecheck or application execution',recorded_targets:m.module_reference_rewrites.length,source_files:literalCache.size,errors};
fs.writeFileSync(root+'/AnalyseFuture/migration-records/static-reference-review.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({references:report.recorded_targets,files:report.source_files,errors:errors.length}));
if(errors.length){console.log(JSON.stringify(errors.slice(0,12),null,2));process.exitCode=1;}
