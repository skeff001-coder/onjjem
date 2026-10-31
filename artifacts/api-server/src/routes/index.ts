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
import prodigiCheckRouter from "./prodigiCheck";
import giveawayRouter from "./giveaway";
import printablesRouter from "./printables";
import contestRouter from "./contest";
import xmasGiveawayRouter from "./xmasGiveaway";
import jemziFindersRouter from "./jemziFinders";

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
router.use(prodigiCheckRouter);
router.use(giveawayRouter);
router.use(printablesRouter);
router.use(contestRouter);
router.use(xmasGiveawayRouter);
router.use(jemziFindersRouter);

export default router;

// Build marker: 23 Oct 2026 (colouring page + competition + cart recovery)
