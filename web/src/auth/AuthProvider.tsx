import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Keycloak from "keycloak-js";
import { configureApi, get } from "../api/client";
import type { Me } from "../api/types";
type AuthState = {
  loading: boolean;
  authenticated: boolean;
  me?: Me;
  error?: string;
  login: () => void;
  logout: () => void;
  can: (permission: string) => boolean;
};
const AuthContext = createContext<AuthState | undefined>(undefined);
const keycloak = new Keycloak({
  url: import.meta.env.VITE_OIDC_URL || "http://localhost:8081",
  realm: import.meta.env.VITE_OIDC_REALM || "invenlio",
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || "invenlio-web",
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [me, setMe] = useState<Me>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let mounted = true;
    configureApi(
      () => keycloak.token,
      () => {
        if (mounted) {
          setAuthenticated(false);
          setMe(undefined);
          setError("Your session expired. Please sign in again.");
        }
      },
    );
    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).catch(() => {
        if (mounted) {
          setAuthenticated(false);
          setMe(undefined);
          setError("Your session expired. Please sign in again.");
        }
      });
    };
    void keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then(async (ok) => {
        if (!mounted) return;
        setAuthenticated(ok);
        if (ok) {
          try {
            setMe(await get<Me>("/me"));
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "Could not load your account.",
            );
          }
        }
      })
      .catch(() => {
        if (mounted)
          setError(
            "Authentication is unavailable. Check your identity provider configuration.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
      keycloak.onTokenExpired = undefined;
    };
  }, []);
  const value = useMemo<AuthState>(
    () => ({
      loading,
      authenticated,
      me,
      error,
      login: () => {
        void keycloak.login({ redirectUri: window.location.href });
      },
      logout: () => {
        void keycloak.logout({ redirectUri: window.location.origin });
      },
      can: (permission) => !!me?.permissions.includes(permission),
    }),
    [loading, authenticated, me, error],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
