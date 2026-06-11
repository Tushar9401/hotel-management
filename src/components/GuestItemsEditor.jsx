import { PackagePlus, Plus, Trash2 } from "lucide-react";
import React from "react";

export default function GuestItemsEditor({ items, setItems }) {
  return (
    <div className="guest-items-editor">
      <div className="guest-items-editor-head">
        <div>
          <span>Guest-issued items</span>
          <small>Items room service must count during checkout cleaning.</small>
        </div>
        <button
          type="button"
          className="button text-button"
          onClick={() =>
            setItems((current) => [
              ...current,
              { name: "", expectedQuantity: 1 },
            ])
          }
        >
          <Plus size={15} /> Add item
        </button>
      </div>
      {items.length ? (
        <div className="guest-item-rows">
          {items.map((item, index) => (
            <div className="guest-item-row" key={index}>
              <PackagePlus size={18} />
              <input
                value={item.name}
                placeholder="Item name, e.g. Towel"
                onChange={(event) =>
                  setItems((current) =>
                    current.map((currentItem, itemIndex) =>
                      itemIndex === index
                        ? { ...currentItem, name: event.target.value }
                        : currentItem,
                    ),
                  )
                }
              />
              <input
                className="quantity-input"
                type="number"
                min="1"
                value={item.expectedQuantity}
                aria-label={`Expected quantity for item ${index + 1}`}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((currentItem, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...currentItem,
                            expectedQuantity: event.target.value,
                          }
                        : currentItem,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="icon-button remove-item"
                onClick={() =>
                  setItems((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="guest-items-empty">No guest items added.</div>
      )}
    </div>
  );
}
