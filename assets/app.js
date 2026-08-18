(function(){
'use strict';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- nav + progress ---------- */
var nav = document.getElementById('site-nav');
var bar = document.querySelector('.progress-bar');
function onScroll(){
  var y = window.pageYOffset || document.documentElement.scrollTop;
  if(nav) nav.classList.toggle('scrolled', y > 40);
  if(bar){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- scroll reveals ---------- */
var rvs = document.querySelectorAll('.rv');
if(reduce || !('IntersectionObserver' in window)){
  Array.prototype.forEach.call(rvs, function(el){ el.classList.add('in'); });
}else{
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {rootMargin:'0px 0px -10% 0px', threshold:0});
  Array.prototype.forEach.call(rvs, function(el){ io.observe(el); });
  /* fallback sweep: a fast scroll or an anchor jump can outrun the observer */
  var sweep = function(){
    Array.prototype.forEach.call(document.querySelectorAll('.rv:not(.in)'), function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight * 0.9 && r.bottom > 0){ el.classList.add('in'); io.unobserve(el); }
    });
  };
  window.addEventListener('scroll', sweep, {passive:true});
  window.addEventListener('resize', sweep);
  sweep();
}

/* ---------- schedule a tour modal ---------- */
var VESSEL = "2023 Riva 110' \u201cDolcevita\u201d";
var st = document.getElementById('st');
if(st){
  var stDays = document.getElementById('st-days');
  var stMonth = document.getElementById('st-month');
  var stSlotWrap = document.getElementById('st-slot-wrap');
  var stErr = document.getElementById('st-err');
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var today = new Date(); today.setHours(0,0,0,0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var picked = null;      /* Date */
  var pickedSlot = null;  /* string */
  var stOpener = null;

  var key = function(d){ return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); };

  /* Availability: every day from today on is bookable; weekends run a shorter day. */
  function slotsFor(d){
    if(d < today) return [];
    var dow = d.getDay();
    if(dow === 0) return ['12:00','15:00'];
    if(dow === 6) return ['11:00','13:00','15:00','17:00'];
    return ['10:00','11:30','13:30','15:00','16:30','18:30'];
  }

  function renderSlots(){
    if(!picked){
      stSlotWrap.innerHTML = '<p class="st-empty">Select a date to see available times</p>';
      return;
    }
    var list = slotsFor(picked);
    if(!list.length){
      stSlotWrap.innerHTML = '<p class="st-empty">No time slots available</p>';
      return;
    }
    stSlotWrap.innerHTML = '<div class="st-slot-list">' + list.map(function(t){
      return '<button class="st-slot' + (t === pickedSlot ? ' on' : '') + '" type="button" data-slot="' + t + '">' + t + '</button>';
    }).join('') + '</div>';
  }

  function renderMonth(){
    stMonth.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    document.getElementById('st-prev').disabled =
      (view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth());

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var start = new Date(first); start.setDate(1 - first.getDay());
    /* only render the weeks this month actually spans, so the panel stays short */
    var inMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var cells = Math.ceil((first.getDay() + inMonth) / 7) * 7;
    var html = '';
    for(var i = 0; i < cells; i++){
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var cls = 'st-d';
      if(d.getMonth() !== view.getMonth()) cls += ' out';
      var dead = d < today || !slotsFor(d).length;
      if(d < today) cls += ' past';
      else if(dead) cls += ' unavail';
      if(key(d) === key(today)) cls += ' today';
      if(picked && key(d) === key(picked)) cls += ' on';
      html += '<button class="' + cls + '" type="button" data-d="' + key(d) + '"' +
              (dead ? ' tabindex="-1" aria-disabled="true"' : '') + '>' + d.getDate() + '</button>';
    }
    stDays.innerHTML = html;
  }

  stDays.addEventListener('click', function(e){
    var b = e.target.closest('.st-d');
    if(!b || b.classList.contains('past') || b.classList.contains('unavail')) return;
    var parts = b.getAttribute('data-d').split('-');
    picked = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    pickedSlot = null;
    if(picked.getMonth() !== view.getMonth()){ view = new Date(picked.getFullYear(), picked.getMonth(), 1); }
    renderMonth(); renderSlots();
  });
  stSlotWrap.addEventListener('click', function(e){
    var b = e.target.closest('.st-slot'); if(!b) return;
    pickedSlot = b.getAttribute('data-slot');
    renderSlots();
  });
  document.getElementById('st-prev').addEventListener('click', function(){
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderMonth();
  });
  document.getElementById('st-next').addEventListener('click', function(){
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderMonth();
  });

  function stOpen(trigger){
    stOpener = trigger || null;
    st.querySelector('.st-panel').classList.remove('done');
    renderMonth(); renderSlots();
    st.classList.add('open');
    document.body.style.overflow = 'hidden';
    var c = st.querySelector('.st-close'); if(c) c.focus();
  }
  function stClose(){
    st.classList.remove('open');
    document.body.style.overflow = '';
    if(stOpener && stOpener.focus) stOpener.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-open-tour]'), function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); stOpen(a); });
  });
  Array.prototype.forEach.call(st.querySelectorAll('[data-st-close]'), function(x){ x.addEventListener('click', stClose); });

  document.getElementById('st-submit').addEventListener('click', function(){
    var name = document.getElementById('st-name').value.trim();
    var email = document.getElementById('st-email').value.trim();
    var phone = document.getElementById('st-phone').value.trim();
    var miss = [];
    if(!picked) miss.push('a date');
    if(picked && !pickedSlot && slotsFor(picked).length) miss.push('a time slot');
    if(picked && !slotsFor(picked).length) miss.push('a date with available times');
    if(!name) miss.push('your full name');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) miss.push('a valid email');
    if(phone.replace(/\D/g,'').length < 7) miss.push('a phone number');
    if(miss.length){
      stErr.textContent = 'Please add ' + miss.join(', ') + '.';
      stErr.classList.add('show');
      return;
    }
    stErr.classList.remove('show');

    var mode = st.querySelector('input[name="st-mode"]:checked').value;
    var when = picked.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
    var art = /^[aeiou]/i.test(mode) ? 'an' : 'a';
    document.getElementById('st-done-msg').textContent =
      'You\u2019ve requested ' + art + ' ' + mode + ' tour for the ' + VESSEL + ' on ' + when +
      ' at ' + pickedSlot + '. The dealer will confirm by email shortly.';
    st.querySelector('.st-panel').classList.add('done');
    var c = st.querySelector('.st-close'); if(c) c.focus();
  });

  window.jbyScheduleTour = { open: stOpen, close: stClose };
}

