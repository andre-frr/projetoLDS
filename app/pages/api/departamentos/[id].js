import pool from '../../../lib/db.js';

export default async function handler(req,res){
  const {id}=req.query;
  if(req.method==='GET'){
    const result=await pool.query('SELECT * FROM departamento WHERE id_dep=$1',[id]);
    if(!result.rows.length) return res.status(404).json({error:'Not found'});
    return res.status(200).json(result.rows[0]);
  }else if(req.method==='PUT'){
    const {nome,sigla,ativo}=req.body;
    const result=await pool.query(
      'UPDATE departamento SET nome=$1,sigla=$2,ativo=$3 WHERE id_dep=$4 RETURNING *',
      [nome,sigla,ativo,id]
    );
    return res.status(200).json(result.rows[0]);
  }else if(req.method==='DELETE'){
    await pool.query('DELETE FROM departamento WHERE id_dep=$1',[id]);
    return res.status(204).end();
  }else{
    res.setHeader('Allow',['GET','PUT','DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
