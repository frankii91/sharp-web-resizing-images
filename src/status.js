import express from 'express';
const router = express.Router();


router.get('/', async (req, res)=>
{
    try {
        return res.status(200).send("STATUS OK");
    } catch (error) {
        console.error("Internal Server Error", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message});
    }

});

export default router;