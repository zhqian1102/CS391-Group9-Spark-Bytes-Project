import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventsByUserId,
  reserveEvent,
  cancelReservation,
} from "../controllers/eventsController.js";

const router = express.Router();

router.post("/", createEvent);
router.get("/", getAllEvents);
router.get("/user/:userId", getEventsByUserId);
router.post("/:eventId/reserve", reserveEvent);
router.delete("/:eventId/reserve", cancelReservation);

export default router;