/* ---------- small modals that share the schedule-a-tour shell ---------- */
function simpleModal(opts){
  var el = document.getElementById(opts.id);
  if(!el) return;
  var panel = el.querySelector('.st-panel');
  var err = document.getElementById(opts.errId);
  var opener = null;

  function open(trigger){
    opener = trigger || null;
    panel.classList.remove('done');
    err.classList.remove('show');
    if(opts.onOpen) opts.onOpen(trigger);
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    var c = el.querySelector('.st-close'); if(c) c.focus();
  }
  function close(){
    el.classList.remove('open');
    document.body.style.overflow = '';
    if(opener && opener.focus) opener.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll(opts.openSelector), function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); open(a); });
  });
  Array.prototype.forEach.call(el.querySelectorAll('[' + opts.closeAttr + ']'), function(x){
    x.addEventListener('click', close);
  });
  document.getElementById(opts.submitId).addEventListener('click', function(){
    var miss = opts.validate();
    if(miss.length){
      err.textContent = 'Please add ' + miss.join(', ') + '.';
      err.classList.add('show');
      return;
    }
    err.classList.remove('show');
    document.getElementById(opts.doneMsgId).textContent = opts.message();
    panel.classList.add('done');
    var c = el.querySelector('.st-close'); if(c) c.focus();
  });
  return {open: open, close: close, el: el};
}

var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* price alert */
var paModal = simpleModal({
  id: 'pa', openSelector: '[data-open-alert]', closeAttr: 'data-pa-close',
  submitId: 'pa-submit', errId: 'pa-err', doneMsgId: 'pa-done-msg',
  validate: function(){
    var miss = [];
    if(!EMAIL_RE.test(document.getElementById('pa-email').value.trim())) miss.push('a valid email');
    if(!document.getElementById('pa-agree').checked) miss.push('your consent to receive updates');
    return miss;
  },
  message: function(){
    return 'We\u2019ll email ' + document.getElementById('pa-email').value.trim() +
           ' the moment the price of the ' + VESSEL + ' changes.';
  }
});

/* report a mistake */
var rmModal = simpleModal({
  id: 'rm', openSelector: '[data-open-report]', closeAttr: 'data-rm-close',
  submitId: 'rm-submit', errId: 'rm-err', doneMsgId: 'rm-done-msg',
  validate: function(){
    var miss = [];
    if(!document.getElementById('rm-name').value.trim()) miss.push('your full name');
    if(!EMAIL_RE.test(document.getElementById('rm-email').value.trim())) miss.push('a valid email');
    if(!document.getElementById('rm-message').value.trim()) miss.push('a description of the mistake');
    return miss;
  },
  message: function(){
    return 'Thanks \u2014 your note about the ' + VESSEL + ' range calculator is with our team. ' +
           'We\u2019ll follow up at ' + document.getElementById('rm-email').value.trim() + ' if we need more detail.';
  }
});

