/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import * as auth from "../services/mockAuth.js";
import { subscribeToCollections } from "../services/collectionEvents.js";

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

/**
 * Applies authentication lifecycle actions to the shared auth state.
 *
 * @param {object} state Current authentication state.
 * @param {{ type: string, payload?: unknown }} action Auth action dispatched by provider helpers.
 * @returns {object} Updated authentication state.
 */
function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        error: null,
        loading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
        loading: false,
      };
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    case "REGISTER":
      return { ...state, loading: false, error: null };
    case "RESTORE": {
      const user = action.payload;
      if (!state.loading && JSON.stringify(state.user) === JSON.stringify(user)) {
        return state;
      }
      return {
        ...state,
        isAuthenticated: !!user,
        user,
        loading: false,
        error: null,
      };
    }
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Provides restored session state and stable auth helpers to route guards and pages.
 * The context value is memoized so unrelated provider renders do not churn consumers.
 *
 * @param {{ children: import("react").ReactNode }} props Provider props.
 * @returns {import("react").ReactElement} Auth context provider.
 */
function AuthProvider({ children }) {
  // Keep all auth flags and helper-visible user data in one reducer-backed state object.
  const [{ isAuthenticated, user, error, loading }, dispatch] = useReducer(
    authReducer,
    initialState
  );

  // Account edits and session changes must immediately refresh route permissions in every tab.
  useEffect(() => {
    const restore = () => dispatch({ type: "RESTORE", payload: auth.restoreSession() });
    const unsubscribe = subscribeToCollections(
      ["studio_users", "studio_user", "studio_token"],
      restore
    );
    restore();
    return unsubscribe;
  }, []);

  /**
   * Attempts sign-in with an email or username and stores the returned user on success.
   *
   * @param {string} identifier Email address or username.
   * @param {string} password Plain-text password used by the mock auth service.
   * @returns {Promise<object>} Mock auth result with success status and optional user/message.
   */
  const login = useCallback(async (identifier, password) => {
    dispatch({ type: "LOADING" });
    try {
      const result = await auth.login(identifier, password);
      if (!result.success) {
        dispatch({ type: "ERROR", payload: result.message });
        return result;
      }
      dispatch({ type: "LOGIN", payload: result.user });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log in.";
      dispatch({ type: "ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Creates a new mock user account without automatically signing them in.
   *
   * @param {object} data Registration form values consumed by the mock auth service.
   * @returns {Promise<object>} Registration result with success status and optional message.
   */
  const register = useCallback(async (data) => {
    dispatch({ type: "LOADING" });
    try {
      const result = await auth.registerNewUser(data);
      if (!result.success) {
        dispatch({ type: "ERROR", payload: result.message });
        return result;
      }
      dispatch({ type: "REGISTER" });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register user.";
      dispatch({ type: "ERROR", payload: message });
      return { success: false, message };
    }
  }, []);

  /**
   * Clears the persisted mock session and resets auth state.
   *
   * @returns {void}
   */
  const logout = useCallback(() => {
    auth.logout();
    dispatch({ type: "LOGOUT" });
  }, []);

  // Keep the provider object stable unless auth state or helper identities actually change.
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      error,
      loading,
      login,
      logout,
      register,
    }),
    [error, isAuthenticated, loading, login, logout, register, user]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Reads the auth context and enforces provider usage for callers.
 *
 * @returns {object} Auth state and helper functions.
 */
function useAuth() {
  // Read from the nearest AuthProvider so pages and guards share the same auth session.
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
export { AuthProvider, useAuth };
