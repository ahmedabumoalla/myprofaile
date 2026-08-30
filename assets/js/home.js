// Busla — homepage behavior: preloader, video, and booking calendar
(function(){
  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS_AR = ['أح','إث','ثل','أر','خم','جم','سب'];
  const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ===== Preloader =====
  (function preloader(){
    const el = document.getElementById('preloader');
    const percentEl = document.getElementById('preloadPercent');
    if(!el) return;
    const dur = 2300, t0 = performance.now();
    let done = false;
    const finish = () => {
      if(done) return; done = true;
      clearInterval(iv);
      setTimeout(() => el.classList.add('is-open'), 480);
    };
    const iv = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      if(percentEl) percentEl.textContent = Math.round(p * 100);
      if(p >= 1) finish();
    }, 16);
    setTimeout(finish, dur + 1500);
  })();

  // ===== Video autoplay =====
  (function playVideo(){
    const v = document.getElementById('heroVideo');
    if(!v) return;
    v.muted = true; v.defaultMuted = true;
    const go = () => { const p = v.play(); if(p && p.catch) p.catch(()=>{}); };
    go();
    v.addEventListener('loadeddata', go);
    v.addEventListener('canplay', go);
  })();

  // ===== Booking calendar =====
  let calMonth = new Date().getFullYear()*12 + new Date().getMonth();
  let selectedDay = null; // "y-m-day" (m is 0-indexed)
  let selectedSlot = null; // "HH:MM"
  let slotsRequestId = 0;

  function pad2(n){ return String(n).padStart(2,'0'); }
  function isoDate(y, m, day){ return `${y}-${pad2(m+1)}-${pad2(day)}`; }
  function formatSlotLabel(time, lang){
    const [h, m] = time.split(':').map(Number);
    const period = lang === 'en' ? (h < 12 ? 'AM' : 'PM') : (h < 12 ? 'ص' : 'م');
    let h12 = h % 12; if(h12 === 0) h12 = 12;
    return `${h12}:${pad2(m)} ${period}`;
  }

  async function loadSlots(y, m, day){
    const wrap = document.getElementById('calSlotsWrap');
    const slotsEl = document.getElementById('calSlots');
    const labelEl = document.getElementById('calSlotsLabel');
    const lang = window.Busla.getLang();
    const requestId = ++slotsRequestId;
    selectedSlot = null;
    wrap.style.display = 'block';
    labelEl.textContent = lang === 'en' ? 'Loading available times…' : 'جاري تحميل الأوقات المتاحة…';
    slotsEl.innerHTML = '';
    try {
      const res = await fetch(`/api/slots?date=${isoDate(y, m, day)}`);
      const data = await res.json();
      if(requestId !== slotsRequestId) return;
      const slots = Array.isArray(data.slots) ? data.slots : [];
      if(!slots.length){
        labelEl.textContent = lang === 'en' ? 'No available times on this day.' : 'لا توجد أوقات متاحة في هذا اليوم.';
        return;
      }
      labelEl.textContent = lang === 'en' ? 'Pick a time:' : 'اختر الوقت:';
      slots.forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = formatSlotLabel(time, lang);
        btn.style.cssText = 'padding:10px 8px;border-radius:10px;border:1.5px solid var(--glass-border);background:var(--glass-card);color:var(--text);font-size:13px;cursor:pointer;transition:all .2s;font-family:inherit;';
        btn.addEventListener('click', () => openBookingModal(y, m, day, time));
        slotsEl.appendChild(btn);
      });
    } catch(err){
      if(requestId !== slotsRequestId) return;
      labelEl.textContent = lang === 'en' ? "Couldn't load times. Try again." : 'تعذّر تحميل الأوقات، حاول مرة أخرى.';
    }
  }

  // ===== Booking modal =====
  const bookingModal = document.getElementById('bookingModal');
  const bookingForm = document.getElementById('bookingForm');
  const bookingError = document.getElementById('bookingError');
  const bookingSubmit = document.getElementById('bookingSubmit');
  let pendingBooking = null;

  function openBookingModal(y, m, day, time){
    const lang = window.Busla.getLang();
    pendingBooking = { date: isoDate(y, m, day), time };
    const dateLabel = new Date(y, m, day).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA-u-ca-gregory', { weekday:'long', month:'long', day:'numeric' });
    document.getElementById('bookingModalSummary').textContent = `${dateLabel} — ${formatSlotLabel(time, lang)}`;
    bookingError.style.display = 'none';
    bookingForm.style.display = 'block';
    bookingForm.reset();
    document.getElementById('bookingSuccess').style.display = 'none';
    bookingModal.style.display = 'flex';
  }
  window.Booking = { close: () => { bookingModal.style.display = 'none'; } };

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!pendingBooking) return;
    const lang = window.Busla.getLang();
    const name = document.getElementById('bookingName').value.trim();
    const email = document.getElementById('bookingEmail').value.trim();
    bookingError.style.display = 'none';
    bookingSubmit.disabled = true;
    bookingSubmit.style.opacity = '.6';
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: pendingBooking.date, time: pendingBooking.time, name, email, lang })
      });
      const data = await res.json();
      if(!res.ok || !data.success){
        const messages = {
          invalid_email: lang === 'en' ? 'Please enter a valid email.' : 'رجاءً أدخل بريدًا إلكترونيًا صحيحًا.',
          slot_taken: lang === 'en' ? 'This time was just booked. Please pick another.' : 'تم حجز هذا الوقت للتو، اختر وقتًا آخر.',
          slot_not_bookable: lang === 'en' ? 'This time is no longer available.' : 'هذا الوقت لم يعد متاحًا.'
        };
        bookingError.textContent = messages[data.error] || (lang === 'en' ? 'Something went wrong. Please try again.' : 'حدث خطأ ما، حاول مرة أخرى.');
        bookingError.style.display = 'block';
        return;
      }
      bookingForm.style.display = 'none';
      const successEl = document.getElementById('bookingSuccess');
      successEl.style.display = 'block';
      const meetLinkEl = document.getElementById('bookingMeetLink');
      if(data.meetLink){
        meetLinkEl.href = data.meetLink;
        meetLinkEl.style.display = 'inline-block';
      } else {
        meetLinkEl.style.display = 'none';
      }
      selectedDay = null;
      document.getElementById('calSlotsWrap').style.display = 'none';
      renderCalendar();
    } catch(err){
      bookingError.textContent = lang === 'en' ? "Couldn't reach the server. Please try again." : 'تعذّر الوصول للخادم، حاول مرة أخرى.';
      bookingError.style.display = 'block';
    } finally {
      bookingSubmit.disabled = false;
      bookingSubmit.style.opacity = '1';
    }
  });

  function renderCalendar(){
    const lang = window.Busla.getLang();
    const y = Math.floor(calMonth / 12);
    const m = ((calMonth % 12) + 12) % 12;
    document.getElementById('calMonthLabel').textContent = `${lang === 'en' ? MONTHS_EN[m] : MONTHS_AR[m]} ${y}`;
    const weekdayLabels = lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_AR;
    const weekdaysEl = document.getElementById('calWeekdays');
    weekdaysEl.innerHTML = '';
    weekdayLabels.forEach(w => {
      const d = document.createElement('div');
      d.style.cssText = 'text-align:center;font-size:12.5px;color:var(--text-faint);padding:6px 0;';
      d.textContent = w;
      weekdaysEl.appendChild(d);
    });

    const daysEl = document.getElementById('calDays');
    daysEl.innerHTML = '';
    const firstOfMonth = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const leadOffset = firstOfMonth.getDay();
    const today = new Date();
    const isToday = (d) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    const isPastMonth = (y < today.getFullYear()) || (y === today.getFullYear() && m < today.getMonth());

    for(let i = 0; i < leadOffset; i++){
      const btn = document.createElement('button');
      btn.style.visibility = 'hidden';
      btn.disabled = true;
      daysEl.appendChild(btn);
    }
    for(let day = 1; day <= daysInMonth; day++){
      const dow = (leadOffset + day - 1) % 7;
      const isWeekend = dow === 5 || dow === 6;
      const isPastDay = isPastMonth || (y === today.getFullYear() && m === today.getMonth() && day < today.getDate());
      const disabled = isWeekend || isPastDay;
      const key = `${y}-${m}-${day}`;
      const selected = selectedDay === key;
      let style = 'aspect-ratio:1;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;background:transparent;border:1.5px solid transparent;cursor:pointer;transition:all .2s;';
      if(disabled) style += 'color:var(--text-faint);text-decoration:line-through;cursor:not-allowed;';
      else style += 'color:var(--text);';
      if(selected) style += 'border-color:var(--accent);color:var(--accent);font-weight:700;';
      else if(isToday(day) && !disabled) style += 'border-color:var(--glass-border);';
      const btn = document.createElement('button');
      btn.style.cssText = style;
      btn.textContent = String(day);
      btn.disabled = disabled;
      if(!disabled) btn.addEventListener('click', () => { selectedDay = key; renderCalendar(); loadSlots(y, m, day); });
      daysEl.appendChild(btn);
    }
  }
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--; selectedDay = null; document.getElementById('calSlotsWrap').style.display = 'none'; renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++; selectedDay = null; document.getElementById('calSlotsWrap').style.display = 'none'; renderCalendar();
  });
  renderCalendar();

})();
