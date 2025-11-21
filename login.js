import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");
const forgotPass = document.getElementById("forgotPass");
const message = document.getElementById("message");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    message.style.color = "green";
    message.textContent = "Login successful!";
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);
  } catch (err) {
    message.textContent = "Error: " + err.message;
  }
});

forgotPass.addEventListener("click", async () => {
  const email = prompt("Enter your email to reset password:");
  if (email) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent to your email.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
});