/* live stream reminder */
var ntWhen = '';
var ntModal = simpleModal({
  id: 'nt', openSelector: '[data-open-notify]', closeAttr: 'data-nt-close',
  submitId: 'nt-submit', errId: 'nt-err', doneMsgId: 'nt-done-msg',
  onOpen: function(trigger){
    /* remember which stream the bell belongs to, for the confirmation line */
    var card = trigger && trigger.closest('.ev');
    var row = card && card.querySelector('.ev-row b');
    ntWhen = row ? row.textContent.trim() : '';
  },
  validate: function(){
    var miss = [];
    if(!EMAIL_RE.test(document.getElementById('nt-email').value.trim())) miss.push('a valid email');
    if(!document.getElementById('nt-lead').value) miss.push('a reminder time');
    return miss;
  },
  message: function(){
    return 'We\u2019ll email ' + document.getElementById('nt-email').value.trim() + ' ' +
           document.getElementById('nt-lead').value + ' before the live stream' +
           (ntWhen ? ' on ' + ntWhen : '') + ' so you can join from anywhere.';
  }
});
var ntLead = document.getElementById('nt-lead');
if(ntLead) ntLead.addEventListener('change', function(){
  ntLead.classList.toggle('empty', !ntLead.value);
});

/* RSVP for the in-person shows */
var RS_VESSELS = [
  {id:'riva110',  name:"2023 Riva 110' \u201cDolcevita\u201d",   img:'./assets/yacht_running_bow.jpg'},
  {id:'axopar23', name:'2023 Axopar 37 XC Cross Cabin',        img:'./assets/listing_axopar_1.jpg'},
  {id:'axopar21', name:'2021 Axopar 37 XC Cross Cabin',        img:'./assets/listing_axopar_2.jpg'},
  {id:'pardo43',  name:'2022 Pardo Yachts P43 Ocean Whisper',  img:'./assets/yacht_foredeck.jpg'}
];
var rsPicked = ['riva110'];   /* the vessel being viewed starts selected */
var rsEvent = '';

var rsPicker = document.getElementById('rs-picker');
var rsMenu = document.getElementById('rs-menu');
var rsWrap = document.getElementById('rs-vessels');

function rsRender(){
  if(!rsPicker) return;
  var chips = RS_VESSELS.filter(function(v){ return rsPicked.indexOf(v.id) > -1; }).map(function(v){
    return '<span class="rs-chip"><img src="' + v.img + '" alt=""/>' + v.name +
           '<button type="button" data-drop="' + v.id + '" aria-label="Remove ' + v.name + '">' +
           '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></span>';
  }).join('');
  rsPicker.innerHTML = (chips || '<span class="rs-ph">Select one or more vessels</span>') +
    '<svg class="chev" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  rsMenu.innerHTML = RS_VESSELS.map(function(v){
    var on = rsPicked.indexOf(v.id) > -1;
    return '<div class="rs-opt' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-pick="' + v.id + '">' +
           '<img src="' + v.img + '" alt=""/>' + v.name +
           '<svg class="tick" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  }).join('');
}
if(rsPicker){
  rsRender();
  rsPicker.addEventListener('click', function(e){
    var drop = e.target.closest('[data-drop]');
    if(drop){
      e.stopPropagation();
      rsPicked = rsPicked.filter(function(id){ return id !== drop.getAttribute('data-drop'); });
      rsRender();
      return;
    }
    rsWrap.classList.toggle('open');
    rsPicker.setAttribute('aria-expanded', rsWrap.classList.contains('open'));
  });
  rsMenu.addEventListener('click', function(e){
    var opt = e.target.closest('[data-pick]'); if(!opt) return;
    var id = opt.getAttribute('data-pick');
    if(rsPicked.indexOf(id) > -1) rsPicked = rsPicked.filter(function(x){ return x !== id; });
    else rsPicked.push(id);
    rsRender();
  });
  document.addEventListener('click', function(e){
    if(rsWrap.classList.contains('open') && !rsWrap.contains(e.target)){
      rsWrap.classList.remove('open');
      rsPicker.setAttribute('aria-expanded', 'false');
    }
  });
}

