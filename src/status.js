import express from 'express';
const router = express.Router();


router.get('/', (req, res) => {
    console.log("/status");
    return res.status(200).send("STATUS OK");
});

export default router;