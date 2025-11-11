import supabase from "../config/supabase.js";

// Create an event
export const createEvent = async (req, res) => {
  try {
    const user_id = req.user?.id;
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

// get user's posted and reserved events
export const getEventsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: postedEvents, error: postError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId);
    if (postError) throw postError;

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
    const user_id = req.user?.id;
    const { eventId } = req.params;

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    if (eventError || !eventData)
      return res.status(404).json({ error: "Event not found" });

    const spotsLeft = eventData.capacity - eventData.attendees_count;
    if (spotsLeft <= 0) return res.status(400).json({ error: "Event is full" });

    //avoid duplicate
    const { data: existing } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing)
      return res.status(400).json({ error: "Already reserved this event" });

    const { error: insertError } = await supabase
      .from("event_attendees")
      .insert([{ event_id: eventId, user_id }]);
    if (insertError) throw insertError;

    const newCount = eventData.attendees_count + 1;
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({ attendees_count: newCount })
      .eq("id", eventId)
      .select("attendees_count, capacity")
      .single();
    if (updateError) throw updateError;

    const spotsRemaining = updatedEvent.capacity - updatedEvent.attendees_count;

    return res.status(200).json({
      message: "Reservation successful!",
      spotsLeft: spotsRemaining,
    });
  } catch (error) {
    console.error("Error reserving event:", error);
    res.status(500).json({ error: "Failed to reserve event." });
  }
};

// Cancel a reservation
export const cancelReservation = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { eventId } = req.params;

    // Delete reservation
    const { error: deleteError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user_id);
    if (deleteError) throw deleteError;

    // Increment capacity
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("capacity")
      .eq("id", eventId)
      .single();
    if (eventError || !eventData)
      return res.status(404).json({ error: "Event not found" });

    const newCount = Math.max(eventData.attendees_count - 1, 0);
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({ attendees_count: newCount })
      .eq("id", eventId)
      .select("attendees_count, capacity")
      .single();
    if (updateError) throw updateError;

    const spotsRemaining = updatedEvent.capacity - updatedEvent.attendees_count;

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      spotsLeft: spotsRemaining,
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ error: "Failed to cancel reservation." });
  }
};
