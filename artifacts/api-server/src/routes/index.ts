import { Router, type IRouter } from "express";
import healthRouter from "./health";
import processRouter from "./process";
import analyticsRouter from "./analytics";
import stripeRouter from "./stripe";
import emailSignupRouter from "./emailSignup";

const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);
router.use(analyticsRouter);
router.use(stripeRouter);
router.use(emailSignupRouter);

export default router;
