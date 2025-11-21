//
// 🚀 (ไฟล์แก้ไข) parking-status.js (เวอร์ชัน Mapping ชัดเจน)
//
import { rtdb } from "./firebase.js";

// (Token Blynk - ต้องตรงกับ ESP32)
const BLYNK_AUTH_TOKEN = "qZPLAFyNIzZ2HCX9ZdalhEfD4-llTZDS";
const BLYNK_SERVER_URL = "https://blynk.cloud/external/api";

// (ฟังก์ชัน "อ่าน" (Read) จาก Blynk - เหมือนเดิม)
async function getBlynkValue(virtualPin) {
  // (ใช้ v ตัวเล็ก)
  const url = `${BLYNK_SERVER_URL}/get?token=${BLYNK_AUTH_TOKEN}&${virtualPin}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return parseInt(data); // 👈 คืนค่าเป็นตัวเลข (0 หรือ 1)
    } else {
      console.error(`Blynk API error (GET ${virtualPin}): ${response.statusText}`);
      return -1; // คืนค่า Error
    }
  } catch (error) {
    console.error(`Blynk network error (GET ${virtualPin}):`, error);
    return -1; // คืนค่า Error
  }
}

// อ้างอิง div ที่จะแสดงผล
const parkingGrid = document.getElementById("parkingGrid");

//
// 👇 (แก้ไขจุดที่ 1) กำหนดค่าที่จอดทั้งหมดที่นี่! 👇
//
const SLOT_MAPPING = {
  // "ชื่อช่องจอด": "Virtual Pin (v เล็ก)"
  "A1": "v10", // 👈 (ESP32: i=0)
  "A2": "v11", // 👈 (ESP32: i=1)
  "A3": "v12", // 👈 (ESP32: i=2)
  "A4": "v13", // 👈 (ESP32: i=3)
  "B1": "v14", // 👈 (ESP32: i=4)
  "B2": "v15", // 👈 (ESP32: i=5)
  "B3": "v16", // 👈 (ESP32: i=6)
  "B4": "v17"   // 👈 (ESP32: i=7)
};
// 👆 (สิ้นสุดการตั้งค่า) 👆
//

// (ดึงชื่อช่องจอด และ Pin ออกมาจาก Object)
const allSlots = Object.keys(SLOT_MAPPING);     // -> ["A1", "A2", "A3", ...]
const allPins = Object.values(SLOT_MAPPING);  // -> ["v10", "v11", "v12", ...]

//
// (แก้ไข) 2. ฟังก์ชันหลัก (สำหรับ Poll)
//
async function updateParkingGrid() {
  if (!parkingGrid) return;
  
  // (สร้าง Array "Promises" จาก 'allPins')
  const promises = allPins.map(pin => getBlynkValue(pin));

  // (รอให้ Blynk ตอบกลับมาทั้งหมด)
  const statuses = await Promise.all(promises);
  // (statuses จะเป็น [0, 1, 1, 0, -1, -1, -1, -1] (ตัวอย่าง))

  // (เคลียร์) ล้างช่องจอดเก่า
  parkingGrid.innerHTML = "";

  // (วาดใหม่) (วนลูปจาก 'allSlots')
  allSlots.forEach((slotName, index) => {
    const div = document.createElement("div");
    
    // (จับคู่) ชื่อช่องจอด (index 0) กับ สถานะ (index 0)
    const status = statuses[index];

    if (status === 1) {
      // (A) จอดอยู่
      div.className = "slot occupied";
      div.innerHTML = `<span>${slotName}</span><br><span>จอดอยู่</span>`;
    } else if (status === 0) {
      // (B) ว่าง
      div.className = "slot available";
      div.innerHTML = `<span>${slotName}</span><br><span>ว่าง</span>`;
    } else {
      // (C) Error หรือ Offline
      div.className = "slot offline";
      div.innerHTML = `<span>${slotName}</span><br><span>(Offline)</span>`;
    }
    
    parkingGrid.appendChild(div);
  });
}

//
// 3. (แก้ไข) เริ่มการทำงาน
//
document.addEventListener("DOMContentLoaded", () => {
  updateParkingGrid(); // 👈 (โหลดครั้งแรก)
  
  // (สั่งให้โหลดใหม่ทุก 5 วินาที (Polling))
  setInterval(updateParkingGrid,1000);
});