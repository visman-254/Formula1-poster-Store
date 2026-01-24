import express from "express";
import { stkPush, mpesaCallback, getPaymentStatus } from "../controllers/mpesaController.js";

const router = express.Router();

router.post("/stkpush", stkPush);
router.post("/callback", mpesaCallback);
router.get("/status/:checkoutRequestID", getPaymentStatus);

export default router;
