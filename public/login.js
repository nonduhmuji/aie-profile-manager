// Get the login form and error message elements
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

// Listen for the user submitting the login form
loginForm.addEventListener("submit", async (event) => {
  // Prevent the browser from refreshing the page
  event.preventDefault();

  // Retrieve the username and password entered by the user
  const username = document.getElementById("username").value.trim();

  const password = document.getElementById("password").value;

  // Hide any previous error message
  errorMessage.hidden = true;

  try {
    // Send login credentials to the backend for verification
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    // Convert the server response into a JavaScript object
    const data = await response.json();

    // Display an error if authentication is unsuccessful
    if (!response.ok) {
      throw new Error(data.message || "Incorrect username or password");
    }

    // Store the authentication token for the current browser tab
    sessionStorage.setItem("token", data.token);

    // Redirect the user to their profile page
    window.location.href = "/profile.html";
  } catch (error) {
    // Display login or connection errors
    errorMessage.textContent = error.message;
    errorMessage.className = "message error";
    errorMessage.hidden = false;
  }
});
