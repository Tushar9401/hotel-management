import {
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useHotel } from "../context/HotelContext";
import { isToday } from "../dateUtils";

export default function AdminStaff() {
  const navigate = useNavigate();
  const { rooms, staffMembers } = useHotel();
  const [search, setSearch] = useState("");

  const staffWorkloads = useMemo(
    () =>
      staffMembers
        .map((staff) => {
          const assigned = rooms.filter(
            (room) => room.assignedTo === staff.id && room.status === "assigned",
          );
          const completed = rooms.filter(
            (room) =>
              room.assignedTo === staff.id &&
              room.status === "completed" &&
              isToday(room.submittedAt),
          );
          return { ...staff, assigned, completed };
        })
        .filter((staff) =>
          `${staff.name} ${staff.shift}`.toLowerCase().includes(search.toLowerCase()),
        ),
    [rooms, staffMembers, search],
  );

  const totalAssigned = staffWorkloads.reduce(
    (total, staff) => total + staff.assigned.length,
    0,
  );
  const totalCompleted = staffWorkloads.reduce(
    (total, staff) => total + staff.completed.length,
    0,
  );

  return (
    <AppShell
      role="admin"
      title="Housekeeping staff"
      subtitle="See today’s workload and keep assignments balanced across the team."
      action={
        <button className="button primary" onClick={() => navigate("/admin/assignments")}>
          <Plus size={18} /> Assign a room
        </button>
      }
    >
      <section className="staff-overview-strip">
        <div>
          <span className="summary-icon"><UserCheck size={22} /></span>
          <span><strong>{staffMembers.length} staff on schedule</strong><small>Across morning and evening shifts</small></span>
        </div>
        <div className="staff-overview-metrics">
          <span><strong>{totalAssigned}</strong><small>In progress</small></span>
          <span><strong>{totalCompleted}</strong><small>Completed</small></span>
        </div>
      </section>

      <div className="staff-toolbar">
        <div>
          <h2>Team workload</h2>
          <p>Live room ownership and completed tasks for today.</p>
        </div>
        <label className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff..."
          />
        </label>
      </div>

      <section className="admin-staff-grid">
        {staffWorkloads.map((staff) => {
          const isBusy = staff.assigned.length > 1;
          return (
            <article className="admin-staff-card panel" key={staff.id}>
              <div className="staff-card-head">
                <span className="avatar staff-avatar">{staff.initials}</span>
                <span className="staff-card-identity">
                  <strong>{staff.name}</strong>
                  <small>{staff.shift}</small>
                </span>
                <span className={`availability-pill ${isBusy ? "busy" : ""}`}>
                  <i /> {isBusy ? "Busy" : "Available"}
                </span>
              </div>

              <div className="staff-card-stats">
                <span>
                  <Clock3 size={17} />
                  <strong>{staff.assigned.length}</strong>
                  <small>In progress</small>
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  <strong>{staff.completed.length}</strong>
                  <small>Completed</small>
                </span>
              </div>

              <div className="staff-room-section">
                <span className="staff-section-label">Assigned rooms</span>
                {staff.assigned.length ? (
                  <div className="staff-room-list">
                    {staff.assigned.map((room) => (
                      <span className="staff-room-chip" key={room.id}>
                        <strong>{room.id}</strong>
                        <small>{room.type || "Standard room"}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="staff-empty-workload">
                    <Sparkles size={17} />
                    <span>No active rooms right now</span>
                  </div>
                )}
              </div>

              <button
                className="button secondary full"
                onClick={() => navigate("/admin/assignments")}
              >
                Manage assignments
              </button>
            </article>
          );
        })}
      </section>

      {!staffWorkloads.length && (
        <div className="empty-state panel">No staff members match your search.</div>
      )}
    </AppShell>
  );
}