var rsGuests = document.getElementById('rs-guests');
Array.prototype.forEach.call(document.querySelectorAll('[data-guests]'), function(b){
  b.addEventListener('click', function(){
    var step = parseInt(b.getAttribute('data-guests'), 10);
    var n = parseInt(rsGuests.value, 10); if(isNaN(n)) n = 0;
    n = Math.max(1, Math.min(20, n + step));
    rsGuests.value = n;
  });
});
var rsDetails = document.getElementById('rs-details');
if(rsDetails) rsDetails.addEventListener('input', function(){
  document.getElementById('rs-count').textContent = rsDetails.value.length.toLocaleString('en-US');
});

var rsModal = simpleModal({
  id: 'rs', openSelector: '[data-open-rsvp]', closeAttr: 'data-rs-close',
  submitId: 'rs-submit', errId: 'rs-err', doneMsgId: 'rs-done-msg',
  onOpen: function(trigger){
    var card = trigger && trigger.closest('.ip');
    var h = card && card.querySelector('h4');
    rsEvent = h ? h.textContent.trim() : '';
  },
  validate: function(){
    var miss = [];
    if(!document.getElementById('rs-first').value.trim()) miss.push('your first name');
    if(!document.getElementById('rs-last').value.trim()) miss.push('your last name');
    if(!EMAIL_RE.test(document.getElementById('rs-email').value.trim())) miss.push('a valid email');
    if(document.getElementById('rs-phone').value.replace(/\D/g,'').length < 7) miss.push('a phone number');
    if(!rsPicked.length) miss.push('at least one vessel');
    return miss;
  },
  message: function(){
    return 'Your RSVP request' + (rsEvent ? ' for the ' + rsEvent : '') +
           ' has been submitted successfully. You\u2019ll receive a confirmation email once the dealer approves your request.';
  }
});

/* contact an expert */
var CE_TOPICS = ['Buying a yacht','Selling a yacht','Experiences & events','Service & maintenance','General inquiry'];
var cePicked = [];
var cePicker = document.getElementById('ce-picker');
var ceMenu = document.getElementById('ce-menu');
var ceWrap = document.getElementById('ce-topics');

function ceRender(){
  if(!cePicker) return;
  var chips = cePicked.map(function(t){
    return '<span class="rs-chip">' + t +
           '<button type="button" data-cedrop="' + t + '" aria-label="Remove ' + t + '">' +
           '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></span>';
  }).join('');
  cePicker.innerHTML = (chips || '<span class="rs-ph">Select a topic</span>') +
    '<svg class="chev" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  ceMenu.innerHTML = CE_TOPICS.map(function(t){
    var on = cePicked.indexOf(t) > -1;
    return '<div class="rs-opt' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-cepick="' + t + '">' +
           '<span class="st-box"' + (on ? ' style="background:var(--navy);border-color:var(--navy)"' : '') + '>' +
           '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:' + (on ? 1 : 0) + '"><path d="M4.5 10.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
           t + '</div>';
  }).join('');
}
if(cePicker){
  ceRender();
  cePicker.addEventListener('click', function(e){
    var drop = e.target.closest('[data-cedrop]');
    if(drop){
      e.stopPropagation();
      cePicked = cePicked.filter(function(t){ return t !== drop.getAttribute('data-cedrop'); });
      ceRender();
      return;
    }
    ceWrap.classList.toggle('open');
    cePicker.setAttribute('aria-expanded', ceWrap.classList.contains('open'));
  });
  ceMenu.addEventListener('click', function(e){
    var opt = e.target.closest('[data-cepick]'); if(!opt) return;
    var t = opt.getAttribute('data-cepick');
    if(cePicked.indexOf(t) > -1) cePicked = cePicked.filter(function(x){ return x !== t; });
    else cePicked.push(t);
    ceRender();
  });
  document.addEventListener('click', function(e){
    if(ceWrap.classList.contains('open') && !ceWrap.contains(e.target)){
      ceWrap.classList.remove('open');
      cePicker.setAttribute('aria-expanded', 'false');
    }
  });
}

var ceModal = simpleModal({
  id: 'ce', openSelector: '[data-open-expert]', closeAttr: 'data-ce-close',
  submitId: 'ce-submit', errId: 'ce-err', doneMsgId: 'ce-done-msg',
  validate: function(){
    var miss = [];
    if(!document.getElementById('ce-name').value.trim()) miss.push('your full name');
    if(!EMAIL_RE.test(document.getElementById('ce-email').value.trim())) miss.push('a valid email');
    return miss;
  },
  message: function(){
    var topics = cePicked.length ? ' about ' + cePicked.join(', ').toLowerCase() : '';
    return 'Thanks \u2014 a Jeff Brown Yachts specialist will be in touch' + topics +
           ' at ' + document.getElementById('ce-email').value.trim() + ' shortly.';
  }
});

