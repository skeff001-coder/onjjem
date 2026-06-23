import { Router, type IRouter } from "express";
<<<<<<< HEAD

=======
import { HealthCheckResponse } from "@workspace/api-zod";
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
<<<<<<< HEAD
  
  res.json({ status: "ok" });
=======
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
});

export default router;
