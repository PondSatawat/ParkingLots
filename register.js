import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const registerBtn = document.getElementById("registerBtn");
const message = document.getElementById("message");

registerBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "Error: Passwords do not match.";
    return;
  }


  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      createdAt: new Date().toISOString(),
      role: "user"
    });
    message.style.color = "green";
    message.textContent = "Register successful! Redirecting...";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    message.textContent = "Error: " + err.message;
  }
});