/* ---------- share modal ---------- */
var shr = document.getElementById('shr');
var shrBtn = document.getElementById('share-btn');
var SHARE_TITLE = "2023 Riva 110' \u201cDolcevita\u201d for sale";

function shareUrl(){ return location.href.split('#')[0]; }
function shareHref(kind){
  var u = encodeURIComponent(shareUrl());
  var t = encodeURIComponent(SHARE_TITLE);
  switch(kind){
    case 'facebook': return 'https://www.facebook.com/sharer/sharer.php?u=' + u;
    case 'whatsapp': return 'https://wa.me/?text=' + t + '%20' + u;
    case 'x':        return 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t;
    case 'sms':      return 'sms:?&body=' + t + '%20' + shareUrl();
    case 'email':    return 'mailto:?subject=' + t + '&body=' + t + '%0A%0A' + shareUrl();
  }
  return '#';
}
function shrOpen(){
  if(!shr) return;
  Array.prototype.forEach.call(shr.querySelectorAll('[data-shr]'), function(a){
    a.setAttribute('href', shareHref(a.getAttribute('data-shr')));
  });
  shr.classList.add('open');
  document.body.style.overflow = 'hidden';
  var first = shr.querySelector('.shr-close'); if(first) first.focus();
}
function shrClose(){
  if(!shr) return;
  shr.classList.remove('open');
  document.body.style.overflow = '';
  if(shrBtn) shrBtn.focus();
}
if(shrBtn && shr) shrBtn.addEventListener('click', shrOpen);
if(shr){
  Array.prototype.forEach.call(shr.querySelectorAll('[data-shr-close]'), function(x){ x.addEventListener('click', shrClose); });
  var shrCopy = document.getElementById('shr-copy');
  if(shrCopy) shrCopy.addEventListener('click', function(){
    var done = function(){
      var html = shrCopy.innerHTML;
      shrCopy.textContent = 'Link copied';
      setTimeout(function(){ shrCopy.innerHTML = html; }, 1800);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareUrl()).then(done, done);
    }else{
      var ta = document.createElement('textarea');
      ta.value = shareUrl(); ta.setAttribute('readonly',''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch(err){}
      document.body.removeChild(ta); done();
    }
  });
}

/* ---------- show more / read more ---------- */
Array.prototype.forEach.call(document.querySelectorAll('[data-toggle]'), function(link){
  link.addEventListener('click', function(e){
    e.preventDefault();
    var panel = document.getElementById(link.getAttribute('data-toggle'));
    if(!panel) return;
    var open = panel.classList.toggle('open');
    link.textContent = open ? link.getAttribute('data-less') : link.getAttribute('data-more');
    var dots = link.getAttribute('data-dots');
    if(dots){ var d = document.getElementById(dots); if(d) d.style.display = open ? 'none' : ''; }
  });
});

/* ---------- Ask Waylo ---------- */
var answers = {
  'What is the engine type and power?': 'She runs twin diesels rated 2,000 HP in total, on a V-drive transmission — freshly serviced at 400 hours.',
  'What is the top cruising speed?': 'Comfortable cruise is 24 knots, with a 32 knot top end in flat water.',
  'Does it have bedrooms or a kitchen?': 'Four staterooms sleeping up to eight guests, plus a full galley on the main deck and separate crew quarters.',
  'What is the fuel consumption?': 'At a 24 knot cruise she burns roughly 190 gallons per hour, giving about 320 nautical miles of range.',
  'Is it available for viewing?': 'Yes — she is lying San Diego and available in about two months, with private viewings by appointment.'
};
var wMsg = document.getElementById('waylo-msg');
var wIn = document.getElementById('waylo-input');
function waylo(q){
  if(!wMsg) return;
  wMsg.textContent = '...';
  setTimeout(function(){
    wMsg.textContent = answers[q] || 'Let me pull that from the specification sheet — a Jeff Brown Yachts specialist will follow up with the detail on "' + q + '".';
  }, 450);
}
Array.prototype.forEach.call(document.querySelectorAll('#waylo-sug button'), function(b){
  b.addEventListener('click', function(){ if(wIn) wIn.value = b.textContent; waylo(b.textContent); });
});
var wSend = document.getElementById('waylo-send');
if(wSend) wSend.addEventListener('click', function(){ if(wIn && wIn.value.trim()) waylo(wIn.value.trim()); });
if(wIn) wIn.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(wIn.value.trim()) waylo(wIn.value.trim()); } });

