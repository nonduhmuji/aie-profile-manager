const token = sessionStorage.getItem("token");
const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

if (!token) {
  window.location.replace("/");
} else {
  loadProfile();
}

async function loadProfile() {
  try {
    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load profile");
    }

    const user = await response.json();

    document.getElementById("welcomeUser").textContent =
      `Welcome, ${user.username}!`;

    document.getElementById("profileUsername").value = user.username || "";

    document.getElementById("email").value = user.email || "";

    document.getElementById("phone").value = user.phone || "";

    document.getElementById("dob").value = user.dob
      ? user.dob.slice(0, 10)
      : "";
  } catch (error) {
    showMessage(error.message, "error");
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const dob = document.getElementById("dob").value;

  if (!/^[0-9]+$/.test(phone)) {
    showMessage("Phone number must contain digits only", "error");
    return;
  }

  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, phone, dob }),
    });

    if (!response.ok) {
      throw new Error("Unable to save profile");
    }

    showMessage("Profile updated successfully!", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

function showMessage(message, type) {
  profileMessage.textContent = message;
  profileMessage.className = `message ${type}`;
  profileMessage.hidden = false;
}

document.getElementById("logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem("token");
  window.location.replace("/");
});
