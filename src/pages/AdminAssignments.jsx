import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  DoorOpen,
  History,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { useHotel } from "../context/HotelContext";
import { isToday } from "../dateUtils";

const formatTime = (date) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export default function AdminAssignments() {
  const { rooms, staffMembers, assignRoom } = useHotel();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [historyRoom, setHistoryRoom] = useState(null);

  useEffect(() => {
    if (!staffId && staffMembers.length) {
      setStaffId(String(staffMembers[0].id));
    }
  }, [staffId, staffMembers]);

  const availableRooms = rooms.filter((room) => room.status === "available");
  const assignableRooms = rooms.filter((room) => room.status !== "assigned");
  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const staff = staffMembers.find((member) => member.id === room.assignedTo);
        const searchable = `${room.id} ${room.type} ${room.floor} ${staff?.name ?? ""}`;
        return (
          (filter === "all" || room.status === filter) &&
          searchable.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [rooms, staffMembers, filter, search],
  );

  const openAssign = (selectedRoom = "") => {
    setRoomId(selectedRoom || assignableRooms[0]?.id || "");
    setStaffId((current) => current || String(staffMembers[0]?.id ?? ""));
    setAssignmentError("");
    setModalOpen(true);
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!roomId || !staffId) return;
    try {
      await assignRoom(roomId, staffId);
      setModalOpen(false);
    } catch (requestError) {
      setAssignmentError(requestError.message);
    }
  };

  return (
    <AppShell
      role="admin"
      title="Room assignments"
      subtitle="Assign rooms and follow every housekeeping task through completion."
      action={
        <button
          className="button primary"
          onClick={() => openAssign()}
          disabled={!assignableRooms.length}
        >
          <Plus size={18} /> Assign room
        </button>
      }
    >
      <section className="assignment-summary-grid">
        <SummaryCard
          icon={Clock3}
          label="In progress"
          value={rooms.filter((room) => room.status === "assigned").length}
          detail="Rooms being prepared"
          tone="amber"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Completed"
          value={
            rooms.filter(
              (room) =>
                room.status === "completed" && isToday(room.submittedAt),
            ).length
          }
          detail="Submitted today"
          tone="green"
        />
        <SummaryCard
          icon={DoorOpen}
          label="Unassigned"
          value={availableRooms.length}
          detail="Ready for assignment"
          tone="violet"
        />
      </section>

      <section className="panel assignments-panel">
        <div className="panel-heading">
          <div>
            <h2>All rooms</h2>
            <p>{filteredRooms.length} rooms shown across today’s operations.</p>
          </div>
          <div className="table-controls">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Room or staff..."
              />
            </label>
            <label className="select-wrap">
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All status</option>
                <option value="assigned">In progress</option>
                <option value="completed">Completed</option>
                <option value="available">Unassigned</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
        </div>

        <div className="room-table">
          <div className="table-row table-header">
            <span>Room</span>
            <span>Assigned to</span>
            <span>Status</span>
            <span>Activity</span>
            <span />
          </div>
          {filteredRooms.map((room) => {
            const staff = staffMembers.find((member) => member.id === room.assignedTo);
            const hasHistory = (room.assignmentHistory ?? []).length > 0;
            return (
              <div className="table-row" key={room.id}>
                <div className="room-cell">
                  <span className="room-number">{room.id}</span>
                  <span>
                    <strong>{room.type || "Standard room"}</strong>
                    <small>{room.floor}</small>
                  </span>
                </div>
                <div className="staff-cell">
                  {staff ? (
                    <>
                      <span className="avatar small">{staff.initials}</span>
                      <span>
                        <strong>{staff.name}</strong>
                        <small>{staff.shift}</small>
                      </span>
                    </>
                  ) : (
                    <span className="muted">Not assigned</span>
                  )}
                </div>
                <div>
                  <StatusBadge status={room.status} />
                </div>
                <div className="activity-cell">
                  {room.status === "completed" ? (
                    <>
                      <strong>Submitted at {formatTime(room.submittedAt)}</strong>
                      <small>{getGuestItemSummary(room)}</small>
                    </>
                  ) : room.status === "assigned" ? (
                    <>
                      <strong>Assigned at {formatTime(room.assignedAt)}</strong>
                      <small>{getGuestItemSummary(room)}</small>
                    </>
                  ) : (
                    <>
                      <strong>Ready to assign</strong>
                      <small>Waiting for staff</small>
                    </>
                  )}
                </div>
                <div className="row-action">
                  {room.status !== "assigned" && (
                    <button className="button text-button" onClick={() => openAssign(room.id)}>
                      Assign
                    </button>
                  )}
                  {hasHistory && (
                    <button
                      className="button secondary compact-button"
                      onClick={() => setHistoryRoom(room)}
                    >
                      <History size={15} /> History
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!filteredRooms.length && (
            <div className="empty-state">No assignments match your filters.</div>
          )}
        </div>
      </section>

      {modalOpen && (
        <AssignmentModal
          assignableRooms={assignableRooms}
          staffMembers={staffMembers}
          roomId={roomId}
          staffId={staffId}
          setRoomId={setRoomId}
          setStaffId={setStaffId}
          error={assignmentError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAssign}
        />
      )}
      {historyRoom && (
        <HistoryModal
          room={historyRoom}
          onClose={() => setHistoryRoom(null)}
        />
      )}
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className="assignment-summary-card panel">
      <span className={`stat-icon ${tone}`}><Icon size={20} /></span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </span>
    </article>
  );
}

function StatusBadge({ status }) {
  const label =
    status === "completed" ? "Completed" : status === "assigned" ? "In progress" : "Unassigned";
  return <span className={`status-badge ${status}`}><i />{label}</span>;
}

function AssignmentModal({
  assignableRooms,
  staffMembers,
  roomId,
  staffId,
  setRoomId,
  setStaffId,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">New assignment</span>
            <h2>Assign a room</h2>
            <p>Choose an unassigned or completed room and a staff member.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <label className="field">
          <span>Room</span>
          <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
            {assignableRooms.map((room) => (
              <option value={room.id} key={room.id}>
                Room {room.id}{room.type ? ` · ${room.type}` : ""} · {getStatusLabel(room.status)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Assign to</span>
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {staffMembers.map((staff) => (
              <option value={staff.id} key={staff.id}>{staff.name} · {staff.shift}</option>
            ))}
          </select>
        </label>
        <div className="assignment-preview">
          <UserRound size={20} />
          <span>The room will appear immediately in the staff member’s workspace.</span>
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button
            className="button primary"
            type="submit"
            disabled={
              !roomId ||
              !staffId
            }
          >
            Confirm assignment
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryModal({ room, onClose }) {
  const logs = room.assignmentHistory ?? [];
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal history-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Assignment history</span>
            <h2>Room {room.id}</h2>
            <p>Previous staff assignments and guest-item discrepancies.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="history-list">
          {logs.map((log) => {
            const missingItems = getMissingItems(log);
            return (
              <article className="history-entry" key={log.id}>
                <div className="history-entry-head">
                  <span className="avatar small">{log.assignedToInitials || "?"}</span>
                  <span>
                    <strong>{log.assignedToName || "Unknown staff"}</strong>
                    <small>{log.assignedToShift || "Room service"}</small>
                  </span>
                  <StatusBadge status={log.status} />
                </div>
                <div className="history-times">
                  <span>Assigned {formatTime(log.assignedAt)}</span>
                  <span>
                    {log.submittedAt ? `Submitted ${formatTime(log.submittedAt)}` : "Not submitted yet"}
                  </span>
                </div>
                {missingItems.length ? (
                  <div className="history-missing">
                    <span className="report-label">Missing earlier</span>
                    {missingItems.map((item) => (
                      <div className="missing-item" key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{item.missingQuantity} missing</span>
                        <small>
                          Expected {item.expectedQuantity}, found {item.foundQuantity}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="history-clear">No missing guest items recorded.</p>
                )}
                {log.remark && (
                  <p className="history-remark">{log.remark}</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getGuestItemSummary(room) {
  const items = room.guestItems ?? [];
  if (!items.length) return room.status === "completed"
    ? "Checklist completed"
    : "No guest items to verify";
  if (room.status !== "completed") {
    return `${items.length} guest item${items.length === 1 ? "" : "s"} to verify`;
  }
  const discrepancies = items.filter(
    (item) => item.foundQuantity !== item.expectedQuantity,
  ).length;
  return discrepancies
    ? `${discrepancies} item ${discrepancies === 1 ? "discrepancy" : "discrepancies"}`
    : "All guest items matched";
}

function getStatusLabel(status) {
  return status === "completed" ? "Completed" : status === "assigned" ? "In progress" : "Unassigned";
}

function getMissingItems(source) {
  return (source.guestItems ?? [])
    .filter((item) => item.foundQuantity !== null && item.foundQuantity < item.expectedQuantity)
    .map((item) => ({
      ...item,
      missingQuantity: item.expectedQuantity - item.foundQuantity,
    }));
}
