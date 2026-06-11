export const staffMembers = [
  { id: "staff-1", name: "Maya Patel", initials: "MP", shift: "Morning shift" },
  { id: "staff-2", name: "Daniel Kim", initials: "DK", shift: "Morning shift" },
  { id: "staff-3", name: "Sofia Reed", initials: "SR", shift: "Evening shift" },
];

export const checklistItems = [
  {
    id: "collect_dirty_items",
    label: "Collect dirty towels and bathroom trash",
    detail: "Bag them inside the guest room before taking them to the cart.",
  },
  {
    id: "soak_bathroom",
    label: "Soak bathroom",
    detail: "Apply the required cleaning solution and allow it to soak.",
  },
  {
    id: "dust_room",
    label: "Dust the room",
    detail: "Dust all accessible surfaces throughout the guest room.",
  },
  {
    id: "clean_refreshment_area",
    label: "Clean microwave, refrigerator and coffee area",
    detail: "Clean and sanitize all appliances and refreshment surfaces.",
  },
  {
    id: "clean_dresser_tv",
    label: "Clean dresser and TV",
    detail: "Wipe the dresser, television and surrounding surfaces.",
  },
  {
    id: "clean_furniture",
    label: "Clean desk, tables and seating",
    detail: "Wipe and arrange the desk, tables, chairs and other seating.",
  },
  {
    id: "clean_window_ac",
    label: "Clean window coverings and AC",
    detail: "Dust the window coverings and clean the air-conditioning unit.",
  },
  {
    id: "clean_bedside_items",
    label: "Clean nightstand, phone, clock and lighting",
    detail: "Wipe and arrange all bedside surfaces and equipment.",
  },
  {
    id: "clean_closet_mirror",
    label: "Clean closet and mirror",
    detail: "Clean the closet area and leave the mirror streak-free.",
  },
  {
    id: "scrub_bathroom",
    label: "Scrub, rinse and dry bathroom",
    detail: "Thoroughly clean and dry all bathroom fixtures and surfaces.",
  },
  {
    id: "disinfect_bathroom_floor",
    label: "Sweep and disinfect bathroom floor",
    detail: "Remove debris, disinfect the floor and allow it to dry.",
  },
  {
    id: "replace_bath_amenities",
    label: "Replace bath amenities",
    detail: "Restock the required toiletries, tissue and bathroom supplies.",
  },
  {
    id: "make_beds",
    label: "Make bed(s)",
    detail: "Replace the linen and neatly prepare every bed.",
  },
  {
    id: "vacuum_deodorize",
    label: "Vacuum and deodorize",
    detail: "Vacuum the room thoroughly and leave it fresh.",
  },
];

export const completedChecklist = checklistItems.map((item) => item.id);

const minutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const initialRooms = [
  {
    id: "201",
    type: "Deluxe King",
    floor: "2nd Floor",
    status: "assigned",
    assignedTo: "staff-1",
    assignedAt: minutesAgo(18),
    due: "10:30 AM",
    priority: "Priority",
    guest: "Arrival at 12:00 PM",
  },
  {
    id: "305",
    type: "Executive Suite",
    floor: "3rd Floor",
    status: "assigned",
    assignedTo: "staff-1",
    assignedAt: minutesAgo(8),
    due: "11:15 AM",
    priority: "Standard",
    guest: "Arrival at 2:00 PM",
  },
  {
    id: "412",
    type: "Twin Room",
    floor: "4th Floor",
    status: "completed",
    assignedTo: "staff-2",
    assignedAt: minutesAgo(95),
    submittedAt: minutesAgo(22),
    due: "10:00 AM",
    priority: "Standard",
    guest: "Stayover service",
    checklist: completedChecklist,
  },
  {
    id: "118",
    type: "Queen Room",
    floor: "1st Floor",
    status: "available",
    assignedTo: null,
    due: "12:00 PM",
    priority: "Standard",
    guest: "Arrival at 3:00 PM",
  },
  {
    id: "207",
    type: "Deluxe Twin",
    floor: "2nd Floor",
    status: "available",
    assignedTo: null,
    due: "12:30 PM",
    priority: "Standard",
    guest: "Arrival at 4:00 PM",
  },
  {
    id: "309",
    type: "King Room",
    floor: "3rd Floor",
    status: "completed",
    assignedTo: "staff-3",
    assignedAt: minutesAgo(180),
    submittedAt: minutesAgo(64),
    due: "9:30 AM",
    priority: "Standard",
    guest: "Stayover service",
    checklist: completedChecklist,
  },
];
