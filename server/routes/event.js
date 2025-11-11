import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventsByUserId,
  reserveEvent,
  cancelReservation,
} from "../controllers/eventsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, createEvent);
router.get("/", getAllEvents);
router.get("/user/:userId", requireAuth, getEventsByUserId);
router.post("/:eventId/reserve", requireAuth, reserveEvent);
router.delete("/:eventId/reserve", requireAuth, cancelReservation);

export default router;
