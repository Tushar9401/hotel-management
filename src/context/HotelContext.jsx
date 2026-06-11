import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest, ensureCsrfCookie } from "../api";

const HotelContext = createContext(null);

export function HotelProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const roomResponse = await apiRequest("/rooms/");
    setRooms(roomResponse.rooms);
    if (currentUser.role === "admin") {
      const staffResponse = await apiRequest("/staff/");
      setStaffMembers(staffResponse.staff);
    } else {
      setStaffMembers([]);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await ensureCsrfCookie();
        const { user: authenticatedUser } = await apiRequest("/auth/me/");
        await loadData(authenticatedUser);
        setUser(authenticatedUser);
      } catch (requestError) {
        if (requestError.status !== 401) setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [loadData]);

  useEffect(() => {
    if (!user) return undefined;
    const interval = window.setInterval(() => {
      loadData(user).catch(() => {});
    }, 10000);
    return () => window.clearInterval(interval);
  }, [loadData, user]);

  const login = useCallback(async (username, password) => {
    setError("");
    const { user: authenticatedUser } = await apiRequest("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    await loadData(authenticatedUser);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, [loadData]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout/", { method: "POST" });
    } finally {
      setUser(null);
      setRooms([]);
      setStaffMembers([]);
    }
  }, []);

  const assignRoom = useCallback(async (roomId, staffId) => {
    const { room } = await apiRequest(`/rooms/${roomId}/assign/`, {
      method: "POST",
      body: JSON.stringify({ staffId }),
    });
    setRooms((current) =>
      current.map((item) => (item.id === room.id ? room : item)),
    );
    return room;
  }, []);

  const updateGuestItems = useCallback(async (roomId, guestItems) => {
    const { room } = await apiRequest(`/rooms/${roomId}/guest-items/`, {
      method: "POST",
      body: JSON.stringify({ guestItems }),
    });
    setRooms((current) =>
      current.map((item) => (item.id === room.id ? room : item)),
    );
    return room;
  }, []);

  const resolveRoomAttention = useCallback(async (roomId) => {
    const { room } = await apiRequest(
      `/rooms/${roomId}/resolve-attention/`,
      { method: "POST" },
    );
    setRooms((current) =>
      current.map((item) => (item.id === room.id ? room : item)),
    );
    return room;
  }, []);

  const submitChecklist = useCallback(async (
    roomId,
    checklist,
    guestItems = [],
    remark = "",
  ) => {
    const { room } = await apiRequest(`/rooms/${roomId}/submit/`, {
      method: "POST",
      body: JSON.stringify({ checklist, guestItems, remark }),
    });
    setRooms((current) =>
      current.map((item) => (item.id === room.id ? room : item)),
    );
    return room;
  }, []);

  const value = useMemo(
    () => ({
      user,
      rooms,
      staffMembers,
      loading,
      error,
      login,
      logout,
      assignRoom,
      updateGuestItems,
      resolveRoomAttention,
      submitChecklist,
    }),
    [
      user,
      rooms,
      staffMembers,
      loading,
      error,
      login,
      logout,
      assignRoom,
      updateGuestItems,
      resolveRoomAttention,
      submitChecklist,
    ],
  );

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

export function useHotel() {
  const context = useContext(HotelContext);
  if (!context) throw new Error("useHotel must be used within HotelProvider");
  return context;
}
