import pool from '../../../lib/db.js';

export default async function handler(req,res){
  if(req.method==='GET'){
    const result=await pool.query('SELECT * FROM docente_grau;');
    return res.status(200).json(result.rows);
  }else if(req.method==='POST'){
    const {id_doc,id_grau,grau_nome,data,link_certif}=req.body;
    if(!id_doc||(!id_grau && !grau_nome)||!data) return res.status(400).json({error:'Missing required fields'});
    const result=await pool.query(
      'INSERT INTO docente_grau (id_doc,id_grau,grau_nome,data,link_certif) VALUES($1,$2,$3,$4,$5) RETURNING *;',
      [id_doc,id_grau,grau_nome,data,link_certif]
    );
    return res.status(201).json(result.rows[0]);
  }else{
    res.setHeader('Allow',['GET','POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
