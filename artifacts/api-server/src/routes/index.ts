import { Router, type IRouter } from "express";
import healthRouter from "./health";
<<<<<<< HEAD
import canineRouter from "./canine";
import privacyRouter from "./privacy";
=======
import processRouter from "./process";
import analyticsRouter from "./analytics";
import stripeRouter from "./stripe";
import emailSignupRouter from "./emailSignup";
import photoUploadRouter from "./photoUpload";
import contactRouter from "./contact";
import restorationRouter from "./restoration";
import photoRouter from "./photo";

>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

const router: IRouter = Router();

router.use(healthRouter);
<<<<<<< HEAD
router.use(canineRouter);
router.use(privacyRouter);
=======
router.use(processRouter);
router.use(analyticsRouter);
router.use(stripeRouter);
router.use(emailSignupRouter);
router.use(photoUploadRouter);
router.use(contactRouter);
router.use(restorationRouter);
router.use(photoRouter);
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

export default router;
