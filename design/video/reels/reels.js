// The reel scripts. Each reel: scenes in order; `t` is the scene type in reel.html, `dur` its seconds, and
// `cap` the white caption pinned at the top while it plays. Captions are Roman Urdu and English, the way
// Karachi parents actually type. Never mock drivers: Van Uncle is loved, the problem is not knowing.
const REELS = {
  // 1. The class WhatsApp group at 7 am
  gate: { title: 'Every class WhatsApp group at 7:14 am', scenes: [
    { t: 'hook', dur: 2.0, kick: 'Karachi school moms', text: '7:14 AM. Van ka koi pata nahi.', sub: 'the group chat:' },
    { t: 'chat', dur: 7.2, cap: 'every class group at 7 AM 😭', group: 'Class 3-B Ammis 💛', unread: 47, from: 430, to: 442, msgs: [
      ['Ayesha', 'Van aa gayi kisi ki?', '#C2185B'],
      ['Sana', 'Nahi abhi tak 😩', '#1F5E54'],
      ['Hina', 'Uncle phone nahi utha rahe', '#7A5410'],
      ['Ayesha', 'Bachay gate pe khare hain', '#C2185B'],
      ['Rabia', 'Kal bhi late thi 🙃', '#3B3F9A'],
      ['You', 'Mein call karti hoon'],
      ['Hina', 'Unhon ne kaha 5 minute', '#7A5410'],
      ['Sana', '5 minute = 25 minute 😂', '#1F5E54'],
    ] },
    { t: 'hook', dur: 2.0, dark: true, text: 'What if your phone just told you?' },
    { t: 'lock', dur: 3.6, cap: 'no calls. no group. just this 👇', time: '7:12', notes: [
      ["Sara's van has left", 'Van 1 · Imran'],
      ['The van is close · get ready', '2 min away'],
      ['Sara got in the van ✓', '7:12 · Van 1'],
    ] },
    { t: 'end', dur: 2.6, line: 'Know the moment your child is in the van.' },
  ] },

  // 2. Calling Van Uncle
  calling: { title: 'Calling Van Uncle at 7:10 am', scenes: [
    { t: 'hook', dur: 1.8, text: 'Calling Van Uncle at 7:10 AM be like', sub: '(he is driving 🚐)' },
    { t: 'call', dur: 6.0, cap: 'Call #7. Still "5 minute" 📵', name: 'Van Uncle 🚐', calls: 7, from: 430, to: 448 },
    { t: 'hook', dur: 2.2, dark: true, kick: 'plot twist', text: "He can't pick up. He's driving your kids.", sub: 'and that is a good thing' },
    { t: 'lock', dur: 3.4, cap: 'so we made his phone tell you instead', time: '7:18', notes: [
      ['Hamza got in the van ✓', 'Uncle tapped once, at the stop'],
      ['Hamza reached school', '7:41 · Van 1'],
    ] },
    { t: 'end', dur: 2.6, line: 'Van Uncle taps once. You stop calling.', bio: 'free for drivers · link in bio' },
  ] },

  // 3. Van Uncle dictionary
  dictionary: { title: 'Van Uncle dictionary', scenes: [
    { t: 'hook', dur: 1.8, kick: 'a translation guide', text: 'Van Uncle → English', sub: 'save this 📌' },
    { t: 'dict', dur: 8.2, cap: 'Van Uncle dictionary 📖', title: 'he says → it means', rows: [
      ['"5 minute"', '25 minute'],
      ['"Bas nikal gaya"', 'chai ka aakhri ghoont'],
      ['"Raste mein hoon"', 'abhi ghar pe hai'],
      ['"Traffic hai"', 'sach mein Shahrah-e-Faisal 😭'],
      ['"Neeche aa jao"', 'gali ke kone pe hai'],
    ] },
    { t: 'hook', dur: 2.2, dark: true, text: 'We love you, Van Uncle.', sub: 'but we want the real minutes' },
    { t: 'lock', dur: 2.8, cap: 'Pohnch translates it: real minutes, live', time: '7:06', notes: [
      ['The van is 12 min away', 'live on the map · Van 1'],
    ] },
    { t: 'end', dur: 2.6, bio: 'tag the uncle who says "5 minute" 😂' },
  ] },

  // 4. The first pickup kid (nostalgia)
  firstkid: { title: 'POV: you were the first kid the van picked up', scenes: [
    { t: 'hook', dur: 2.0, kick: 'POV', text: 'You were the FIRST kid the van picked up', sub: 'at 6:05 AM 😴' },
    { t: 'route', dur: 6.0, cap: 'a free tour of Karachi. every. single. day.', mins: 85, sub: 'in the van before school' },
    { t: 'hook', dur: 2.4, text: 'Comment: were you first or last? 👇', sub: 'last = slept in, first = saw the sunrise' },
    { t: 'hook', dur: 2.2, dark: true, text: 'Now Ammi knows exactly where the van is.', sub: 'live, the whole route' },
    { t: 'end', dur: 2.6 },
  ] },

  // 5. 2005 vs 2026
  then: { title: 'School van: 2005 vs 2026', scenes: [
    { t: 'hook', dur: 1.8, text: 'School van, 2005 vs 2026', sub: 'so much has changed…' },
    { t: 'vs', dur: 6.6, cap: 'so much has changed… right? 🙃', left: '2005', right: '2026', rows: [
      ['Wait at the gate, no idea', 'Wait at the gate, no idea'],
      ['Call Van Uncle', 'Call Van Uncle'],
      ['"Bas 5 minute"', '"Bas 5 minute"'],
      ['Ammi stands at the window', 'Ammi stands at the window'],
    ] },
    { t: 'hook', dur: 2.0, dark: true, text: 'Some things never changed.', sub: 'until now' },
    { t: 'lock', dur: 3.0, cap: '2026, finally:', time: '7:12', notes: [
      ['Sara got in the van ✓', '7:12 · Van 1'],
      ['Sara reached school', '7:41'],
    ] },
    { t: 'end', dur: 2.6 },
  ] },

  // 6. Things every Karachi school van had (nostalgia list)
  vanthings: { title: 'Things every Karachi school van had', scenes: [
    { t: 'hook', dur: 1.8, kick: 'nostalgia', text: 'Things EVERY Karachi school van had', sub: 'how many do you remember?' },
    { t: 'list', dur: 8.4, cap: 'how many did YOUR van have? 👇', title: 'every school van:', items: [
      ['💺', 'One kid who ALWAYS got the front seat'],
      ['🎒', 'A mountain of bags at the back'],
      ['📻', "Uncle's FM, his song, his rules"],
      ['🚪', 'The door that needed two kids to close'],
      ['📿', 'Tasbeeh swinging on the mirror'],
      ['😴', 'The kid who slept the whole way'],
    ] },
    { t: 'hook', dur: 2.2, text: 'Comment your number 👇', sub: '6/6 = you were the front-seat kid' },
    { t: 'end', dur: 2.6, line: 'Same van. Now you know where it is.' },
  ] },

  // 7. For drivers (Urdu first)
  drivers: { title: 'Van wale bhai: no more 20 calls a morning', scenes: [
    { t: 'hook', dur: 2.0, kick: 'van wale bhaiyon ke liye', text: 'Subah 20 calls? 📞', sub: 'gaari chalate hue?' },
    { t: 'call', dur: 3.6, cap: 'har subah ka haal 😮‍💨', name: 'Ayesha ki Ammi', calls: 5, from: 428, to: 436 },
    { t: 'list', dur: 6.0, cap: 'Pohnch Driver: ek button, bas', title: 'ab aisa hoga:', items: [
      ['👆', 'Stop pe ek button dabayein'],
      ['🔔', 'Walidain ko khud pata chal jata hai'],
      ['📵', 'Driving ke dauran koi call nahi'],
      ['🆓', 'App bilkul free, hamesha'],
    ] },
    { t: 'hook', dur: 2.2, dark: true, text: 'Pohnch Driver. Free for every van.', sub: 'WhatsApp: 0300 1478729' },
    { t: 'end', dur: 2.6, line: 'Free for drivers. Calmer mornings.', bio: 'WhatsApp 0300 1478729' },
  ] },
  // 8. Forgot to tell Van Uncle about the sick day
  chutti: { title: 'Bacha bimaar, Van Uncle ko batana bhool gaye', scenes: [
    { t: 'hook', dur: 2.0, kick: '7:05 AM', text: 'Bacha bimaar. Van Uncle ko batana bhool gaye.', sub: 'what happens next:' },
    { t: 'hook', dur: 1.6, text: 'PAAAN PAAAN PAAAN 📢', sub: 'outside your gate' },
    { t: 'chat', dur: 5.6, cap: 'the whole gali knows now 🙈', group: 'Gali No. 4 Neighbours', avatar: '🏘️', members: 'Khala, Rizwan bhai, Aunty Shahida, you', unread: 23, from: 425, to: 431, msgs: [
      ['Aunty Shahida', 'Kis ka horn baj raha hai subah subah?', '#C2185B'],
      ['Rizwan bhai', 'Teesri baar 😤', '#1F5E54'],
      ['Khala', 'Uncle 10 minute se khare hain', '#7A5410'],
      ['You', 'SORRY!! Aaj chutti hai 🙈'],
    ] },
    { t: 'hook', dur: 2.2, dark: true, text: 'One tap: aaj chutti.', sub: 'Uncle sees it on his list. No horn.' },
    { t: 'lock', dur: 2.6, cap: 'tap once the night before 🌙', time: '9:40', day: 'Sunday, 23 November', notes: [
      ['Sara is off today', 'Imran sees it on tomorrow’s list'],
    ] },
    { t: 'end', dur: 2.6, bio: 'tag the neighbour with the horn complaints 😂' },
  ] },

  // 9. Karachi rain day
  rain: { title: 'Karachi rain + school van', scenes: [
    { t: 'hook', dur: 2.0, kick: 'Karachi rain day 🌧️', text: 'Baarish + school van =', sub: 'panic in every group 😭' },
    { t: 'chat', dur: 6.0, cap: 'every rain day in Karachi', group: 'Class 5-A Parents', avatar: '🌧️', unread: 61, from: 432, to: 446, msgs: [
      ['Farah', 'Shahrah-e-Faisal pe paani hi paani', '#C2185B'],
      ['Imran', 'Van kahan hai??', '#1F5E54'],
      ['Nadia', 'Uncle ka phone band ja raha hai', '#7A5410'],
      ['Farah', 'School khula bhi hai??', '#C2185B'],
      ['You', 'Koi update??'],
      ['Nadia', 'Nobody knows 😭', '#7A5410'],
    ] },
    { t: 'hook', dur: 2.0, dark: true, text: 'Late is okay. Not knowing is not.' },
    { t: 'lock', dur: 3.4, cap: 'Pohnch tells you WHY it’s late', time: '7:20', notes: [
      ['The van is running late · 15 min', 'Reason: road flooded near Nursery'],
      ['Sara got in the van ✓', '7:34 · Van 1'],
    ] },
    { t: 'end', dur: 2.6 },
  ] },

  // 10. The afternoon wait
  afternoon: { title: '1:30 PM: chhutti ho gayi, van kahan hai?', scenes: [
    { t: 'hook', dur: 2.0, kick: '1:30 PM', text: 'Chhutti ho gayi. Van kahan hai?', sub: 'Ammi at the window, again' },
    { t: 'call', dur: 3.8, cap: 'the afternoon version 🙃', name: 'Van Uncle 🚐', calls: 4, from: 810, to: 822 },
    { t: 'hook', dur: 1.8, dark: true, text: 'Or… just this:' },
    { t: 'lock', dur: 4.2, cap: 'school to your door, step by step', time: '1:42', day: 'Monday, 24 November', notes: [
      ['Sara left school', '1:42 · Van 1'],
      ['The van is 5 min from home', 'get the door'],
      ['Sara reached home ✓', '2:04'],
    ] },
    { t: 'end', dur: 2.6 },
  ] },
};
