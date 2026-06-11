import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  DoorOpen,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useHotel } from "../context/HotelContext";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { rooms, user } = useHotel();
  const assignedRooms = rooms.filter(
    (room) => room.status === "assigned",
  );
  const completedRooms = rooms.filter(
    (room) => room.status === "completed",
  );

  return (
    <AppShell
      role="staff"
      title={`Good morning, ${user.name.split(" ")[0]}`}
      subtitle="Your assigned rooms are ready. Let’s make every stay feel exceptional."
    >
      <section className="staff-summary">
        <div className="summary-main">
          <span className="summary-icon"><Sparkles size={23} /></span>
          <div><strong>{assignedRooms.length} rooms to prepare</strong><p>All assignments are due before guest arrival.</p></div>
        </div>
        <div className="summary-progress">
          <span><strong>{completedRooms.length}</strong> complete</span>
          <div className="progress-track">
            <i style={{ width: `${(completedRooms.length / Math.max(assignedRooms.length + completedRooms.length, 1)) * 100}%` }} />
          </div>
        </div>
      </section>

      <div className="section-title">
        <div><h2>My assigned rooms</h2><p>Complete each room’s checklist and submit when ready.</p></div>
        <span className="count-pill">{assignedRooms.length} remaining</span>
      </div>

      <section className="room-card-grid">
        {assignedRooms.map((room) => (
          <article className="room-card" key={room.id}>
            <div className="room-card-top">
              <div>
                <span className="room-label">Room</span>
                <h3>{room.id}</h3>
              </div>
              <span className={`priority ${room.priority === "Priority" ? "high" : ""}`}>
                {room.priority}
              </span>
            </div>
            <div className="room-type">{room.type || "Standard room"}</div>
            <div className="room-meta">
              <span><MapPin size={16} /> {room.floor}</span>
            </div>
            <div className="guest-note">
              <DoorOpen size={18} />
              <span><small>Guest status</small><strong>{room.guest}</strong></span>
            </div>
            <button className="button primary full" onClick={() => navigate(`/staff/room/${room.id}`)}>
              Start room checklist <ArrowRight size={18} />
            </button>
          </article>
        ))}
        {!assignedRooms.length && (
          <div className="no-rooms panel">
            <span className="success-orb"><CheckCircle2 size={30} /></span>
            <h3>You’re all caught up</h3>
            <p>No rooms are currently assigned to {user.name}.</p>
          </div>
        )}
      </section>

      {completedRooms.length > 0 && (
        <section className="completed-section">
          <div className="section-title compact">
            <div><h2>Completed today</h2><p>Your recently submitted rooms.</p></div>
          </div>
          <div className="completed-list">
            {completedRooms.map((room) => (
              <div className="completed-row" key={room.id}>
                <span className="complete-check"><CheckCircle2 size={20} /></span>
                <span><strong>Room {room.id}</strong><small>{room.type || "Standard room"}</small></span>
                <span className="submitted-time">
                  Submitted {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(room.submittedAt))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
