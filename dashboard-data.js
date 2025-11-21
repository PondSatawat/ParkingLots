//
// 🚀 (ไฟล์แก้ไข) dashboard-data.js (เพิ่ม Firestore Query)
//

// (เพิ่ม) 1. Import 'db' (Firestore) และฟังก์ชันที่จำเป็น
import { db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// (Token Blynk - เหมือนเดิม)
const BLYNK_AUTH_TOKEN = "qZPLAFyNIzZ2HCX9ZdalhEfD4-llTZDS";
const BLYNK_SERVER_URL = "https://blynk.cloud/external/api";

// (ฟังก์ชัน "อ่าน" (Read) จาก Blynk - เหมือนเดิม)
async function getBlynkValue(virtualPin) {
  const url = `${BLYNK_SERVER_URL}/get?token=${BLYNK_AUTH_TOKEN}&${virtualPin}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return parseInt(data); 
    } else {
      console.error(`Blynk API error (GET ${virtualPin}): ${response.statusText}`);
      return -1;
    }
  } catch (error) {
    console.error(`Blynk network error (GET ${virtualPin}):`, error);
    return -1; 
  }
}

// 1. อ้างอิง ID (เหมือนเดิม)
const totalSpotsEl = document.getElementById("total-spots-p");
const availableSpotsEl = document.getElementById("available-spots-p");
const occupiedSpotsEl = document.getElementById("occupied-spots-p");
// (เพิ่ม) 2. อ้างอิง ID ใหม่
const usersTodayEl = document.getElementById("users-today-p");

// 3. (แก้ไข) Pin ที่จะตรวจสอบ (8 ช่อง - เหมือนเดิม)
const PINS_TO_CHECK = [
  "v10", "v11", "v12", "v13", // A1-A4
  "v14", "v15", "v16", "v17"  // B1-B4
];
const totalSpots = PINS_TO_CHECK.length; 

// 4. ฟังก์ชัน (Blynk) (เหมือนเดิม)
async function updateDashboardData() {
  if (!availableSpotsEl) return; 

  const promises = PINS_TO_CHECK.map(pin => getBlynkValue(pin));
  const statuses = await Promise.all(promises);

  let occupiedCount = 0;
  statuses.forEach(status => {
    if (status === 1) { 
      occupiedCount++;
    }
  });
  let availableCount = totalSpots - occupiedCount;

  totalSpotsEl.textContent = totalSpots + " ช่อง";
  availableSpotsEl.textContent = availableCount + " ช่อง";
  occupiedSpotsEl.textContent = occupiedCount + " ช่อง";
}

// 🚀 (แก้ไข) 5. ฟังก์ชันสำหรับ Firestore (นับทั้งเข้าและออก โดยใช้ Timestamp)
async function updateUsageStats() {
  if (!usersTodayEl) return; 

  try {
    const logRef = collection(db, "ParkingLogs");
    
    // 1. สร้างตัวแปรเวลา "เริ่มต้นวัน" (00:00:00) และ "จบวัน" (23:59:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Query 1: คนที่ "เข้า" วันนี้ (เช็คว่า CheckInTime อยู่ระหว่างต้นวันกับจบวัน)
    const qIn = query(logRef, 
      where("CheckInTime", ">=", startOfDay),
      where("CheckInTime", "<=", endOfDay)
    );
    
    // Query 2: คนที่ "ออก" วันนี้ (เช็คว่า CheckOutTime อยู่ระหว่างต้นวันกับจบวัน)
    const qOut = query(logRef, 
      where("CheckOutTime", ">=", startOfDay),
      where("CheckOutTime", "<=", endOfDay)
    );
    
    // ดึงข้อมูลพร้อมกัน
    const [snapIn, snapOut] = await Promise.all([
      getDocs(qIn),
      getDocs(qOut)
    ]);

    // ใช้ Set เพื่อนับจำนวนคน (ไม่ซ้ำ)
    const uniqueUsers = new Set();

    snapIn.forEach(doc => uniqueUsers.add(doc.id));
    snapOut.forEach(doc => uniqueUsers.add(doc.id));

    // แสดงผล
    console.log(`In: ${snapIn.size}, Out: ${snapOut.size}, Unique: ${uniqueUsers.size}`); // (Debug ดูค่าใน Console)
    usersTodayEl.textContent = uniqueUsers.size + " คน";

  } catch (error) {
    console.error("Error fetching usage stats:", error);
    usersTodayEl.textContent = "-"; 
  }
}

// 6. (แก้ไข) เริ่มการทำงาน
document.addEventListener("DOMContentLoaded", () => {
  // (Blynk)
  updateDashboardData(); 
  setInterval(updateDashboardData, 60000); // (Blynk โหลดทุก 5 วิ)

  // (Firestore)
  updateUsageStats();
  setInterval(updateUsageStats, 60000); // (Firestore โหลดทุก 1 นาที (ประหยัด))
});