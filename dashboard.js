import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const userNameDisplay = document.getElementById("userName");
const logoutBtn = document.querySelector(".logout-btn"); // (แก้) หาจาก class

// 👇 (1. เพิ่ม) หาลิงก์ User Management
const userManagementNav = document.getElementById("user-management-nav");

// 👇 (2. เพิ่ม) ซ่อนลิงก์ไว้ก่อนเป็นค่าเริ่มต้น
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
      
      // 👇 (3. เพิ่ม) Logic ซ่อน/แสดงลิงก์
      if (userData.role === "admin") {
        // ถ้าเป็น Admin ให้ "แสดง"
        if (userManagementNav) {
          userManagementNav.style.display = "list-item"; // (หรือ 'inline-block' ขึ้นอยู่กับ CSS ของ .nav-links)
        }
      } else {
        // ถ้าเป็น User ทั่วไป ให้ "ซ่อน" (ซึ่งซ่อนอยู่แล้ว แต่กันเหนียว)
        if (userManagementNav) {
          userManagementNav.style.display = "none";
        }
      }

      // 👇 (4. เพิ่ม) Logic ป้องกันการเข้าหน้าโดยตรง
      // (เช็กว่าเรากำลังอยู่ที่หน้า user.html หรือไม่)
      if (window.location.pathname.includes("user.html")) {
        // ถ้า "ใช่" และ User "ไม่ใช่" Admin
        if (userData.role !== "admin") {
          // เตะกลับไปหน้า Home
          alert("You do not have permission to access this page.");
          window.location.href = "home.html";
        }
      }
    }
  } else {
    // (Redirect ถ้าไม่ล็อกอิน)
    if (!window.location.pathname.includes("index.html") && !window.location.pathname.includes("register.html")) {
      window.location.href = "index.html";
    }
  }
});

// (โค้ด Logout เหมือนเดิม)
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}