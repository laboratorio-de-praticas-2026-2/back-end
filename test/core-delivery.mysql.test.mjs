import 'dotenv/config';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import {randomInt,randomUUID} from 'node:crypto';

function doc(n){let d=Array.from({length:n},()=>randomInt(10));for(let i=0;i<2;i++){let weights=n===9?Array.from({length:d.length},(_,k)=>d.length+1-k):(i?[6,5,4,3,2,9,8,7,6,5,4,3,2]:[5,4,3,2,9,8,7,6,5,4,3,2]);const r=d.reduce((s,v,k)=>s+v*weights[k],0)%11;d.push(r<2?0:11-r);}return d.join('')}
test('Core: PF/PJ, permissões, busca, CMS e edição de duas empresas em banco real', {timeout:90000},async()=>{
 assert.ok(['127.0.0.1','localhost'].includes(process.env.DB_HOST),'Somente banco local de teste');
 const base=process.env.CORE_TEST_API_URL||'http://127.0.0.1:3333';
 assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
 const key=randomUUID(),pass='Core-Teste-2026!',ids=[],services=[],ads=[];
 async function call(path,method='GET',body,token,status=200){const r=await fetch(`${base}/${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=r.status===204?null:await r.json();assert.equal(r.status,status,`${method} ${path}: ${JSON.stringify(data)}`);return data}
 try{
  const [a]=await db.execute('INSERT INTO usuario (nome,email,senha,nivel,cpf_cnpj,updated_at) VALUES (?,?,?,?,?,NOW())',['Admin Teste',`admin-${key}@example.test`,await bcrypt.hash(pass,12),'administrador',doc(9)]);ids.push(a.insertId);
  const admin=(await call('auth/login','POST',{email:`admin-${key}@example.test`,senha:pass})).accessToken;
  const pf={nome:'Cliente PF Teste',email:`pf-${key}@example.test`,senha:pass,cpfCnpj:doc(9)};
  const created=await call('clientes','POST',pf,undefined,201);ids.push(created.id);assert.equal(created.senha,undefined);
  await call('clientes','POST',pf,undefined,409);
  const login=await call('auth/login','POST',{email:pf.email,senha:pass});const token=login.accessToken;
  await call('auth/login','POST',{email:pf.email,senha:'incorreta'},undefined,401);
  assert.equal((await call('auth/me','GET',undefined,token)).id,created.id);
  await call('servicos/admin','GET',undefined,undefined,401);await call('servicos/admin','GET',undefined,token,403);
  await call('publicidade/admin','POST',{titulo:'Bloqueado',conteudo:'Sem permissão'},token,403);
  await call('admin/usuarios','GET',undefined,token,403);
  assert.equal((await call(`search/document?doc=${pf.cpfCnpj}`,'GET',undefined,token)).found,true);
  const pj={nome:'Responsável PJ Teste',email:`pj-${key}@example.test`,senha:pass,cpf_cnpj:doc(9),razaoSocial:'Empresa Core Teste',cnpj:doc(12),regimeTributario:'simples_nacional'};
  await call('contato/cadastro-pj','POST',{...pj,cnpj:'11111111111111'},undefined,400);
  const p=await call('contato/cadastro-pj','POST',pj,undefined,201);ids.push(p.usuario.id);assert.equal(p.usuario.senha,undefined);
  const pjToken=(await call('auth/login','POST',{email:pj.email,senha:pass})).accessToken;
  assert.equal((await call(`search/document?doc=${pj.cnpj}`,'GET',undefined,pjToken)).found,true);
  await call(`search/document?doc=${pj.cnpj}`,'GET',undefined,token,403);
  const [second]=await db.execute('INSERT INTO empresa (usuario_id,razao_social,cnpj,regime_tributario,updated_at) VALUES (?,?,?,?,NOW())',[p.usuario.id,'Segunda empresa preservada',doc(12),'mei']);
  const profile=await call(`admin/usuarios/${p.usuario.id}`,'GET',undefined,admin);assert.equal(profile.empresas.length,2);
  await call(`admin/usuarios/${p.usuario.id}`,'PATCH',{empresaId:p.empresa.id,razaoSocial:'Empresa atualizada'},admin);
  const [check]=await db.execute('SELECT razao_social FROM empresa WHERE id=?',[second.insertId]);assert.equal(check[0].razao_social,'Segunda empresa preservada');
  await call(`admin/usuarios/${p.usuario.id}`,'PATCH',{empresaId:999999,razaoSocial:'Invasão'},admin,400);
  for(const [path,body,bucket]of [['servicos',{nome:'Serviço de teste',descricao:'Integração real',valorBase:99.5,prazoEstimadoDias:5},services],['publicidade',{titulo:'Campanha teste',conteudo:'Publicidade real'},ads]]){
   const item=await call(`${path}/admin`,'POST',body,admin,201);bucket.push(item.id);
   assert.ok((await call(path)).some(v=>v.id===item.id));
   await call(`${path}/admin/${item.id}`,'PATCH',path==='servicos'?{valorBase:120}:{titulo:'Campanha editada'},admin);
   const edited=(await call(path)).find(v=>v.id===item.id);assert.equal(path==='servicos'?Number(edited.valorBase):edited.titulo,path==='servicos'?120:'Campanha editada');
   await call(`${path}/admin/${item.id}/status`,'PATCH',{ativo:false},admin);assert.ok(!(await call(path)).some(v=>v.id===item.id));
   await call(`${path}/admin/${item.id}/status`,'PATCH',{ativo:true},admin);assert.ok((await call(path)).some(v=>v.id===item.id));
   await call(`${path}/admin/${item.id}`,'DELETE',undefined,admin);assert.ok(!(await call(path)).some(v=>v.id===item.id));
   if(path==='servicos'){const [deleted]=await db.execute('SELECT deleted_at FROM servico WHERE id=?',[item.id]);assert.ok(deleted[0].deleted_at);assert.ok(!(await call('servicos/admin','GET',undefined,admin)).some(v=>v.id===item.id));}
  }
  const filtered=await call('search/advanced?regimeTributario=mei','GET',undefined,admin);assert.ok(filtered.results.some(u=>u.id===p.usuario.id));
  await call('auth/logout','POST',undefined,token,204);
  await call('auth/me','GET',undefined,token,401);await call(`search/document?doc=${pf.cpfCnpj}`,'GET',undefined,token,401);
  await call('auth/logout','POST',undefined,admin,204);await call('servicos/admin','GET',undefined,admin,401);
 }finally{for(const id of services)await db.execute('DELETE FROM servico WHERE id=?',[id]);for(const id of ads)await db.execute('DELETE FROM publicidade WHERE id=?',[id]);for(const id of ids){await db.execute('DELETE FROM empresa WHERE usuario_id=?',[id]);await db.execute('DELETE FROM usuario WHERE id=?',[id]);}await db.end();}
});
