import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useHotel } from "./context/HotelContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAssignments from "./pages/AdminAssignments";
import AdminStaff from "./pages/AdminStaff";
import StaffDashboard from "./pages/StaffDashboard";
import RoomChecklist from "./pages/RoomChecklist";

export default function App() {
  const { loading } = useHotel();
  if (loading) return <div className="app-loading"><span /><p>Preparing Roomly...</p></div>;

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/assignments" element={<ProtectedRoute role="admin"><AdminAssignments /></ProtectedRoute>} />
      <Route path="/dashboard/staff" element={<ProtectedRoute role="admin"><AdminStaff /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute role="room_service"><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/room/:roomId" element={<ProtectedRoute role="room_service"><RoomChecklist /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute({ role, children }) {
  const { user } = useHotel();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/dashboard" : "/staff"} replace />;
  }
  return children;
}
