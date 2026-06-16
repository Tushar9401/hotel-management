import {
  ArrowLeft,
  BedDouble,
  Check,
  CheckCircle2,
  Droplets,
  MapPin,
  PackageCheck,
  PackageSearch,
  MessageSquareText,
  Send,
  Sparkles,
  SprayCan,
  SquareCheckBig,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useHotel } from "../context/HotelContext";
import { checklistItems } from "../data";

const icons = {
  collect_dirty_items: PackageCheck,
  soak_bathroom: Droplets,
  dust_room: Sparkles,
  clean_refreshment_area: SprayCan,
  clean_dresser_tv: Sparkles,
  clean_furniture: Sparkles,
  clean_window_ac: Sparkles,
  clean_bedside_items: Sparkles,
  clean_closet_mirror: SprayCan,
  scrub_bathroom: Droplets,
  disinfect_bathroom_floor: SprayCan,
  replace_bath_amenities: PackageCheck,
  make_beds: BedDouble,
  vacuum_deodorize: SprayCan,
};

export default function RoomChecklist() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { rooms, submitChecklist } = useHotel();
  const room = rooms.find((item) => item.id === roomId);
  const [checked, setChecked] = useState(room?.checklist ?? []);
  const [submitted, setSubmitted] = useState(room?.status === "completed");
  const [itemCounts, setItemCounts] = useState(() =>
    Object.fromEntries(
      (room?.guestItems ?? []).map((item) => [
        item.id,
        item.foundQuantity ?? "",
      ]),
    ),
  );
  const [submitError, setSubmitError] = useState("");
  const [remark, setRemark] = useState(room?.remark ?? "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!room) return;
    setItemCounts((current) =>
      Object.fromEntries(
        (room.guestItems ?? []).map((item) => [
          item.id,
          current[item.id] ?? item.foundQuantity ?? "",
        ]),
      ),
    );
  }, [room]);

  if (!room) return <NavigateBack navigate={navigate} />;

  const toggleItem = (itemId) => {
    setChecked((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const toggleAllItems = () => {
    setChecked((current) =>
      current.length === checklistItems.length
        ? []
        : checklistItems.map((item) => item.id),
    );
  };

  const handleSubmit = async () => {
    const guestItemsComplete = (room.guestItems ?? []).every(
      (item) => itemCounts[item.id] !== "",
    );
    if (checked.length !== checklistItems.length || !guestItemsComplete) return;
    try {
      await submitChecklist(
        room.id,
        checked,
        (room.guestItems ?? []).map((item) => ({
          id: item.id,
          foundQuantity: Number(itemCounts[item.id]),
        })),
        remark,
      );
      setSubmitted(true);
    } catch (requestError) {
      setSubmitError(requestError.message);
    }
  };

  if (submitted) {
    return (
      <AppShell role="staff" title="Room submitted" subtitle="Your work has been recorded successfully.">
        <section className="submission-success panel">
          <span className="success-orb large"><CheckCircle2 size={42} /></span>
          <span className="eyebrow">Checklist complete</span>
          <h2>Room {room.id} is ready</h2>
          <p>The front desk has been notified and can see your submission time.</p>
          <div className="success-details">
            <span><strong>{checklistItems.length} of {checklistItems.length}</strong><small>Tasks complete</small></span>
            <span><strong>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date())}</strong><small>Submitted at</small></span>
          </div>
          <button className="button primary" onClick={() => navigate("/staff")}>
            Back to my rooms
          </button>
        </section>
      </AppShell>
    );
  }

  const progress = (checked.length / checklistItems.length) * 100;
  const guestItems = room.guestItems ?? [];
  const guestItemsComplete = guestItems.every(
    (item) => itemCounts[item.id] !== "",
  );
  const allChecklistItemsSelected = checked.length === checklistItems.length;

  return (
    <AppShell
      role="staff"
      title={`Room ${room.id}`}
      subtitle={`${room.type || "Standard room"} · ${room.floor}`}
    >
      <button className="back-link" onClick={() => navigate("/staff")}>
        <ArrowLeft size={18} /> Back to my rooms
      </button>

      <section className="checklist-layout">
        <div className="checklist-main panel">
          <div className="checklist-heading">
            <div><span className="eyebrow">Room preparation</span><h2>Cleaning checklist</h2><p>Complete every item before submitting this room.</p></div>
            <div className="checklist-heading-actions">
              <button
                className="select-all-button"
                onClick={toggleAllItems}
                type="button"
              >
                <SquareCheckBig size={16} />
                {allChecklistItemsSelected ? "Unselect all" : "Select all"}
              </button>
              <span className="progress-number">{checked.length}/{checklistItems.length}</span>
            </div>
          </div>
          <div className="progress-track large"><i style={{ width: `${progress}%` }} /></div>

          <div className="checklist-items">
            {checklistItems.map((item) => {
              const Icon = icons[item.id];
              const isChecked = checked.includes(item.id);
              return (
                <button
                  className={`checklist-item ${isChecked ? "checked" : ""}`}
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="task-icon"><Icon size={20} /></span>
                  <span className="task-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <span className="checkbox">{isChecked && <Check size={17} strokeWidth={3} />}</span>
                </button>
              );
            })}
          </div>

          {guestItems.length > 0 && (
            <section className="guest-verification">
              <div className="guest-verification-heading">
                <span className="task-icon"><PackageSearch size={20} /></span>
                <div>
                  <h3>Guest items</h3>
                  <p>Count the items left in the room and enter the quantity found.</p>
                </div>
              </div>
              <div className="guest-verification-list">
                {guestItems.map((item) => {
                  const found = itemCounts[item.id];
                  const hasValue = found !== "";
                  const matches =
                    hasValue && Number(found) === item.expectedQuantity;
                  return (
                    <label className="guest-verification-row" key={item.id}>
                      <span>
                        <strong>{item.name}</strong>
                        <small>Expected: {item.expectedQuantity}</small>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={found}
                        placeholder="Found"
                        onChange={(event) =>
                          setItemCounts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                      />
                      {hasValue && (
                        <span className={`quantity-result ${matches ? "match" : "short"}`}>
                          {matches
                            ? "Matched"
                            : Number(found) < item.expectedQuantity
                              ? `${item.expectedQuantity - Number(found)} missing`
                              : `${Number(found) - item.expectedQuantity} extra`}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          <section className="room-remark">
            <div className="guest-verification-heading">
              <span className="task-icon"><MessageSquareText size={20} /></span>
              <div>
                <h3>Room remark</h3>
                <p>Tell the admin about missing items, damage, maintenance, or anything unusual.</p>
              </div>
            </div>
            <textarea
              value={remark}
              maxLength={1000}
              placeholder="Add an optional remark for the admin..."
              onChange={(event) => setRemark(event.target.value)}
            />
            <span className="remark-count">{remark.length}/1000</span>
          </section>

          <button
            className="button primary full submit-button"
            disabled={
              checked.length !== checklistItems.length || !guestItemsComplete
            }
            onClick={handleSubmit}
          >
            <Send size={18} /> Submit room checklist
          </button>
          {checked.length !== checklistItems.length && (
            <p className="submit-help">Complete all {checklistItems.length} tasks to submit this room.</p>
          )}
          {checked.length === checklistItems.length && !guestItemsComplete && (
            <p className="submit-help">Enter the quantity found for every guest item.</p>
          )}
          {submitError && <p className="modal-error">{submitError}</p>}
        </div>

        <aside className="room-detail-card panel">
          <span className={`priority ${room.priority === "Priority" ? "high" : ""}`}>{room.priority}</span>
          <span className="detail-room-label">Room</span>
          <strong className="detail-room-number">{room.id}</strong>
          <span className="detail-type">{room.type || "Standard room"}</span>
          <div className="detail-divider" />
          <div className="detail-line"><MapPin size={18} /><span><small>Location</small><strong>{room.floor}</strong></span></div>
          <div className="arrival-note"><span>Guest arrival</span><strong>{room.guest.replace("Arrival at ", "")}</strong></div>
        </aside>
      </section>
    </AppShell>
  );
}

function NavigateBack({ navigate }) {
  useEffect(() => navigate("/staff"), [navigate]);
  return null;
}