/* ---------- lead form ---------- */
var lead = document.getElementById('lead-form');
if(lead) lead.addEventListener('submit', function(e){
  e.preventDefault();
  var btn = lead.querySelector('.btn-navy');
  var t = btn.textContent; btn.textContent = 'Request sent';
  setTimeout(function(){ btn.textContent = t; }, 2400);
});
var phone = document.getElementById('show-phone');
if(phone) phone.addEventListener('click', function(){ phone.textContent = '+1 (888) 693-8099'; });

/* ---------- technical specifications ---------- */
var SPECS = {
  general: [
    ['Country of Origin','Italy'],['Vessel Designer','Italiana Design'],['Boat type','Motor Yacht / Flybridge'],
    ['Current Name','Luna Mare'],['Launch Name','Luna Mare'],['Hull Material','Composite'],
    ['Hull Number','1545257362'],['Internal Reference Number','1545257362']
  ],
  accommodation: [
    ['Cabins','4'],['Berths','8'],['Heads','5'],
    ['Crew Cabins','2'],['Crew Berths','3'],['Guests (day)','42'],
    ['Salon','Full beam, walnut joinery'],['Galley','Main deck, full size']
  ],
  engines: [
    ['Engine Make','MAN'],['Engine Model','V12-1000'],['Engine Count','2'],
    ['Total Power','2000 HP'],['Engine Hours','400'],['Drive Type','V-Drive'],
    ['Fuel Type','Diesel'],['Generators','2 x 27 kW Kohler']
  ],
  tanks: [
    ['Fuel Capacity','2,900 gal'],['Fresh Water','580 gal'],['Holding','185 gal'],
    ['Grey Water','120 gal'],['Watermaker','Yes, 2 x 190 gal/day'],['Fuel Burn (cruise)','190 gal/h']
  ],
  measurements: [
    ['Length Overall','75.85 FT'],['Beam','21.65 FT'],['Draft','5.74 FT'],
    ['Displacement','61.4 t'],['Bridge Clearance','19.2 FT'],['Cruise Speed','24 KN'],
    ['Top Speed','32 KM'],['Range at Cruise','320 NM']
  ],
  features: [
    ['Stabilisation','Seakeeper 35'],['Thrusters','Bow and stern'],['Air Conditioning','Chilled water, 240,000 BTU'],
    ['Swim Platform','Hydraulic, tender rated'],['Tender Garage','Yes'],['Deck','New teak, 2024'],
    ['Audio / Video','Sonos, Apple TV'],['Lighting','Underwater and deck LED']
  ],
  extra: [
    ['Flag','United States'],['Tax Status','US tax paid'],['Warranty','Engine warranty active'],
    ['Lying','San Diego, CA'],['Availability','2 months'],['Last Survey','2024']
  ],
  rigging: [
    ['Rig Type','Not applicable - motor yacht'],['Mast','Radar arch, carbon'],['Antennas','Satellite TV and VSAT'],
    ['Deck Hardware','Stainless, custom'],['Anchor','Ultra 100 kg'],['Windlass','2 x hydraulic']
  ]
};
var specGrid = document.getElementById('spec-grid');
function renderSpec(key){
  if(!specGrid) return;
  var rows = SPECS[key] || [];
  specGrid.innerHTML = rows.map(function(r){
    return '<div><div class="lbl">' + r[0] + '</div><div class="val">' + r[1] + '</div></div>';
  }).join('');
}
var specTabs = document.getElementById('spec-tabs');
if(specTabs){
  specTabs.addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    Array.prototype.forEach.call(specTabs.querySelectorAll('button'), function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    renderSpec(b.getAttribute('data-tab'));
  });
  renderSpec('general');
}

/* ---------- rails ---------- */
Array.prototype.forEach.call(document.querySelectorAll('.rail-wrap'), function(wrap){
  var rail = wrap.querySelector('[data-rail]');
  var prev = wrap.querySelector('.rail-nav.prev');
  var next = wrap.querySelector('.rail-nav.next');
  if(!rail) return;
  function step(){
    var first = rail.firstElementChild;
    var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 0;
    return first ? first.getBoundingClientRect().width + gap : rail.clientWidth * 0.8;
  }
  function sync(){
    var max = rail.scrollWidth - rail.clientWidth - 2;
    if(prev) prev.disabled = rail.scrollLeft <= 2;
    if(next) next.disabled = rail.scrollLeft >= max;
  }
  if(prev) prev.addEventListener('click', function(){ rail.scrollLeft -= step(); });
  if(next) next.addEventListener('click', function(){ rail.scrollLeft += step(); });
  rail.addEventListener('scroll', sync, {passive:true});
  window.addEventListener('resize', sync);
  sync();
});

