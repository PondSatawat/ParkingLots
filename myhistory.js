//
// 🚀 (ไฟล์ใหม่) my-history.js
//
import { auth, db } from "./firebase.js"; // (ดึง auth และ db)
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// 1. รอให้ Auth พร้อม (เช็กว่า User คือใคร)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 2. ถ้าล็อกอินแล้ว ให้ไปดึงประวัติ "ของเขา"
    loadMyHistory(user.uid);
  } else {
    // 3. ถ้าไม่ล็อกอิน ก็ไม่ต้องทำอะไร (dashboard.js จะเตะกลับอยู่แล้ว)
    console.log("User not logged in.");
  }
});

// 4. ฟังก์ชันดึงข้อมูล (ที่กรองแล้ว)
async function loadMyHistory(uid) {
  const tableBody = document.getElementById("my-history-table-body");
  if (!tableBody) return; 

  tableBody.innerHTML = "<tr><td colspan='7'>กำลังโหลดข้อมูล...</td></tr>";

  try {
    //
    // ✅ (นี่คือ "หัวใจหลัก") ✅
    //
    const logRef = collection(db, "ParkingLogs");
    const q = query(logRef, 
      where("UserID", "==", uid),           // 👈 (กรอง) เอาเฉพาะ UserID ของฉัน
      orderBy("CheckInTime", "desc") // 👈 เรียงจากใหม่ไปเก่า
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tableBody.innerHTML = "<tr><td colspan='7'>คุณยังไม่เคยมีประวัติการจอด</td></tr>";
      return;
    }

    let htmlRows = ""; 

    querySnapshot.forEach(doc => {
      const log = doc.data();

      const checkIn = log.CheckInTime ? log.CheckInTime.toDate().toLocaleString("th-TH") : "-";
      const checkOut = log.CheckOutTime ? log.CheckOutTime.toDate().toLocaleString("th-TH") : "-";
      
      let totalHours = "-";
      if (log.CheckInTime && log.CheckOutTime) {
        const diffMs = log.CheckOutTime.toDate() - log.CheckInTime.toDate();
        totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2); 
      }

      // สร้าง HTML (7 คอลัมน์)
      htmlRows += `
        <tr>
          <td data-label="รหัสการเข้า">${doc.id.substring(0, 6)}...</td>
          <td data-label="ป้ายทะเบียน">${log.LicensePlate}</td> 
          <td data-label="เวลาเข้า">${checkIn}</td>
          <td data-label="เวลาออก">${checkOut}</td>
          <td data-label="สถานะ">${log.Status}</td>
          <td data-label="รวมเวลาจอด (ชม.)">${totalHours}</td>
          <td data-label="เงินที่ชำระ">${log.Cost}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = htmlRows;

  } catch (error) {
    console.error("Error loading my history:", error);
    tableBody.innerHTML = `<tr><td colspan='7'>Error: ${error.message}</td></tr>`;
  }
}