import { Router, type IRouter } from "express";
import healthRouter from "./health";
import processRouter from "./process";
import livingMemoriesRouter from "./livingMemories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);
router.use(livingMemoriesRouter);

export default router;
