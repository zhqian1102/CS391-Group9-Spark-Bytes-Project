import express from "express";
import {
  createEvent,
  getAllEvents,
  getPostedEvents,
  getUserReservedEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventAttendees,
  reserveEvent,
  cancelReservation,
} from "../controllers/eventsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/", getAllEvents);

router.get("/posted/:userId", getPostedEvents);

router.get("/reserved/me", requireAuth, getUserReservedEvents);

router.get("/:eventId", requireAuth, getEventById);

router.get("/:eventId/attendees", requireAuth, getEventAttendees);

router.post("/", requireAuth, createEvent);

router.put("/:eventId", requireAuth, updateEvent);
router.delete("/:eventId", requireAuth, deleteEvent);

router.post("/:eventId/reserve", requireAuth, reserveEvent);
router.delete("/:eventId/reserve", requireAuth, cancelReservation);

export default router;
