import express from "express"

const router = express.Router();

const projects = [
    {
        title:"Machine Learning in Healthcare",
        author:"James Kekeli",
        category:"Computer Science",
        price:"$89",
        downloads:"1,234",
        status:"Published",
    },
    {
        title:"Machine Learning in Agriculture",
        author:"John Doe",
        category:"Computer Engineering",
        price:"$209",
        downloads:"5234",
        status:"Unpublished",
    },
]

router.get(`/`,(req,res)=>{
    res.json(projects);
});

router.get(`/:id`,(req,res)=>{
    const id = parseInt(req.params.id);
    const index = projects.findIndex(project => project.id === id);
    index !== -1 ? res.json(projects[index]) : res.status(404).json({message:"Project not found"});
});

router.post("/", (req, res) => {
  const { title, author, category, price, downloads, status } = req.body;

  const project = { title, author, category, price, downloads, status };

  projects.push(project);
  res.status(201).json(project);
});


export default router;