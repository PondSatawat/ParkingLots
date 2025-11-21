//
// 🚀 (ไฟล์ใหม่) user.js
//
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// รอให้หน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", () => {
  loadParkingLogs();
});

async function loadParkingLogs() {
  const tableBody = document.getElementById("logs-table-body");
  if (!tableBody) return; // ถ้าหาตารางไม่เจอ

  tableBody.innerHTML = "<tr><td colspan='7'>กำลังโหลดข้อมูล...</td></tr>";

  try {
    // 1. ดึงข้อมูลผู้ใช้ทั้งหมด (ถ้าต้องการแสดงชื่อ)
    // (ข้ามไปก่อน, ใช้ Email ที่เราเก็บใน Log)

    // 2. ดึงข้อมูล ParkingLogs ทั้งหมด (เรียงตามเวลาเข้า)
    const logRef = collection(db, "ParkingLogs");
    const q = query(logRef, orderBy("CheckInTime", "desc")); // 👈 เรียงจากใหม่ไปเก่า
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tableBody.innerHTML = "<tr><td colspan='7'>ไม่พบประวัติการจอด</td></tr>";
      return;
    }

    let htmlRows = ""; // 👈 เตรียมสร้างแถวในตาราง

    querySnapshot.forEach(doc => {
      const log = doc.data();

      // 3. จัดการข้อมูล (แปลง Timestamp เป็นวันที่อ่านง่าย)
      const checkIn = log.CheckInTime ? log.CheckInTime.toDate().toLocaleString("th-TH") : "-";
      const checkOut = log.CheckOutTime ? log.CheckOutTime.toDate().toLocaleString("th-TH") : "-";
      
      // คำนวณเวลารวม (ถ้ามีเวลาออก)
      let totalHours = "-";
      if (log.CheckInTime && log.CheckOutTime) {
        const diffMs = log.CheckOutTime.toDate() - log.CheckInTime.toDate();
        totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2); // 👈 ทศนิยม 2 ตำแหน่ง
      }

      // 4. สร้าง HTML สำหรับ 1 แถว
      htmlRows += `
        <tr>
          <td>${doc.id.substring(0, 6)}...</td> <td>${log.UserEmail || log.UserID.substring(0, 8)}</td> <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${log.Status}</td>
          <td>${totalHours}</td>
          <td>${log.Cost}</td>
        </tr>
      `;
    });

    // 5. ยัด HTML กลับเข้าไปในตาราง
    tableBody.innerHTML = htmlRows;

  } catch (error) {
    console.error("Error loading logs:", error);
    tableBody.innerHTML = `<tr><td colspan='7'>Error: ${error.message}</td></tr>`;
  }
}