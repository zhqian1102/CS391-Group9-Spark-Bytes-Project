import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import "./ViewAttendees.css";
import supabase, { APP_API_URL } from "../../config/supabase";

const API_URL = APP_API_URL;

export default function ViewAttendeesPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("You must be logged in to view attendees.");
          return;
        }

        const token = session.access_token;

        const eventRes = await fetch(`${API_URL}/api/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!eventRes.ok) {
          setError("Failed to load event.");
          return;
        }

        const event = await eventRes.json();
        setEventTitle(event.title ?? "Event");

        const attendeesRes = await fetch(
          `${API_URL}/api/events/${id}/attendees`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!attendeesRes.ok) {
          if (attendeesRes.status === 403) {
            setError("You are not the owner of this event.");
            return;
          }
          const text = await attendeesRes.text();
          setError(`Failed to load attendees: ${text}`);
          return;
        }

        const result = await attendeesRes.json();
        setAttendees(result.attendees || []);
      } catch (err) {
        console.error("Error loading attendees:", err);
        setError("Unexpected error while loading attendees.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  // Export CSV
  const exportToCSV = () => {
    if (attendees.length === 0) {
      alert("No attendees to export.");
      return;
    }

    const headers = ["Name", "Email", "Registration Date"];
    const rows = attendees.map((att) => {
      const name = att.profiles?.name || "N/A";
      const email = att.profiles?.email || "N/A";
      const reg = new Date(att.created_at).toLocaleString();
      return `"${name}","${email}","${reg}"`;
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${eventTitle.replace(/\s+/g, "_")}_attendees.csv`;
    link.click();
  };

  return (
    <div className="viewattendees-page-container">
      <NavigationBar />

      <main className="attendees-main-content">
        {/* Loading State */}
        {loading && <p style={{ padding: "2rem" }}>Loading attendees...</p>}

        {/* Error Message */}
        {!loading && error && (
          <div style={{ color: "red", padding: "2rem", fontSize: "1.2rem" }}>
            <p>{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="back-button"
              style={{ marginTop: "1rem" }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Page Content */}
        {!loading && !error && (
          <>
            <div className="attendees-actions">
              <div className="left-actions">
                <button className="back-button" onClick={() => navigate(-1)}>
                  ← Back
                </button>
              </div>

              <h1 className="attendees-title">
                Attendees for Food Event: "{eventTitle}"
              </h1>

              <div className="right-actions">
                <button className="export-button" onClick={exportToCSV}>
                  Export CSV
                </button>
              </div>
            </div>

            <div className="attendees-stats">
              <div className="stat-card">
                <div className="stat-number">{attendees.length}</div>
                <div className="stat-label">Total Attendees</div>
              </div>
            </div>

            {/* Attendee List */}
            <div className="attendees-list-container">
              {attendees.length === 0 ? (
                <p>No attendees yet.</p>
              ) : (
                <div className="attendees-table-wrapper">
                  <table className="attendees-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((att, i) => (
                        <tr key={att.id}>
                          <td>{i + 1}</td>
                          <td>{att.profiles?.name || "N/A"}</td>
                          <td>{att.profiles?.email || "N/A"}</td>
                          <td>{new Date(att.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
