import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const userNameDisplay = document.getElementById("userName");
const logoutBtn = document.querySelector(".logout-btn"); // หาจาก class
const userManagementNav = document.getElementById("user-management-nav");

// 👇 (เพิ่มใหม่) ส่วนจัดการ Hamburger Menu อัตโนมัติ
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector("nav.navbar");
  const navLinks = document.querySelector(".nav-links");

  // สร้างปุ่ม Hamburger ถ้ายังไม่มี
  if (navbar && !document.querySelector(".hamburger")) {
    const hamburger = document.createElement("div");
    hamburger.className = "hamburger";
    hamburger.innerHTML = "☰"; // ไอคอนสามขีด
    
    // ใส่ปุ่มเข้าไปใน Navbar
    navbar.appendChild(hamburger);

    // สั่งให้คลิกแล้วเปิด/ปิดเมนู
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-show");
    });
  }
});

// ซ่อนลิงก์ User Management ไว้ก่อน
if (userManagementNav) {
  userManagementNav.style.display = "none";
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(docRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      if (userNameDisplay) {
        userNameDisplay.textContent = userData.email + " (" + userData.role + ")";
      }
      
      // Logic ซ่อน/แสดงลิงก์ Admin
      if (userData.role === "admin") {
        if (userManagementNav) {
          userManagementNav.style.display = "list-item"; 
        }
      } else {
        if (userManagementNav) {
          userManagementNav.style.display = "none";
        }
      }

      // Logic ป้องกันการเข้าหน้าโดยตรง
      if (window.location.pathname.includes("user.html")) {
        if (userData.role !== "admin") {
          alert("You do not have permission to access this page.");
          window.location.href = "home.html";
        }
      }
    }
  } else {
    // Redirect ถ้าไม่ล็อกอิน
    if (!window.location.pathname.includes("index.html") && !window.location.pathname.includes("register.html")) {
      window.location.href = "index.html";
    }
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}