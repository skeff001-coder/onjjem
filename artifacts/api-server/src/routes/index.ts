import { Router, type IRouter } from "express";
import healthRouter from "./health";
import processRouter from "./process";
import livingMemoriesRouter from "./livingMemories";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);
router.use(livingMemoriesRouter);
router.use(stripeRouter);

export default router;
