const FRONT_END = "https://gatah-admin.alowairdi.com";
const API_URL = "https://gatah-api.alowairdi.com/api/v1/admin";

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
  window.location.href = `${FRONT_END}/login.html`;
}

let bill_requesets = [];
let gatah_requesets = [];
let tickets = [];
let counter = 0;
let title = "";

async function getDataRequeset(type) {
  const response = await fetch(`${API_URL}/${type}`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      Authorization: ACCESS_TOKEN,
    },
  });
  if (response.status == 401 || response.status == 403) {
    window.location.href = `${FRONT_END}/login.html`;
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
  const response = await fetch(`${API_URL}/${ticket_type}/${gatah_id}`, {
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
  console.log(tickets);

  tickets.forEach((ticket) => {
    let formated_date = formatDate(ticket.created_at);
    let bill_start = `<div class="invoice " id="invoice"><h3 class="text-color">تفاصيل الفاتورة:</h3><ul>`;
    let bill_end = `</ul></div>`;
    let the_bill = "";
    let bill_element = `${bill_start}${the_bill}${bill_end}`;

    if (ticket.bill) {
      title = "فاتورة";

      ticket_id = `bill${ticket.id}`;

      approve_button = `<button onClick="approveRequest(${ticket.bill_id},${ticket_id})" class="accept-btn">تم</button>`;

      ticket.bill.forEach((item) => {
        the_bill += `
                        <li>${item.title} - ${item.price} ر.س</li>
                    `;
      });
      bill_element = `${bill_start}${the_bill}${bill_end}`;
    } else {
      title = "قطة";
      ticket_id = `gatah${ticket.id}`;
      approve_button = `<button onClick="approveRequest(${ticket.gatah_id},${ticket_id})" class="accept-btn">تم</button>`;
    }

    if (ticket.status != "approved") {
      counter++;
      container.innerHTML += `    <div class="order-card text-color" id="${ticket_id}">
        <div class="order-header">
            <span class="order-type text-color">${title}</span>
            <span class="order-date">${formated_date}</span>
        </div>

        <div class="order-info">
            <h2 class="customer-name">${ticket.user_name}</h2>
            <p class="order-price">السعر: ${ticket.price} ر.س</p>
            <p class="order-status">الحالة: ${
              ticket.status == "review" ? "غير مأكدة" : "مأكدة"
            }</p>
            ${approve_button}
        </div>

        ${ticket.bill ? bill_element : ""}
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
  localStorage.removeItem("ACCESS_TOKEN");
  localStorage.removeItem("userphone");
  localStorage.removeItem("RESPONCE_STSTUS");
  window.location.href = `${FRONT_END}/login.html`;
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
// startChecking();
