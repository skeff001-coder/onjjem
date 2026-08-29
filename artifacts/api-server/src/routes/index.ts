import { Router, type IRouter } from "express";
import healthRouter from "./health";
import canineRouter from "./canine";
import privacyRouter from "./privacy";
import stripeRouter from "./stripe";
import photoRouter from "./photo";
import contactRouter from "./contact";
import freeScanRouter from "./free-scan";
import cartoonifyRouter from "./cartoonify";
import testEmailRouter from "./test-email";

const router: IRouter = Router();
router.use(healthRouter);
router.use(canineRouter);
router.use(privacyRouter);
router.use(stripeRouter);
router.use(photoRouter);
router.use(contactRouter);
router.use(freeScanRouter);
router.use(cartoonifyRouter);
router.use(testEmailRouter);

export default router;
