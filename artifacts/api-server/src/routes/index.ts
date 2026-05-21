import { Router, type IRouter } from "express";
import healthRouter from "./health";
import processRouter from "./process";
import analyticsRouter from "./analytics";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);
router.use(analyticsRouter);
router.use(stripeRouter);

export default router;
