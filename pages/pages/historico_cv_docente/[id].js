import pool from '../../../lib/db.js';

export default async function handler(req,res){
  const {id}=req.query;
  if(req.method==='GET'){
    const result=await pool.query('SELECT * FROM historico_cv_docente WHERE id_hcd=$1;',[id]);
    if(!result.rows.length) return res.status(404).json({error:'Not found'});
    return res.status(200).json(result.rows[0]);
  }else if(req.method==='PUT'){
    const {id_doc,data,link_cv}=req.body;
    const result=await pool.query(
      'UPDATE historico_cv_docente SET id_doc=$1,data=$2,link_cv=$3 WHERE id_hcd=$4 RETURNING *;',
      [id_doc,data,link_cv,id]
    );
    return res.status(200).json(result.rows[0]);
  }else if(req.method==='DELETE'){
    await pool.query('DELETE FROM historico_cv_docente WHERE id_hcd=$1;',[id]);
    return res.status(204).end();
  }else{
    res.setHeader('Allow',['GET','PUT','DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
