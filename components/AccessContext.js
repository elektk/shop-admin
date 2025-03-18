import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

const AccessContext = createContext();

export function AccessProvider({ children }) {
  const { data: session } = useSession();
  const isTestAdmin = session?.user?.role === "test_admin";

  return (
    <AccessContext.Provider value={{ isTestAdmin }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = () => useContext(AccessContext);