import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { getRoleHomePath } from "../services/roleRoutes.js";

import styles from "./Login.module.css";
import Button from "../components/Button";
import hidePW from "../assets/hidePW.png";
import showPW from "../assets/showPW.png";

/**
 * Renders the login form and sends successful users to their role home page.
 *
 * @returns {import("react").ReactElement} Login page.
 */
function Login() {
  // Track the credential identifier exactly as entered so mock auth can accept email or username.
  const [identifier, setIdentifier] = useState("");
  // Keep password local to the form and submit it only through the auth context helper.
  const [password, setPassword] = useState("");
  // Toggle the password input type without altering the stored password value.
  const [showPassword, setShowPassword] = useState(false);

  // Pull auth state from context so login errors and loading state stay consistent app-wide.
  const { login, error, loading, isAuthenticated, user } = useAuth();

  /**
   * Stores the submitted email or username text in local form state.
   *
   * @param {import("react").ChangeEvent<HTMLInputElement>} e Identifier input change event.
   * @returns {void}
   */
  function handleIdentifierChange(e) {
    setIdentifier(e.target.value);
  }

  /**
   * Stores the submitted password text in local form state.
   *
   * @param {import("react").ChangeEvent<HTMLInputElement>} e Password input change event.
   * @returns {void}
   */
  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  /**
   * Switches the password field between masked and visible display.
   *
   * @returns {void}
   */
  function handleTogglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  /**
   * Authenticates submitted credentials and redirects according to the returned role.
   *
   * @param {import("react").FormEvent<HTMLFormElement>} e Form submit event.
   * @returns {Promise<void>}
   */
  async function handleSubmit(e) {
    e.preventDefault();

    await login(identifier, password);
  }

  // Includes restored sessions and logins made in another tab while this page is open.
  if (!loading && isAuthenticated) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }

  return (
    <main className={styles.login}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          {error && (
            <strong>
              <p className={styles.error}>*{error}</p>
            </strong>
          )}
          <input
            className={styles.input}
            type="text"
            id="identifier"
            name="identifier"
            placeholder=" Email or Username"
            value={identifier}
            onChange={handleIdentifierChange}
            autoComplete="off"
          />
        </div>
        <div className={styles.row}>
          <input
            className={styles.input}
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder=" Password"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="off"
          />

          {password && (
            <img
              className={styles.icon}
              src={showPassword ? showPW : hidePW}
              onClick={handleTogglePasswordVisibility}
            />
          )}
        </div>
        <div className={styles.button}>
          <Button
            text={loading ? "Logging in ..." : "Login"}
            type="submit"
            disabled={loading || !identifier || !password}
          />
        </div>
      </form>
    </main>
  );
}

export default Login;
