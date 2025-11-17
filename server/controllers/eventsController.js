import supabase from "../config/supabase.js";

// Create an event
export const createEvent = async (req, res) => {
  try {
    const user_id = req.profile?.id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    const {
      title,
      location,
      date,
      time,
      capacity,
      food_items,
      dietary_options,
      pickup_instructions,
      description,
      image_urls,
    } = req.body;

    if (
      !title ||
      !location ||
      !date ||
      !time ||
      !capacity ||
      !food_items ||
      !dietary_options ||
      !Array.isArray(image_urls) ||
      image_urls.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          user_id,
          title,
          location,
          date,
          time,
          capacity,
          attendees_count: 0,
          food_items,
          dietary_options,
          pickup_instructions,
          description,
          image_urls,
        },
      ])
      .select();

    if (error) throw error;

    return res
      .status(201)
      .json({ message: "Event created successfully", event: data[0] });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Server error while creating event." });
  }
};

// Fetch all available events
export const getAllEvents = async (req, res) => {
  try {
    const rawTerm = req.query.search || "";
    const searchTerm = rawTerm.toLowerCase().trim();

    const { data: allEvents, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(400).json({ error: "Invalid search query." });
    }

    let events = allEvents || [];

    // local search filtering
    if (searchTerm) {
      events = events.filter((event) => {
        const t = (val) => (val ? val.toString().toLowerCase() : "");

        const inTitle = t(event.title).includes(searchTerm);
        const inLocation = t(event.location).includes(searchTerm);
        const inDescription = t(event.description).includes(searchTerm);

        const inDietary =
          Array.isArray(event.dietary_options) &&
          event.dietary_options.some((opt) => t(opt).includes(searchTerm));

        const inFoodItems =
          Array.isArray(event.food_items) &&
          event.food_items.some(
            (f) =>
              t(f.item).includes(searchTerm) || t(f.qty).includes(searchTerm)
          );

        return (
          inTitle || inLocation || inDescription || inDietary || inFoodItems
        );
      });
    }
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events." });
  }
};

// get posted event
export const getPostedEvents = async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: postedEvents, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    res.status(200).json({ posted: postedEvents });
  } catch (err) {
    console.error("Error fetching posted events:", err);
    res.status(500).json({ error: "Failed to fetch posted events" });
  }
};

//get user reserved events
export const getUserReservedEvents = async (req, res) => {
  try {
    const user_id = req.profile?.id;

    if (!user_id) {
      return res.status(401).json({ reservedEventIds: [] });
    }

    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", user_id);

    if (error) throw error;

    const reservedEventIds = data.map((row) => row.event_id);
    res.status(200).json({ reservedEventIds });
  } catch (err) {
    console.error("Error fetching reserved events:", err);
    res.status(500).json({ error: "Failed to load reserved events" });
  }
};

// Reserve an event
export const reserveEvent = async (req, res) => {
  try {
    const user_id = req.profile.id;
    const { eventId } = req.params;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("capacity, attendees_count")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.attendees_count >= event.capacity) {
      return res.status(400).json({ error: "Event is full" });
    }

    const { data: existing, error: existingError } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user_id)
      .single();

    if (existing && !existingError) {
      return res.status(400).json({ error: "You already reserved this event" });
    }

    const { error: insertError } = await supabase
      .from("event_attendees")
      .insert({
        event_id: eventId,
        user_id: user_id,
        status: "reserved",
      });

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from("events")
      .update({
        attendees_count: event.attendees_count + 1,
      })
      .eq("id", eventId);

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "Event reserved successfully",
    });
  } catch (error) {
    console.error("Error reserving event:", error);
    res.status(500).json({ error: "Failed to reserve event." });
  }
};

// Cancel a reservation
export const cancelReservation = async (req, res) => {
  try {
    const user_id = req.profile.id;
    const { eventId } = req.params;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: attendee, error: attendeeError } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user_id)
      .single();

    if (attendeeError || !attendee) {
      return res
        .status(404)
        .json({ error: "You do not have a reservation for this event" });
    }

    const { error: deleteError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("id", attendee.id);

    if (deleteError) throw deleteError;

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("attendees_count")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: "Event not found after delete" });
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({
        attendees_count: Math.max(0, event.attendees_count - 1),
      })
      .eq("id", eventId);

    if (updateError) throw updateError;

    return res.status(200).json({
      message: "Reservation canceled successfully",
    });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(500).json({ error: "Failed to cancel reservation." });
  }
};

//delete an event
export const deleteEvent = async (req, res) => {
  try {
    const user_id = req.profile?.id;
    const { eventId } = req.params;

    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("user_id")
      .eq("id", eventId)
      .single();

    if (fetchError || !event)
      return res.status(404).json({ error: "Event not found" });

    if (event.user_id !== user_id)
      return res.status(403).json({ error: "Unauthorized: Not your event" });

    const { error: attendeeError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId);

    if (attendeeError) throw attendeeError;

    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event." });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const user_id = req.profile?.id;

    const { eventId } = req.params;

    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("user_id, date")
      .eq("id", eventId)
      .single();

    if (fetchError || !event)
      return res.status(404).json({ error: "Event not found" });

    if (event.user_id !== user_id)
      return res.status(403).json({ error: "Unauthorized: Not your event" });

    const updates = req.body;

    const today = new Date().setHours(0, 0, 0, 0);
    const oldEventDate = new Date(event.date).setHours(0, 0, 0, 0);

    let shouldClearAttendees = false;

    if (updates.date) {
      const newEventDate = new Date(updates.date).setHours(0, 0, 0, 0);

      const wasPast = oldEventDate < today;
      const becomesFuture = newEventDate >= today;

      if (wasPast && becomesFuture) {
        shouldClearAttendees = true;
      }
    }

    if (shouldClearAttendees) {
      // Clear attendees
      await supabase.from("event_attendees").delete().eq("event_id", eventId);
      updates.attendees_count = 0;
    }

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select();

    if (error) throw error;

    return res.status(200).json({
      message: "Event updated successfully",
      event: data[0],
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event." });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json(event);
  } catch (err) {
    console.error("Error retrieving event:", err);
    res.status(500).json({ error: "Server error retrieving event" });
  }
};

// Get attendees for an event
export const getEventAttendees = async (req, res) => {
  try {
    const user_id = req.profile?.id;
    const { eventId } = req.params;

    // console.log("   • eventId:", eventId);
    // console.log("   • logged-in user (req.user.id):", user_id);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("user_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (String(event.user_id) !== String(user_id)) {
      console.log("Owner mismatch:", event.user_id, user_id);
      return res.status(403).json({ error: "Unauthorized: Not your event" });
    }

    const { data: attendees, error } = await supabase
      .from("event_attendees")
      .select(
        `
        id,
        created_at,
        status,
        profiles!inner (
          id,
          name,
          email
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(" Supabase join error:", error);
      return res.status(500).json({ error: "Failed to load attendees" });
    }

    return res.status(200).json({ attendees: attendees || [] });
  } catch (err) {
    console.error("Server error fetching attendees:", err);
    res.status(500).json({ error: "Failed to fetch attendees." });
  }
};
