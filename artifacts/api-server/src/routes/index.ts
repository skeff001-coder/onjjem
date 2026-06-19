import { Router, type IRouter } from "express";
import healthRouter from "./health";
import processRouter from "./process";
import analyticsRouter from "./analytics";
import stripeRouter from "./stripe";
import emailSignupRouter from "./emailSignup";
import photoUploadRouter from "./photoUpload";
import contactRouter from "./contact";
import restorationRouter from "./restoration";
import photoRouter from "./photo";


const router: IRouter = Router();

router.use(healthRouter);
router.use(processRouter);
router.use(analyticsRouter);
router.use(stripeRouter);
router.use(emailSignupRouter);
router.use(photoUploadRouter);
router.use(contactRouter);
router.use(restorationRouter);
router.use(photoRouter);

export default router;
