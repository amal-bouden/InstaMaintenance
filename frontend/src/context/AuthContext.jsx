import { useState } from "react";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const loginUser = (tokenData) => {
    localStorage.setItem("token", tokenData.access_token);
    localStorage.setItem("user", JSON.stringify({
      username: tokenData.username,
      role:     tokenData.role,
      section:  tokenData.section,
    }));
    setUser({
      username: tokenData.username,
      role:     tokenData.role,
      section:  tokenData.section,
    });
  };

  const logoutUser = () => {
    localStorage.clear();
    setUser(null);
  };

    return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
