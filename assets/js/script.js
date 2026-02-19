'use strict';

// element toggle function
const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () {
  elementToggleFunc(sidebar);
});

// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
};

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
    testimonialsModalFunc();
  });
}

// =====================
// LeetCode rank updater
// =====================

const LEETCODE_USERNAME = "dj20101004";

function findLeetCodeElement() {
  // find contact-item where contact-title is LeetCode
  const items = document.querySelectorAll('.contact-item');
  for (const it of items) {
    const title = it.querySelector('.contact-title');
    if (title && title.textContent.trim().toLowerCase() === 'leetcode') {
      return it.querySelector('.contact-link');
    }
  }
  // fallback: any link to leetcode
  return document.querySelector('a.contact-link[href*="leetcode.com"]');
}

async function fetchLeetCodeProfileHtml(username) {
  const url = `https://leetcode.com/u/${username}/`;
  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error('Network response not ok');
    return await res.text();
  } catch (e) {
    console.error('Failed to fetch profile page:', e);
    return null;
  }
}

async function extractRankFromHtml(html) {
  if (!html) return null;
  // look for JSON snippets that may contain ranking
  const m1 = html.match(/"ranking"\s*:\s*(\d+)/i);
  if (m1) return m1[1];
  const m2 = html.match(/"user_ranking"\s*:\s*(\d+)/i);
  if (m2) return m2[1];
  // try searching for 'Rank' followed by number
  const m3 = html.match(/Rank\s*[:#]?\s*([\d,]+)/i);
  if (m3) return m3[1].replace(/,/g, '');
  return null;
}

async function fetchLeetCodeViaGraphQL(username) {
  const url = "https://leetcode.com/graphql";
  const query = {
    query: `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    });
    if (!res.ok) throw new Error('GraphQL request failed');
    return await res.json();
  } catch (e) {
    console.error('GraphQL fetch error:', e);
    return null;
  }
}

async function updateLeetCodeRank() {
  const elem = findLeetCodeElement();
  if (!elem) return;

  // optimistic: try HTML scraping first (may work even without GraphQL access)
  const html = await fetchLeetCodeProfileHtml(LEETCODE_USERNAME);
  let rank = await extractRankFromHtml(html);

  if (!rank) {
    // fallback to GraphQL to show solved count if rank not available
    const data = await fetchLeetCodeViaGraphQL(LEETCODE_USERNAME);
    if (data && data.data && data.data.matchedUser && data.data.matchedUser.submitStats) {
      const arr = data.data.matchedUser.submitStats.acSubmissionNum || [];
      const all = arr.find(a => a.difficulty && a.difficulty.toLowerCase() === 'all');
      if (all) rank = `Solved: ${all.count}`;
    }
  }

  if (rank) {
    // format numeric ranks with commas
    if (/^\d+$/.test(String(rank))) rank = Number(rank).toLocaleString();
    elem.textContent = `Rank : ${rank}`;
  } else {
    // don't append update text; show N/A when rank isn't available
    elem.textContent = `Rank : N/A`;
  }
}

// prefer reading server-side-updated JSON, fallback to client fetch
async function loadLeetCodeFromJsonOrFetch() {
  const elem = findLeetCodeElement();
  if (!elem) return;

  try {
    const res = await fetch('/assets/data/leetcode.json', { cache: 'no-cache' });
    if (res.ok) {
      const j = await res.json();
      if (j && (j.formatted || j.rank)) {
        const display = j.formatted || j.rank;
        elem.textContent = `Rank : ${display}`;
        return;
      }
    }
  } catch (e) {
    // fall through to client-side fetch
    console.warn('Failed to read leetcode.json:', e.message);
  }

  // fallback to existing client-side fetch/scrape
  try {
    await updateLeetCodeRank();
  } catch (e) {
    console.warn('Client-side leetcode update failed:', e.message);
  }
}

// run updater on each page load
loadLeetCodeFromJsonOrFetch().catch(()=>{});

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);

// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () {
  elementToggleFunc(this);
});

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
  for (let i = 0; i < filterItems.length; i++) {
    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
};

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {
  filterBtn[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;
  });
}
// Make sure to replace with your EmailJS details
const serviceID = "service_31heuw2";
const templateID = "template_6ldi71g";
const publicKey = "aGqMrhZyFH3yJE3hq";

// Select DOM elements
const form = document.getElementById("contactForm");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// Enable button when all fields are filled
formInputs.forEach((input) => {
  input.addEventListener("input", () => {
    const allFilled = [...formInputs].every(input => input.value.trim() !== "");
    formBtn.disabled = !allFilled;
  });
});

// Handle form submission
form.addEventListener("submit", function (e) {
  e.preventDefault();

  formBtn.disabled = true;
  formBtn.querySelector("span").textContent = "Sending...";

  emailjs.sendForm(serviceID, templateID, this, publicKey)
    .then(() => {
      alert("Message sent successfully!");
      form.reset();
      formBtn.disabled = true;
      formBtn.querySelector("span").textContent = "Send Message";
    })
    .catch((error) => {
      alert("Failed to send message. Please try again.");
      console.error("EmailJS Error:", error);
      formBtn.disabled = false;
      formBtn.querySelector("span").textContent = "Send Message";
    });
});

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    for (let j = 0; j < pages.length; j++) {
      if (this.innerHTML.toLowerCase() === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}
