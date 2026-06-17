import {
  BedDouble,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DoorOpen,
  MessageSquareText,
  PackagePlus,
  Plus,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import GuestItemsEditor from "../components/GuestItemsEditor";
import { useHotel } from "../context/HotelContext";
import { isToday } from "../dateUtils";

const formatTime = (date) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    user,
    rooms,
    staffMembers,
    updateGuestItems,
    resolveRoomAttention,
  } = useHotel();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemsRoomId, setItemsRoomId] = useState("");
  const [guestItems, setGuestItems] = useState([]);
  const [itemsError, setItemsError] = useState("");
  const [resolvingRoomId, setResolvingRoomId] = useState("");
  const [attentionError, setAttentionError] = useState("");

  const stats = {
    total: rooms.length,
    assigned: rooms.filter((room) => room.status === "assigned").length,
    completed: rooms.filter(
      (room) => room.status === "completed" && isToday(room.submittedAt),
    ).length,
    available: rooms.filter((room) => room.status === "available").length,
  };

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesFilter = filter === "all" || room.status === filter;
        const staff = staffMembers.find((member) => member.id === room.assignedTo);
        const matchesSearch = `${room.id} ${room.type} ${staff?.name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [rooms, staffMembers, filter, search],
  );

  const assignableRooms = rooms.filter((room) => room.status !== "assigned");
  const editableRooms = rooms.filter((room) => room.status !== "completed");
  const attentionRooms = rooms.filter(
    (room) =>
      room.status === "completed" &&
      !room.attentionResolved &&
      (getMissingItems(room).length > 0 || room.remark?.trim()),
  );

  const handleResolveAttention = async (roomId) => {
    setResolvingRoomId(roomId);
    setAttentionError("");
    try {
      await resolveRoomAttention(roomId);
    } catch (requestError) {
      setAttentionError(requestError.message);
    } finally {
      setResolvingRoomId("");
    }
  };

  const openGuestItems = (selectedRoomId = "") => {
    const room =
      rooms.find((item) => item.id === selectedRoomId) ??
      editableRooms[0];
    if (!room) return;
    setItemsRoomId(room.id);
    setGuestItems(
      (room.guestItems ?? []).map((item) => ({
        name: item.name,
        expectedQuantity: item.expectedQuantity,
      })),
    );
    setItemsError("");
    setItemsModalOpen(true);
  };

  const handleGuestItems = async (event) => {
    event.preventDefault();
    if (
      guestItems.some(
        (item) => !item.name.trim() || Number(item.expectedQuantity) < 1,
      )
    ) {
      setItemsError("Every item needs a name and a positive quantity.");
      return;
    }
    try {
      await updateGuestItems(itemsRoomId, guestItems);
      setItemsModalOpen(false);
    } catch (requestError) {
      setItemsError(requestError.message);
    }
  };

  return (
    <AppShell
      role="admin"
      title={`Good morning, ${user.name.split(" ")[0]}`}
      subtitle="Here’s what’s happening across your rooms today."
      action={
        <div className="page-actions">
          <button
            className="button secondary"
            onClick={() => openGuestItems()}
            disabled={!editableRooms.length}
          >
            <PackagePlus size={18} /> Guest items
          </button>
          <button
            className="button primary"
            onClick={() => navigate("/admin/assignments")}
            disabled={!assignableRooms.length}
          >
            <Plus size={18} /> Assign room
          </button>
        </div>
      }
    >
      <section className="stats-grid">
        <StatCard icon={BedDouble} label="Total rooms" value={stats.total} tone="blue" />
        <StatCard icon={Clock3} label="In progress" value={stats.assigned} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} tone="green" />
        <StatCard icon={DoorOpen} label="Unassigned" value={stats.available} tone="violet" />
      </section>

      {attentionRooms.length > 0 && (
        <section className="attention-section">
          <div className="section-title">
            <div>
              <h2>Needs attention</h2>
              <p>Missing guest items and remarks reported by room service.</p>
            </div>
            <span className="attention-count">
              <TriangleAlert size={14} /> {attentionRooms.length} reported
            </span>
          </div>
          <div className="attention-grid">
            {attentionRooms.map((room) => {
              const staff = staffMembers.find(
                (member) => member.id === room.assignedTo,
              );
              const missingItems = getMissingItems(room);
              return (
                <article className="attention-card panel" key={room.id}>
                  <div className="attention-card-head">
                    <span className="attention-icon"><TriangleAlert size={19} /></span>
                    <span>
                      <strong>Room {room.id}</strong>
                      <small>{staff?.name ?? "Room service"} · {formatTime(room.submittedAt)}</small>
                    </span>
                    <button
                      className="resolve-attention-button"
                      type="button"
                      disabled={resolvingRoomId === room.id}
                      onClick={() => handleResolveAttention(room.id)}
                    >
                      <Check size={15} />
                      {resolvingRoomId === room.id ? "Removing..." : "Mark resolved"}
                    </button>
                  </div>
                  {missingItems.length > 0 && (
                    <div className="missing-items">
                      <span className="report-label">Missing items</span>
                      {missingItems.map((item) => (
                        <div className="missing-item" key={item.id}>
                          <strong>{item.name}</strong>
                          <span>{item.missingQuantity} missing</span>
                          <small>Expected {item.expectedQuantity}, found {item.foundQuantity}</small>
                        </div>
                      ))}
                    </div>
                  )}
                  {room.remark?.trim() && (
                    <div className="staff-remark">
                      <MessageSquareText size={16} />
                      <span><small>Staff remark</small><p>{room.remark}</p></span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {attentionError && <p className="modal-error">{attentionError}</p>}
        </section>
      )}

      <section className="panel assignments-panel">
        <div className="panel-heading">
          <div>
            <h2>Room assignments</h2>
            <p>Track housekeeping progress across all rooms.</p>
          </div>
          <div className="table-controls">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rooms..."
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
            return (
              <div className="table-row" key={room.id}>
                <div className="room-cell">
                  <span className="room-number">{room.id}</span>
                  <span><strong>{room.type || "Standard room"}</strong><small>{room.floor}</small></span>
                </div>
                <div className="staff-cell">
                  {staff ? (
                    <>
                      <span className="avatar small">{staff.initials}</span>
                      <span><strong>{staff.name}</strong><small>{staff.shift}</small></span>
                    </>
                  ) : (
                    <span className="muted">Not assigned</span>
                  )}
                </div>
                <div><StatusBadge status={room.status} /></div>
                <div className="activity-cell">
                  {room.status === "completed" ? (
                    <><strong>Submitted at {formatTime(room.submittedAt)}</strong><small>{getGuestItemSummary(room)}</small></>
                  ) : room.status === "assigned" ? (
                    <><strong>Assigned at {formatTime(room.assignedAt)}</strong><small>{getGuestItemSummary(room)}</small></>
                  ) : (
                    <><strong>Ready to assign</strong><small>Waiting for staff</small></>
                  )}
                </div>
                <div className="row-action">
                  {room.status !== "completed" && (
                    <button className="button text-button" onClick={() => openGuestItems(room.id)}>
                      Items
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!filteredRooms.length && (
            <div className="empty-state">No rooms match your search.</div>
          )}
        </div>
      </section>

      {itemsModalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setItemsModalOpen(false)}>
          <form
            className="modal"
            onSubmit={handleGuestItems}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">Guest inventory</span>
                <h2>Guest-issued items</h2>
                <p>Add items and quantities that room service must verify.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setItemsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label className="field">
              <span>Room</span>
              <select
                value={itemsRoomId}
                onChange={(event) => openGuestItems(event.target.value)}
              >
                {editableRooms.map((room) => (
                  <option value={room.id} key={room.id}>
                    Room {room.id}{room.type ? ` · ${room.type}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <GuestItemsEditor items={guestItems} setItems={setGuestItems} />

            {itemsError && <p className="modal-error">{itemsError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setItemsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="button primary" type="submit">
                Save guest items
              </button>
            </div>
          </form>
        </div>
      )}

    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`}><Icon size={20} /></span>
      <span className="stat-copy"><small>{label}</small><strong>{value}</strong></span>
      <span className="stat-caption">Today</span>
    </article>
  );
}

function StatusBadge({ status }) {
  const label =
    status === "completed" ? "Completed" : status === "assigned" ? "In progress" : "Unassigned";
  return <span className={`status-badge ${status}`}><i />{label}</span>;
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

function getMissingItems(room) {
  return (room.guestItems ?? [])
    .filter(
      (item) =>
        item.foundQuantity !== null &&
        item.foundQuantity < item.expectedQuantity,
    )
    .map((item) => ({
      ...item,
      missingQuantity: item.expectedQuantity - item.foundQuantity,
    }));
}