/* ---------- range calculator map ---------- */
var mapEl = document.getElementById('range-map');
if(mapEl && window.L){
  var home = [33.3768, -79.2945]; /* Georgetown, SC */
  var map = L.map(mapEl, {scrollWheelZoom:false, zoomControl:true, attributionControl:false}).setView([33.15, -79.35], 8);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:17}).addTo(map);
  L.circle(home, {
    radius: 148000, color:'#ffffff', weight:1.4, opacity:0.8,
    fillColor:'#2b3238', fillOpacity:0.42
  }).addTo(map);

  function pin(active){
    return L.divIcon({
      className:'jby-pin', iconSize:[26,34], iconAnchor:[13,34],
      html:'<svg viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.1 13 21 13 21s13-11.9 13-21C26 5.8 20.2 0 13 0z" fill="' + (active ? '#ffffff' : '#dcd7cb') + '"/>' +
        '<circle cx="13" cy="13" r="4.6" fill="none" stroke="#41647b" stroke-width="1.7"/>' +
        '<circle cx="13" cy="13" r="1.5" fill="#41647b"/></svg>'
    });
  }
  L.marker(home, {icon:pin(true)}).addTo(map)
    .bindTooltip('Georgetown, SC', {permanent:true, direction:'bottom', offset:[0,4], className:'jby-tip'});
  [[33.6891,-78.8867],[33.9204,-78.0200],[32.7765,-79.9311],[32.4316,-80.6698]].forEach(function(p){
    L.marker(p, {icon:pin(false)}).addTo(map);
  });
  map.on('click', function(e){ L.marker(e.latlng, {icon:pin(false)}).addTo(map); });

  /* the map lives inside a reveal wrapper, so re-measure once it settles */
  var fix = function(){ map.invalidateSize(); };
  setTimeout(fix, 400);
  window.addEventListener('resize', fix);
  if('ResizeObserver' in window){ new ResizeObserver(fix).observe(mapEl); }
}

/* ---------- loan calculator ---------- */
var num = function(v){ var n = parseFloat(String(v).replace(/[^0-9.]/g,'')); return isNaN(n) ? 0 : n; };
var fmt = function(n){ return Math.round(n).toLocaleString('en-US'); };
var elPrice = document.getElementById('l-price');
var elDown = document.getElementById('l-down');
var elDownPc = document.getElementById('l-downpc');
var sDown = document.getElementById('s-down');
var elRate = document.getElementById('l-rate');
var sRate = document.getElementById('s-rate');
var elMonthly = document.getElementById('l-monthly');
var termsBox = document.getElementById('l-terms');
var months = 180;

