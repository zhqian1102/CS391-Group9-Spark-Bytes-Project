import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventsByUserId,
  reserveEvent,
  cancelReservation,
  deleteEvent,
  updateEvent,
  getEventById,
  getEventAttendees,
} from "../controllers/eventsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, createEvent);
router.get("/", getAllEvents);

router.get("/user/:userId", requireAuth, getEventsByUserId);

router.get("/:eventId", requireAuth, getEventById);

router.put("/:eventId", requireAuth, updateEvent);
router.delete("/:eventId", requireAuth, deleteEvent);

router.get("/:eventId/attendees", requireAuth, getEventAttendees);

router.post("/:eventId/reserve", requireAuth, reserveEvent);
router.delete("/:eventId/reserve", requireAuth, cancelReservation);

export default router;
