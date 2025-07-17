const ACCESS_TOKEN = localStorage.getItem("ACCESS_TOKEN")
  ? `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`
  : "";
const USER_PHONE = localStorage.getItem("userphone")
  ? localStorage.getItem("userphone")
  : "";
const RESPONCE_STSTUS = localStorage.getItem("RESPONCE_STSTUS")
  ? localStorage.getItem("RESPONCE_STSTUS")
  : "";
if (ACCESS_TOKEN == "" || USER_PHONE == "" || RESPONCE_STSTUS != 200) {
  window.location.href = "https://gatah-admin.alowairdi.com/login.html";
}
const URL = "https://darkgrey-viper-985923.hostingersite.com/api/v1/admin/";

let bill_requesets = [];
let gatah_requesets = [];
let tickets = [];
let counter = 0;
let title = "";

async function getDataRequeset(type) {
  const response = await fetch(`${URL}${type}`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      Authorization: ACCESS_TOKEN,
    },
  });
  console.log(response.status);
  if (response.status == 401 || response.status == 403) {
    window.location.href = "https://gatah-admin.alowairdi.com/login.html";
  }
  let data = await response.json();

  return data.data;
}
function formatDate(data) {
  const date = new Date(data);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // month is 0-based
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const formattedDate = `${day}-${month}-${year}       ${hours}:${minutes}`;
  return formattedDate;
}

async function approveRequest(gatah_id, card) {
  let ticket_type = card.id[0] == "g" ? "approve-gatah" : "pay-bill";
  const response = await fetch(`${URL}${ticket_type}/${gatah_id}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: ACCESS_TOKEN,
    },
  });
  if (response.ok) {
    const card_const = document.getElementById(card.id);
    if (card_const) {
      // أضف كلاس الفيد أوت
      card_const.classList.add("fadeout");

      // بعد انتهاء الأنيميشن أخفِ العنصر تمامًا أو أزِله
      card_const.addEventListener(
        "animationend",
        () => {
          card_const.remove(); // أو card_const.remove();
        },
        { once: true }
      );
      counter--;
      if (counter == 0) {
        let container = document.getElementById("container");

        container.innerHTML = `<span class="message">لا يوجد طلبات</span>`;
        container.classList.add("container_message");
      }
    }
  }
}

async function loader() {
  let container = document.getElementById("container");
  let HTML_content = "";
  let approve_button = "";
  let ticket_id = "";
  document.getElementById("container").innerHTML = "";
  bill_requesets = await getDataRequeset("bill-request");
  gatah_requesets = await getDataRequeset("gatah-request");
  tickets = bill_requesets.concat(gatah_requesets);

  tickets.forEach((ticket) => {
    let formated_date = formatDate(ticket.created_at);

    if (ticket.bill) {
      title = "فاتورة";
      ticket_id = `bill${ticket.id}`;
      approve_button = `
        <div class="card-footer">
                <button type="button" class="approve-btn"  onClick="approveRequest(${ticket.bill_id},${ticket_id})">تأكيد</button>
            </div>`;
    } else {
      title = "قطة";
      ticket_id = `gatah${ticket.id}`;
      approve_button = `
        <div class="card-footer">
                <button type="button" class="approve-btn"  onClick="approveRequest(${ticket.gatah_id},${ticket_id})">تأكيد</button>
            </div>`;
    }

    if (ticket.status != "approved") {
      counter++;
      container.innerHTML += `
        <div class="card" id="${ticket_id}">
            <div class="card-header">
            <span class="user-name">${title}</span>
            <span class="date">${formated_date}</span>
            </div>
            <div class="card-body">
                <p> ${ticket.user_name}</p>
                <p>المبلغ: ${ticket.price}</p>
                <p>الحالة: ${
                  ticket.status == "review" ? "غير مأكدة" : "مأكدة"
                }</p>
            </div>
            
                ${approve_button}
        </div>
    `;
    }
  });
  if (counter == 0) {
    container.innerHTML = `<span class="message">لا يوجد طلبات</span>`;
    container.classList.add("container_message");
  }
}
function logout() {
  console.log("logout()");

  localStorage.removeItem("ACCESS_TOKEN");
  localStorage.removeItem("userphone");
  localStorage.removeItem("RESPONCE_STSTUS");
  window.location.href = "https://gatah-admin.alowairdi.com/login.html";
}
loader();
let intervalID;

function startChecking() {
  // نشغل الـ setInterval فقط إذا ما كان شغال
  if (!intervalID) {
    intervalID = setInterval(async () => {
      let fresh_gatah_request = await getDataRequeset("gatah-request");
      let fresh_bill_request = await getDataRequeset("bill-request");

      if (
        fresh_gatah_request.length != gatah_requesets.length ||
        bill_requesets.length != fresh_bill_request.length
      ) {
        document
          .getElementById("container")
          .classList.remove("container_message");

        await loader();
      }
    }, 2000);
  }
}

function stopChecking() {
  clearInterval(intervalID);
  intervalID = null;
}

// حدث يتفعل لما المستخدم يغير التبويبة أو يصغّر الصفحة
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopChecking();
  } else {
    startChecking();
  }
});

// نشغل التحديث أول ما تفتح الصفحة
startChecking();
