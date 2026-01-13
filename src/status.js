import express from 'express';
const router = express.Router();

/**
 * GET /status
 * @summary Healthcheck
 * @tags system
 * @return {object} 200 - STATUS OK
 * @example response - 200 - example
 * "STATUS OK"
 */
router.get('/', (req, res) => {
    console.log("/status");
    return res.status(200).send("STATUS OK");
});

export default router;