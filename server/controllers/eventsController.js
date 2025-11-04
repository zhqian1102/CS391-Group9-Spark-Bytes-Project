import supabase from "../config/supabase.js";

// Create an event
export const createEvent = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    // Verify and get user info
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Invalid user" });

    const user_id = user.id;

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
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    let user_id = null;

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) user_id = user.id;
    }

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;

    if (user_id) {
      const { data: reservations } = await supabase
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", user_id);

      const reservedIds = reservations?.map((r) => r.event_id) || [];

      const eventsWithStatus = events.map((event) => ({
        ...event,
        isReserved: reservedIds.includes(event.id),
      }));

      return res.status(200).json({ events: eventsWithStatus });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events." });
  }
};

// Fetch all events created or reserved by user
export const getEventsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // User's posted events
    const { data: postedEvents, error: postError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId);

    if (postError) throw postError;

    // User's reserved events
    const { data: reserved, error: reservedError } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", userId);

    if (reservedError) throw reservedError;

    const reservedIds = reserved.map((r) => r.event_id);

    const { data: reservedEvents, error: fetchReservedError } = await supabase
      .from("events")
      .select("*")
      .in("id", reservedIds);

    if (fetchReservedError) throw fetchReservedError;

    return res.status(200).json({
      posted: postedEvents,
      reserved: reservedEvents,
    });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ error: "Failed to fetch user's events." });
  }
};

// Reserve an event
export const reserveEvent = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Invalid user" });

    const user_id = user.id;
    const { eventId } = req.params;

    // Check if event exists
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    if (eventError || !eventData)
      return res.status(404).json({ error: "Event not found." });

    // Check capacity vs current reservations
    const { count, error: countError } = await supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) throw countError;

    if (count >= eventData.capacity) {
      return res.status(400).json({ error: "Event is full." });
    }

    // Check if user already reserved
    const { data: existing, error: existingError } = await supabase
      .from("event_attendees")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Already reserved this event." });
    }

    //Insert reservation
    const { data, error } = await supabase
      .from("event_attendees")
      .insert([{ event_id: eventId, user_id }])
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: "Reservation successful!",
      reservation: data[0],
    });
  } catch (error) {
    console.error("Error reserving event:", error);
    res.status(500).json({ error: "Failed to reserve event." });
  }
};

// Cancel a reservation
export const cancelReservation = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return res.status(401).json({ error: "Invalid user" });

    const user_id = user.id;
    const { eventId } = req.params;

    const { error } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user_id);

    if (error) throw error;

    return res
      .status(200)
      .json({ message: "Reservation cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ error: "Failed to cancel reservation." });
  }
};
