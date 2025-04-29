// We initialize Supabase in the HTML now, so just make sure functions are defined
// Supabase client is available as the global 'supabase' variable

// Check if user is already logged in and redirect if needed
async function checkUser() {
  try {
    // Get the current session instead of direct user fetch
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return;
    }

    console.log("Current session check:", data);

    // Check if there's an active session with a valid user
    if (data && data.session && data.session.user) {
      console.log("User is logged in:", data.session.user.email);
      // User is logged in
      if (window.location.pathname.includes("logindex.html")) {
        console.log("Redirecting to index.html");
        window.location.href = "index.html";
      }
    } else {
      console.log("No active user session");
      // No active session, user is not logged in
      if (!window.location.pathname.includes("logindex.html")) {
        console.log("Redirecting to logindex.html");
        window.location.href = "logindex.html";
      }
    }
  } catch (error) {
    console.error("Error checking user:", error);
  }
}

// Authentication functions
async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    console.log("Sign in response:", data, error);

    if (error) {
      console.error(error.message);
      // Show login error popup
      document.getElementById("overlay").classList.add("show");
      document.getElementById("login-error-popup").classList.add("show");
      return false;
    }

    window.location.href = "index.html";
    return true;
  } catch (error) {
    console.error("Sign in error:", error);
    // Show login error popup for unexpected errors too
    document.getElementById("overlay").classList.add("show");
    document.getElementById("login-error-popup").classList.add("show");
    return false;
  }
}

// Sign up function
async function signUpWithEmail(email, password, name) {
  console.log(
    "signUpWithEmail function called, but using direct implementation in the HTML"
  );
}

// Logout function
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return false;
    }

    console.log("User signed out successfully");
    window.location.href = "logindex.html";
    return true;
  } catch (error) {
    console.error("Unexpected error during sign out:", error);
    return false;
  }
}
