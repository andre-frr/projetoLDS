import pool from '../../../lib/db.js';

export default async function handler(req,res){
  if(req.method==='GET'){
    const result=await pool.query('SELECT * FROM grau;');
    return res.status(200).json(result.rows);
  }else if(req.method==='POST'){
    const {nome}=req.body;
    if(!nome) return res.status(400).json({error:'Missing field nome'});
    const result=await pool.query(
      'INSERT INTO grau (nome) VALUES($1) RETURNING *;',
      [nome]
    );
    return res.status(201).json(result.rows[0]);
  }else{
    res.setHeader('Allow',['GET','POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
