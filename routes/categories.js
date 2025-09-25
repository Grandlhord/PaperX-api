import express from 'express'

const router = express.Router();

const categories = [
    { title: "Medicine", count: "1,900+ projects"},
    { title: "Economics", count: "1,500+ projects",},
    { title: "Law", count: "1,200+ projects",},
]

router.get(`/`,(req,res)=>{
    res.json(categories);
})

export default router;