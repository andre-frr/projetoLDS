import pool from '../../../lib/db.js';

export default async function handler(req,res){
  if(req.method==='GET'){
    const result=await pool.query('SELECT * FROM departamento');
    return res.status(200).json(result.rows);
  }else if(req.method==='POST'){
    const {nome,sigla,ativo}=req.body;
    if(!nome||!sigla) return res.status(400).json({error:'Missing fields'});
    const result=await pool.query(
      'INSERT INTO departamento (nome,sigla,ativo) VALUES($1,$2,$3) RETURNING *',
      [nome,sigla,ativo??true]
    );
    return res.status(201).json(result.rows[0]);
  }else{
    res.setHeader('Allow',['GET','POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
