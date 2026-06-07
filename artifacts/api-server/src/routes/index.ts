import { Router, type IRouter } from "express";
import healthRouter from "./health";
import canineRouter from "./canine";
import privacyRouter from "./privacy";
import storageRouter from "./storage";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(canineRouter);
router.use(privacyRouter);
router.use(storageRouter);
router.use(shopRouter);

export default router;
