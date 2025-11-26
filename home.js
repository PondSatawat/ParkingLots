// (แก้ไข) ลบ rtdb, ref, set ออกจาก import
import { auth, db } from './firebase.js'; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
// (ลบ import 'ref, set' ของ RTDB ทิ้ง)

//
// 🚀 (เพิ่ม 1) ฟังก์ชันสำหรับส่งคำสั่งไปที่ Blynk API
//
const BLYNK_AUTH_TOKEN = "qZPLAFyNIzZ2HCX9ZdalhEfD4-llTZDS";
const BLYNK_SERVER_URL = "https://blynk.cloud/external/api";

async function sendBlynkCommand(virtualPin, value) {
  // (สำคัญ: API ของ Blynk ใช้ v ตัวเล็ก)
  const url = `${BLYNK_SERVER_URL}/update?token=${BLYNK_AUTH_TOKEN}&${virtualPin}=${value}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`Blynk command sent: ${virtualPin} = ${value}`);
    } else {
      console.error(`Blynk API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Blynk network error:", error);
  }
}

// --- อ้างอิง UI Elements (เหมือนเดิม) ---
const loadingStatus = document.getElementById("loading-status");
const notParkedState = document.getElementById("not-parked-state");
const parkedState = document.getElementById("parked-state");
const licenseInput = document.getElementById("licenseInput");
const checkInBtn = document.getElementById("checkInBtn");
const checkinMessage = document.getElementById("checkin-message");
const parkedLicense = document.getElementById("parked-license");
const parkedTime = document.getElementById("parked-time");
const checkOutBtn = document.getElementById("checkOutBtn");
const checkoutMessage = document.getElementById("checkout-message");
const priceDisplay = document.getElementById("price-display");
const finalPrice = document.getElementById("final-price");
const paymentModal = document.getElementById("payment-modal");
const modalPrice = document.getElementById("modal-price");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");

// --- ตัวแปรเก็บสถานะ (เหมือนเดิม) ---
let currentUser = null;
let currentParkingDocId = null; 
let currentParkingData = null; 
let parkingTimerInterval = null;
let calculatedCost = 0;

// --- 2. ตรวจสอบการล็อกอิน (เหมือนเดิม) ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    checkUserParkingStatus(user.uid);
  } else {
    window.location.href = "index.html"; 
  }
});

// --- 3. เช็กสถานะการจอด (เหมือนเดิม) ---
async function checkUserParkingStatus(uid) {
  try {
    const logRef = collection(db, "ParkingLogs");
    const q = query(logRef, 
      where("UserID", "==", uid), 
      where("Status", "==", "จอดอยู่")
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      showNotParkedState();
    } else {
      const doc = querySnapshot.docs[0];
      currentParkingDocId = doc.id;
      currentParkingData = doc.data();
      showParkedState(currentParkingData);
    }
  } catch (error) {
    console.error("Error checking status:", error);
    loadingStatus.textContent = "Error checking status.";
  }
}

// --- 4. แสดงผล UI (เหมือนเดิม) ---
function showNotParkedState() {
  if (parkingTimerInterval) {
    clearInterval(parkingTimerInterval);
  }
  loadingStatus.style.display = "none";
  parkedState.style.display = "none";
  notParkedState.style.display = "block";
  checkinMessage.textContent = "";    
  checkoutMessage.textContent = "";   
  priceDisplay.style.display = "none"; 
}