function fillOf(input, id){
  var el = document.getElementById(id); if(!el || !input) return;
  var min = num(input.min), max = num(input.max), v = num(input.value);
  var pc = max > min ? (v - min) / (max - min) : 0;
  el.style.width = 'calc(' + (pc * 100) + '% - ' + (pc * 22 - 11) + 'px)';
}
function calc(){
  var price = num(elPrice && elPrice.value);
  var down = num(elDown && elDown.value);
  if(down > price) down = price;
  var principal = price - down;
  var rate = num(String(elRate && elRate.value).replace(',', '.')) / 100 / 12;
  var m = rate > 0 ? principal * rate / (1 - Math.pow(1 + rate, -months)) : principal / months;
  if(elMonthly) elMonthly.textContent = '$' + fmt(m || 0);
}
function syncFromDown(){
  var price = num(elPrice && elPrice.value);
  var down = num(elDown && elDown.value);
  if(elDownPc) elDownPc.value = price > 0 ? (down / price * 100).toFixed(2) : '0.00';
  if(sDown){ sDown.max = String(price || 0); sDown.value = String(down); fillOf(sDown, 'fill-down'); }
  calc();
}
if(elPrice) elPrice.addEventListener('input', function(){
  var v = num(elPrice.value); elPrice.value = fmt(v); syncFromDown();
});
if(elDown) elDown.addEventListener('input', function(){
  var v = num(elDown.value); elDown.value = fmt(v); syncFromDown();
});
if(elDownPc) elDownPc.addEventListener('input', function(){
  var price = num(elPrice && elPrice.value);
  var pc = Math.min(100, num(elDownPc.value));
  if(elDown) elDown.value = fmt(price * pc / 100);
  if(sDown){ sDown.max = String(price || 0); sDown.value = String(price * pc / 100); fillOf(sDown, 'fill-down'); }
  calc();
});
if(sDown) sDown.addEventListener('input', function(){
  if(elDown) elDown.value = fmt(num(sDown.value));
  var price = num(elPrice && elPrice.value);
  if(elDownPc) elDownPc.value = price > 0 ? (num(sDown.value) / price * 100).toFixed(2) : '0.00';
  fillOf(sDown, 'fill-down'); calc();
});
if(sRate) sRate.addEventListener('input', function(){
  if(elRate) elRate.value = String(num(sRate.value).toFixed(1)).replace('.', ',');
  fillOf(sRate, 'fill-rate'); calc();
});
if(elRate) elRate.addEventListener('input', function(){
  var v = num(String(elRate.value).replace(',', '.'));
  if(sRate){ sRate.value = String(Math.max(5, Math.min(20, v))); fillOf(sRate, 'fill-rate'); }
  calc();
});
if(termsBox) termsBox.addEventListener('click', function(e){
  var b = e.target.closest('button'); if(!b) return;
  Array.prototype.forEach.call(termsBox.querySelectorAll('button'), function(x){ x.classList.remove('on'); });
  b.classList.add('on');
  months = parseInt(b.getAttribute('data-months'), 10) || 180;
  calc();
});
if(sDown){ sDown.max = String(num(elPrice && elPrice.value)); fillOf(sDown, 'fill-down'); }
if(sRate){ fillOf(sRate, 'fill-rate'); }
calc();
window.addEventListener('resize', function(){ fillOf(sDown, 'fill-down'); fillOf(sRate, 'fill-rate'); });

/* ---------- gallery lightbox ---------- */
var figs = Array.prototype.slice.call(document.querySelectorAll('#gal figure'));
var lbx = document.getElementById('lbx');
var lbxImg = document.getElementById('lbx-img');
var lbxCap = document.getElementById('lbx-cap');
var idx = 0;
function show(i){
  if(!figs.length) return;
  idx = (i + figs.length) % figs.length;
  var img = figs[idx].querySelector('img');
  lbxImg.src = img.getAttribute('src');
  lbxImg.alt = img.getAttribute('alt') || '';
  lbxCap.textContent = (idx + 1) + ' / ' + figs.length + ' &middot; Stock photos, vessel may vary';
  lbxCap.innerHTML = (idx + 1) + ' / ' + figs.length + ' &middot; Stock photos, vessel may vary';
}
function open(i){ show(i); lbx.classList.add('open'); document.body.style.overflow = 'hidden'; }
function close(){ lbx.classList.remove('open'); document.body.style.overflow = ''; }
figs.forEach(function(f){
  f.addEventListener('click', function(e){
    if(e.target.closest('.gal-badge')) return;
    open(parseInt(f.getAttribute('data-i'), 10) || 0);
  });
});
Array.prototype.forEach.call(document.querySelectorAll('.gal-all, .sec-head .btn-ghost'), function(b){
  b.addEventListener('click', function(e){ e.stopPropagation(); open(0); });
});
if(lbx){
  Array.prototype.forEach.call(lbx.querySelectorAll('[data-close]'), function(x){ x.addEventListener('click', close); });
  lbx.querySelector('.lbx-prev').addEventListener('click', function(){ show(idx - 1); });
  lbx.querySelector('.lbx-next').addEventListener('click', function(){ show(idx + 1); });
}
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && ceModal && ceModal.el.classList.contains('open')){ ceModal.close(); return; }
  if(e.key === 'Escape' && rsModal && rsModal.el.classList.contains('open')){ rsModal.close(); return; }
  if(e.key === 'Escape' && ntModal && ntModal.el.classList.contains('open')){ ntModal.close(); return; }
  if(e.key === 'Escape' && paModal && paModal.el.classList.contains('open')){ paModal.close(); return; }
  if(e.key === 'Escape' && rmModal && rmModal.el.classList.contains('open')){ rmModal.close(); return; }
  if(e.key === 'Escape' && st && st.classList.contains('open')){ window.jbyScheduleTour.close(); return; }
  if(e.key === 'Escape' && shr && shr.classList.contains('open')){ shrClose(); return; }
  if(!lbx || !lbx.classList.contains('open')) return;
  if(e.key === 'Escape') close();
  if(e.key === 'ArrowLeft') show(idx - 1);
  if(e.key === 'ArrowRight') show(idx + 1);
});
})();