function showParkedState(data) {
  if (parkingTimerInterval) { 
    clearInterval(parkingTimerInterval);
  }

  loadingStatus.style.display = "none";
  notParkedState.style.display = "none";
  parkedState.style.display = "block";

  parkedLicense.textContent = data.LicensePlate;
  const checkInTime = data.CheckInTime.toDate(); 

  function updateTimer() {
    const now = new Date();
    const diffMs = now - checkInTime; 
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    parkedTime.textContent = `จอดมา ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  updateTimer(); 
  parkingTimerInterval = setInterval(updateTimer, 1000); 

  checkinMessage.textContent = "";    
  checkoutMessage.textContent = "";   
  priceDisplay.style.display = "none"; 
}

//
// 🚀 (แก้ไข 2) จัดการการ "เข้าจอด" (กดปุ่ม Check-in)
//
checkInBtn.addEventListener("click", async () => {
  const plate = licenseInput.value.trim();
  if (!plate) {
    alert("กรุณากรอกป้ายทะเบียน");
    return;
  }
  if (!currentUser) return; 

  checkInBtn.disabled = true;
  checkinMessage.textContent = "กำลังบันทึกข้อมูลและสั่งเปิดประตู...";

  try {
    //
    // 👇 (เพิ่ม 2 บรรทัดนี้) 👇
    //
    // (สร้าง) วันที่ปัจจุบันในรูปแบบ "YYYY-MM-DD" (เช่น "2025-11-13")
    const todayString = new Date().toISOString().split('T')[0]; 
    //
    // 👆 (สิ้นสุดส่วนที่เพิ่ม) 👆
    //
    // (A) บันทึก Log ลง Firestore (เหมือนเดิม)
    await addDoc(collection(db, "ParkingLogs"), {
      UserID: currentUser.uid,
      UserEmail: currentUser.email, 
      LicensePlate: plate,
      CheckInTime: Timestamp.now(), 
      CheckOutTime: null,
      Status: "จอดอยู่",
      Cost: 0
    });
  
    // (B) (แก้ไข) สั่งเปิดประตู (ยิงไป Blynk V0)
    await sendBlynkCommand("v0", 90); // (สั่ง V0/Servo1 ให้ไปที่ 90 องศา)

    checkinMessage.textContent = "บันทึกสำเร็จ ประตูทางเข้าเปิดแล้ว!";
    
    // (เพิ่ม) หน่วงเวลา 2 วินาที แล้วสั่ง "ปิด" ประตู
    setTimeout(async () => {
      await sendBlynkCommand("v0", 0); // (สั่ง V0/Servo1 กลับไป 0 องศา)
    }, 7000); // 2 วินาที

    // (Timeout เดิมสำหรับรีเฟรชหน้า)
    if (parkingTimerInterval) {
      clearInterval(parkingTimerInterval);
    }
    setTimeout(() => {
        checkInBtn.disabled = false;
        checkUserParkingStatus(currentUser.uid);
    }, 2000);

  } catch (error) {
    console.error("Error checking in:", error);
    checkinMessage.textContent = "เกิดข้อผิดพลาด: " + error.message;
    checkInBtn.disabled = false;
  }
});


// --- 6. ปุ่ม "ออก" - (เปิด Modal) (เหมือนเดิม) ---
checkOutBtn.addEventListener("click", async () => {
  if (!currentParkingData) return;
  
  checkoutMessage.textContent = "กำลังคำนวณค่าจอด...";

  const checkInTime = currentParkingData.CheckInTime.toDate();
  const checkOutTime = new Date(); 
  const diffMs = checkOutTime - checkInTime;
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); 
  const ratePerHour = 10;
  calculatedCost = diffHours * ratePerHour; 

  modalPrice.textContent = calculatedCost; 
  paymentModal.style.display = "flex";
  checkoutMessage.textContent = "";
  priceDisplay.style.display = "none";
});


//
// 🚀 (แก้ไข 3) ปุ่ม "โอนเงินเรียบร้อย" (ใน Modal)
//
confirmPaymentBtn.addEventListener("click", async () => {
  if (!currentUser || !currentParkingDocId || !currentParkingData) return;

  confirmPaymentBtn.disabled = true;
  confirmPaymentBtn.textContent = "กำลังตรวจสอบ...";

  try {
    const checkOutTime = new Date(); 

    // (A) อัปเดต Log ใน Firestore (เหมือนเดิม)
    const docRef = doc(db, "ParkingLogs", currentParkingDocId);
    await updateDoc(docRef, {
      CheckOutTime: Timestamp.fromDate(checkOutTime),
      Status: "ออกแล้ว",
      Cost: calculatedCost 
    });

    // (B) (แก้ไข) สั่งเปิดประตูทางออก (ยิงไป Blynk V1)
    await sendBlynkCommand("v1", 0); // (สั่ง V1/Servo2 ให้ไปที่ 90 องศา)

    // (C) แสดงข้อความสุดท้าย และปิด Modal (เหมือนเดิม)
    checkoutMessage.textContent = `ชำระ ${calculatedCost} บาทเรียบร้อย ประตูเปิดแล้ว!`;
    paymentModal.style.display = "none"; 

    // (D) หยุด Timer และรีเฟรชหน้า (เหมือนเดิม)
    if (parkingTimerInterval) {
      clearInterval(parkingTimerInterval);
    }
    
    // (เพิ่ม) หน่วงเวลา 2 วินาที แล้วสั่ง "ปิด" ประตู
    setTimeout(async () => {
      await sendBlynkCommand("v1", 90); // (สั่ง V1/Servo2 กลับไป 0 องศา)
    }, 7000); // 2 วินาที
    
    // (Timeout เดิมสำหรับรีเฟรชหน้า)
    setTimeout(() => {
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.textContent = "✅ โอนเงินเรียบร้อย (กดยืนยันเพื่อเปิดประตู)";
      checkUserParkingStatus(currentUser.uid); 
    }, 3000); 

  } catch (error) {
    console.error("Error confirming payment:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = "✅ โอนเงินเรียบร้อย (กดยืนยันเพื่อเปิดประตู)";
  }
});


// --- 8. ปุ่ม "ยกเลิก" (ใน Modal) (เหมือนเดิม) ---
cancelPaymentBtn.addEventListener("click", () => {
  paymentModal.style.display = "none";
});