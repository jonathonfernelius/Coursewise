
/* COURSEWISE — LIVING WHIMSY V5 */
/* PART 1 OF 2 — Paste Part 2 directly below this. */

(() => {
"use strict";

const THEMES = {
  northpole: {
    name: "The North Pole",
    words: ["Santa's Workshop","Today's Deliveries","Missed Deliveries",
      "This Week's Deliveries","The Gift List","Santa's Calendar",
      "The Cozy Workshop","The Elf Circle","Fellow Elves",
      "Find an Elf","Letters to Santa","Today's Deliveries","Unwrapped Gifts"],
    done: "Present Wrapped",
    cheer: "Spread Cheer",
    messages: ["Another present wrapped!","The elves are celebrating!",
      "The workshop is cheering you on!","A little Christmas magic, delivered."],
    rare: ["BREAKING: Local elf spotted absolutely crushing their to-do list.",
      "An anonymous reindeer would like you to know you're doing great.",
      "Elf management has approved an emergency cookie break.",
      "The workshop's Employee of the Month award is suspiciously shaped like you.",
      "Your productivity has been reported to the highest levels of elf management."],
    empty: ["The sleigh is packed. Time for cocoa.","Not a present left to wrap!"],
    overdueEmpty: ["No deliveries left behind!"],
    imported: "New deliveries have arrived at the workshop!",
    palette: ["#F45850","#79D57A","#F2C75B","#5FB9F5","#F18AB7"]
  },

  cottage: {
    name:"The Secret Garden",
    words:["The Morning Garden","Today's Blooms","Forgotten Seeds",
      "This Week's Harvest","The Garden Journal","The Almanac",
      "The Gardener's Cottage","Garden Party","Garden Neighbors",
      "Invite a Neighbor","Invitations","Today's Blooms",
      "Unplanted Seeds"],
    done:"In Full Bloom",
    cheer:"Send a Little Sunshine",
    messages:["Another little bloom!","Your garden is growing beautifully!",
      "The butterflies approve.","One more accomplishment has blossomed."],
    rare:["The mushroom council has declared a holiday in your honor.",
      "A hedgehog in a waistcoat is applauding your efforts."],
    empty:["The garden is resting. Nothing needs tending today.",
      "All the little blooms have been cared for."],
    overdueEmpty:["Not a single forgotten seed!"],
    imported:"Fresh seeds have arrived in your garden!",
    palette:["#9dbf93","#edbdd2","#eed58a"]
  },
  pirate: {
    name:"The High Seas",
    words:["Captain's Log","Today's Quests","Lost at Sea",
      "This Week's Voyage","The Quest Log","The Navigator's Chart",
      "Captain's Quarters","Crewmates","My Crew",
      "Recruit a Crewmate","Crew Requests","Today's Quests",
      "Uncharted Quests"],
    done:"Claimed Treasure",
    cheer:"Rally the Crew",
    messages:["Another quest conquered, Captain!","The crew rejoices!",
      "A fine day's work on the high seas.","Treasure secured!"],
    rare:["THE DREADED DISCUSSION BOARD HAS BEEN DEFEATED.",
      "A seagull stole your homework. Luckily, you'd finished it."],
    empty:["Calm seas ahead, Captain! Your quest log is clear.",
      "All aboard and accounted for."],
    overdueEmpty:["Not a single quest lost at sea!"],
    imported:"New orders aboard! Fresh quests have arrived.",
    palette:["#e8c47d","#77bacb","#f1dfb7"]
  },
  space: {
    name:"Project Athena",
    words:["Mission Control","Today's Missions","Off Course",
      "This Week's Expedition","The Mission Log","The Star Chart",
      "The Command Deck","Fellow Explorers","My Crew",
      "Find an Explorer","Incoming Signals","Today's Missions",
      "Unscheduled Missions"],
    done:"Mission Accomplished",
    cheer:"Transmit Encouragement",
    messages:["Mission accomplished, Commander!",
      "Houston, we have academic excellence!",
      "Athena approves of your strategy.","The galaxy applauds."],
    rare:["A small moon has been named in your honor. Paperwork pending.",
      "Mission Control has classified your productivity as legendary."],
    empty:["All systems clear. No missions remain.",
      "Mission Control reports a peaceful day."],
    overdueEmpty:["Every mission is on course!"],
    imported:"Incoming transmission: new missions detected!",
    palette:["#b7a6e4","#e8bde7","#e9d493"]
  },
  kingdom: {
    name:"The Royal Court",
    words:["Royal Decree","Today's Decrees","Unfinished Business",
      "The Royal Agenda","The Royal Ledger","The Royal Calendar",
      "Royal Chambers","The Court","My Subjects",
      "Welcome a Subject","Royal Petitions","Today's Decrees",
      "Unassigned Quests"],
    done:"Crown Achievements",
    cheer:"Bestow Royal Praise",
    messages:["Hear ye, hear ye! Another quest completed!",
      "The kingdom rejoices!","A most noble accomplishment!",
      "The royal council is impressed."],
    rare:["A bard has composed seventeen verses about your achievement.",
      "The royal goose approves of your efforts. HONK."],
    empty:["Hear ye, hear ye! The royal agenda is complete.",
      "The kingdom rests. Your duties are fulfilled."],
    overdueEmpty:["Every royal decree has been honored!"],
    imported:"A royal messenger brings new assignments!",
    palette:["#d9ba81","#c8abd9","#ecc0c9"]
  },
  west: {
    name:"Wild Wild West",
    words:["Frontier Report","Today's Roundup","Missed the Wagon",
      "This Week on the Trail","The Trail List","The Town Calendar",
      "The Homestead","The Saloon","Fellow Trailblazers",
      "Find a Trailblazer","Messages from the Frontier",
      "Today's Roundup","Uncharted Territory"],
    done:"Job Well Done, Partner",
    cheer:"Tip Your Hat",
    messages:["Yeehaw! Another job well done, partner!",
      "That trail's been conquered!","The whole town is cheering!",
      "Another task rounded up."],
    rare:["The sheriff declares you suspiciously productive.",
      "The railway company has named a locomotive after you."],
    empty:["A quiet day on the frontier, partner.",
      "Nothing left to round up today."],
    overdueEmpty:["No stragglers on the trail!"],
    imported:"The mail train delivered new assignments!",
    palette:["#dea875","#b8c692","#d5bc9d"]
  },
  dinos: {
    name:"Dino Days",
    words:["Jurassic Journal","Today's Tracks","Left in the Fossil Record",
      "This Week's Expedition","The Fossil Record",
      "The Dig Schedule","Base Camp","The Dig Site",
      "Fellow Explorers","Find an Explorer","Expedition Invitations",
      "Today's Discoveries","Uncatalogued Finds"],
    done:"Roarsome Work",
    cheer:"Send a Roar",
    messages:["ROARSOME! Another task is extinct!",
      "Another discovery for the fossil record!",
      "You just made prehistoric history.","The dig team celebrates!"],
    rare:["A tiny T. rex is clapping as best it can.",
      "Scientists have discovered Productivitysaurus rex."],
    empty:["The dig site is quiet today.",
      "Everything's catalogued. Time for a prehistoric snack."],
    overdueEmpty:["No missing fossils in sight!"],
    imported:"New discoveries have arrived at the dig site!",
    palette:["#9ebf9a","#ddba8b","#a3b9d6"]
  },
  faeries: {
    name:"The Fae Realm",
    words:["The Fairy Chronicle","Today's Enchantments",
      "Lost in the Woods","This Week's Spellbook","The Spellbook",
      "The Moon Calendar","The Enchanted Hollow",
      "The Fairy Circle","My Circle","Invite a Fairy Friend",
      "Winged Invitations","Today's Enchantments","Untold Wishes"],
    done:"Pure Magic",
    cheer:"Sprinkle a Little Magic",
    messages:["A little magic has been accomplished!",
      "The faeries are celebrating!","Another enchantment complete.",
      "Your magic is positively sparkling."],
    rare:["A unicorn has formally declared you magnificent.",
      "The fairy council grants you one imaginary wish."],
    empty:["All is peaceful in the enchanted glade.",
      "No spells left to cast today."],
    overdueEmpty:["Not a single lost enchantment!"],
    imported:"A winged messenger brings new assignments!",
    palette:["#e5b9ec","#bad8f4","#f2d4dd"]
  },
  sports: {
    name:"Game Day",
    words:["The Playbook","Today's Matchups","Behind Schedule",
      "Upcoming Matchups","The Game Plan","The Schedule Board",
      "The Locker Room","Team Huddle","The Roster",
      "Draft a Teammate","Trade Requests","Today's Matchups",
      "Unscheduled Plays"],
    done:"Scored!",
    cheer:"Cheer from the Sidelines",
    messages:["Another point on the board!","WHAT A PLAY!",
      "Your team is cheering!","That's a winning move."],
    rare:["The commentators are speechless. A historic moment.",
      "The mascot has performed a backflip in your honor."],
    empty:["The scoreboard is clear. Enjoy halftime.",
      "No plays left on the board today."],
    overdueEmpty:["A clean sheet! No missed plays."],
    imported:"Coach has added new assignments to the game plan!",
    palette:["#a1c3dd","#edc981","#a4c8ad"]
  },
  cars: {
    name:"Fast Lane",
    words:["Pit Report","Today's Laps","Running Behind",
      "The Road Ahead","The Roadmap","Race Schedule","The Garage",
      "The Pit Crew","My Crew","Add a Driver","Pit Requests",
      "Today's Stops","Unplanned Detours"],
    done:"Finish Line",
    cheer:"Wave the Checkered Flag",
    messages:["Another milestone in the rearview mirror!",
      "CHECKERED FLAG! Nice work.","Another lap completed!",
      "The pit crew is celebrating!"],
    rare:["Your homework just set a new lap record.",
      "The monster truck has performed a victory jump for you."],
    empty:["Open road ahead. No stops remaining!",
      "All errands safely parked for today."],
    overdueEmpty:["No missed exits!"],
    imported:"New assignments have pulled into the pit lane!",
    palette:["#e9b18c","#9bc0d0","#d6c2a2"]
  }
};

/* Inline vector illustrations — no extra image files. */
function svg(markup) {
  const source = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 360 240" fill="none">${markup}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(source)}")`;
}

const starfield = `
  <g fill="#fff" opacity=".8">
    <circle cx="25" cy="32" r="2"/><circle cx="88" cy="63" r="1.5"/>
    <circle cx="162" cy="27" r="2"/><circle cx="247" cy="44" r="2"/>
    <circle cx="313" cy="19" r="1.5"/><circle cx="66" cy="195" r="2"/>
    <circle cx="181" cy="184" r="1.5"/><circle cx="323" cy="203" r="2"/>
  </g>
  <g stroke="#e7ddff" stroke-width="2" opacity=".9">
    <path d="M120 51v18m-9-9h18M291 101v22m-11-11h22
             M205 142v16m-8-8h16"/>
  </g>`;

const waves = `
  <path d="M0 164Q45 130 90 164T180 164T270 164T360 164V240H0"
    fill="#8ac8d9" opacity=".35"/>
  <path d="M0 187Q45 155 90 187T180 187T270 187T360 187V240H0"
    fill="#51aac3" opacity=".45"/>
  <path d="M0 214Q45 180 90 214T180 214T270 214T360 214V240H0"
    fill="#337f9f" opacity=".5"/>`;

const ship = `
  <g stroke="#f3f0e1" stroke-width="3" opacity=".85">
    <path d="M251 53v120M251 63l-58 96h58Z"
      fill="#f6f1df" fill-opacity=".25"/>
    <path d="M261 81l47 77h-47Z" fill="#f6f1df" fill-opacity=".2"/>
    <path d="M180 174h146l-30 19h-88Z"
      fill="#e4c899" fill-opacity=".4"/>
  </g>`;

const blooms = `
  <g stroke="#c1e6c1" stroke-width="3" stroke-linecap="round">
    <path d="M265 240Q246 165 274 86"/>
    <path d="M313 240Q304 178 330 128"/>
    <path d="M225 240Q214 181 193 150"/>
  </g>
  <g fill="#a9d7ae">
    <path d="M261 176q-39-16-42-41 35 4 42 41"/>
    <path d="M273 135q32-5 39-34-34 5-39 34"/>
    <path d="M309 188q28-9 35-30-29 5-35 30"/>
  </g>
  <g fill="#f6d4e2" stroke="#fff3f7" stroke-width="2">
    <circle cx="276" cy="80" r="13"/>
    <circle cx="299" cy="86" r="12"/>
    <circle cx="289" cy="105" r="12"/>
    <circle cx="265" cy="104" r="12"/>
    <circle cx="327" cy="133" r="11"/>
    <circle cx="342" cy="146" r="10"/>
  </g>
  <g fill="#eec879"><circle cx="284" cy="92" r="9"/>
    <circle cx="334" cy="143" r="6"/></g>`;

const castle = `
  <g stroke="#e9d7b5" stroke-width="3"
     fill="#d6b994" fill-opacity=".52">
    <path d="M205 224V143h31v-27h24v27h32v81Z"/>
    <path d="M280 224V128h25v-24h23v24h22v96Z"/>
    <path d="M200 146l49-44 48 44M278 130l39-43 38 43"
      fill="#ebdabb" fill-opacity=".5"/>
  </g>
  <path d="M243 223v-36q13-22 26 0v36"
    fill="#c9a9cb" opacity=".65"/>
  <g fill="#f4e4c6" opacity=".8">
    <rect x="219" y="165" width="11" height="22" rx="5"/>
    <rect x="321" y="149" width="11" height="22" rx="5"/>
  </g>
  <g fill="#eedbab" opacity=".8">
    <path d="M143 0v64l16-13 15 13V0"/>
    <path d="M188 0v56l15-12 15 12V0"/>
  </g>`;

const train = `
  <g stroke="#9e755d" stroke-width="4" stroke-linejoin="round">
    <path d="M92 171h205v32H92Z" fill="#bf8469"/>
    <path d="M111 115h81v60h-81Z" fill="#a9a4aa"/>
    <path d="M192 142h63v33h-63Z" fill="#d0a17d"/>
    <path d="M115 104h72v12h-72Z" fill="#866e69"/>
    <path d="M225 98h22v45h-22Z" fill="#a27b67"/>
    <path d="M225 97h22l-5-20h-12Z" fill="#dbba8e"/>
    <circle cx="124" cy="203" r="17" fill="#5c6065"/>
    <circle cx="190" cy="203" r="17" fill="#5c6065"/>
    <circle cx="261" cy="203" r="17" fill="#5c6065"/>
  </g>
  <g fill="#f3d9c3" opacity=".6">
    <circle cx="234" cy="57" r="15"/>
    <circle cx="251" cy="41" r="19"/>
  </g>`;

const dinosaur = `
  <path d="M91 182Q60 123 116 96Q162 75 202 121
           L270 99Q303 91 293 121Q267 151 230 150
           L222 190H193L184 159 154 171 147 198H119
           L112 167 73 187Z"
    fill="#8fc2a4" stroke="#668d7d" stroke-width="4"/>
  <circle cx="261" cy="111" r="4" fill="#394f4b"/>
  <path d="M254 134q15 10 30-3"
    stroke="#668d7d" stroke-width="3"/>
  <g fill="#c4d8a4">
    <path d="M119 99l15-25 17 22 17-24 18 30 17-14 8 37"/>
  </g>
  <g stroke="#83ae8e" stroke-width="5">
    <path d="M35 240q2-83 39-112M320 240q-8-76-37-112"/>
  </g>`;

const unicorn = `
  <path d="M170 194Q127 171 132 124Q139 75 193 73
           L215 41 234 77Q269 88 280 115
           L243 144 234 195Z"
    fill="#f9f1f5" stroke="#bca7cc" stroke-width="4"/>
  <path d="M207 60l17-45 9 57"
    fill="#eac680" stroke="#cba876" stroke-width="3"/>
  <path d="M157 89Q135 37 193 42Q211 66 184 91"
    fill="#e7bfe3"/>
  <circle cx="253" cy="112" r="4" fill="#756784"/>
  <path d="M242 132q11 7 23 0"
    stroke="#bca7cc" stroke-width="3"/>
  <path d="M72 171Q125 47 252 53"
    stroke="#e5b9e9" stroke-width="10" opacity=".4"/>
  <path d="M76 183Q128 58 252 65"
    stroke="#f1d39b" stroke-width="9" opacity=".4"/>
  ${starfield}`;

const stadium = `
  <path d="M60 191V112h240v79"
    fill="#d3e2e3" fill-opacity=".45"
    stroke="#d4e7e6" stroke-width="4"/>
  <path d="M80 150h200M80 172h200"
    stroke="#d6e4ef" stroke-width="5"/>
  <rect x="147" y="66" width="76" height="49" rx="5"
    fill="#b9ced5" stroke="#e4e8e3" stroke-width="4"/>
  <path d="M164 84h18m12 0h18"
    stroke="#fff" stroke-width="5"/>
  <path d="M85 194h192"
    stroke="#f0eddd" stroke-width="5"/>
  <circle cx="280" cy="181" r="25"
    fill="#e6c783" stroke="#f4ead6" stroke-width="4"/>
  <path d="M255 181h50m-25-25v50"
    stroke="#ac8965" stroke-width="3"/>`;

const truck = `
  <g stroke-linejoin="round" stroke-width="4">
    <path d="M93 129h157l27 23v28H72v-26Z"
      fill="#303c3d" stroke="#617e75"/>
    <path d="M121 100h92l29 29H93Z"
      fill="#384348" stroke="#617e75"/>
    <path d="M139 105h60l18 22h-95Z"
      fill="#8a82ad"/>
    <path d="M99 154q25-40 48-8t51-8 51 10"
      stroke="#72cf68" stroke-width="8"/>
    <path d="M116 160l20-23 17 22 22-25 17 25"
      stroke="#b48cdb" stroke-width="5"/>
    <circle cx="124" cy="185" r="32"
      fill="#293036" stroke="#4e5860" stroke-width="5"/>
    <circle cx="236" cy="185" r="32"
      fill="#293036" stroke="#4e5860" stroke-width="5"/>
    <circle cx="124" cy="185" r="13" fill="#93a1a4"/>
    <circle cx="236" cy="185" r="13" fill="#93a1a4"/>
  </g>`;

const car = `
  <path d="M83 156h202v35H83Z"
    fill="#c6a2a1" stroke="#e9cfbd" stroke-width="4"/>
  <path d="M114 156l33-42h80l39 42"
    fill="#e3c0aa" stroke="#e9cfbd" stroke-width="4"/>
  <path d="M151 119h69l24 32H125Z"
    fill="#a6c8d5" opacity=".75"/>
  <circle cx="132" cy="194" r="22" fill="#51575a"/>
  <circle cx="244" cy="194" r="22" fill="#51575a"/>
  <circle cx="132" cy="194" r="9" fill="#adb9b9"/>
  <circle cx="244" cy="194" r="9" fill="#adb9b9"/>`;

/* DECK THE DIVS — North Pole illustration. The lights and elf stay in one compact background. */
function northPoleArtwork(state = "wrapping") {
  const bulbColors = ["#F45850","#F2C75B","#5FB9F5","#79D57A","#F18AB7"];
  const lights = Array.from({length:14},(_,i)=>{
    const x=8+i*26, t=x/360, y=13+60*t*(1-t);
    const color=bulbColors[i%bulbColors.length];
    return `<g transform="translate(${x} ${y})">
      <circle cy="11" r="15" fill="${color}" opacity=".20"/>
      <rect x="-3" y="-1" width="6" height="7" rx="1" fill="#182C20"/>
      <path d="M-4 10Q-4 5 0 5Q4 5 4 10L3 17Q0 21 -3 17Z" fill="${color}"/>
      <path d="M-1.5 9L-2 13" stroke="#FFF" stroke-width="1.4" opacity=".7"/>
    </g>`;
  }).join("");
  const elf = `<g transform="translate(222 96)">
    <rect x="69" y="83" width="42" height="39" rx="4" fill="#C94B52"/>
    <path d="M90 83V122M69 101H111" stroke="#F4C96F" stroke-width="6"/>
    <path d="M10 51Q18 9 48 4L71 42L62 57Z" fill="#B93D48"/>
    <circle cx="68" cy="42" r="8" fill="#FFF1D8"/>
    <circle cx="43" cy="62" r="27" fill="#F6C9A4"/>
    <path d="M17 54Q43 42 69 54" stroke="#FFF1D8" stroke-width="9" stroke-linecap="round"/>
    <path d="M18 65L5 54L10 77Z M68 65L81 54L76 77Z" fill="#F6C9A4"/>
    <circle cx="35" cy="62" r="2.5" fill="#342B26"/>
    <circle cx="52" cy="62" r="2.5" fill="#342B26"/>
    <path d="M37 74Q44 81 52 73" stroke="#8D5144" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="70" r="5" fill="#ECA59B" opacity=".5"/>
    <circle cx="62" cy="70" r="5" fill="#ECA59B" opacity=".5"/>
    <path d="M22 92Q43 79 65 92L73 124H13Z" fill="#5B8A64"/>
    <path d="M28 90L43 104L58 90" stroke="#F4C96F" stroke-width="4"/>
    <circle cx="43" cy="112" r="3" fill="#F4C96F"/>
    <path d="M18 100L5 115M68 100L80 112" stroke="#F6C9A4" stroke-width="8" stroke-linecap="round"/>
    <path d="M29 124V139H20M57 124V139H66" stroke="#473A32" stroke-width="9" stroke-linecap="round"/>
  </g>`;
  const scenes = {
    planning: `<g transform="translate(247 145)">
      <rect width="44" height="78" rx="5" fill="#FFF1D4" stroke="#CDAE79" stroke-width="2"/>
      <path d="M10 15H34M10 27H34M10 39H34M10 51H34M10 63H29" stroke="#B58D6C" stroke-width="2"/>
      <path d="M9 8L12 11L17 5" stroke="#548A62" stroke-width="2"/>
    </g>`,
    wrapping: `<path d="M276 209Q256 193 271 183Q291 173 289 192" stroke="#F4C96F" stroke-width="3"/>
      <path d="M283 216Q299 206 308 219" stroke="#D95D68" stroke-width="3"/>`,
    stacking: `<g transform="translate(207 153)">
      <rect x="4" y="39" width="42" height="38" rx="3" fill="#B94C57"/>
      <path d="M25 39V77M4 57H46" stroke="#EBC76C" stroke-width="5"/>
      <rect x="13" y="5" width="35" height="32" rx="3" fill="#548A63"/>
      <path d="M30 5V37M13 20H48" stroke="#F8E7C4" stroke-width="4"/>
      <path d="M30 5Q7 -10 30 2Q51 -10 30 5" fill="#EBC76C"/>
    </g>`,
    mountain: `<g transform="translate(181 110)">
      <rect x="0" y="78" width="48" height="46" rx="3" fill="#B94C57"/>
      <path d="M24 78V124M0 99H48" stroke="#F4CA76" stroke-width="5"/>
      <rect x="48" y="85" width="38" height="39" rx="3" fill="#568E67"/>
      <path d="M67 85V124M48 103H86" stroke="#F9E3BD" stroke-width="5"/>
      <rect x="11" y="38" width="36" height="38" rx="3" fill="#D6AA5F"/>
      <path d="M29 38V76M11 55H47" stroke="#FFF4D8" stroke-width="5"/>
      <rect x="45" y="43" width="33" height="39" rx="3" fill="#B84A57"/>
      <path d="M61 43V82M45 62H78" stroke="#F4CA76" stroke-width="4"/>
      <rect x="23" y="5" width="39" height="31" rx="3" fill="#477F5C"/>
      <path d="M42 5V36M23 19H62" stroke="#F8DEAC" stroke-width="4"/>
    </g>`
  };
  const sleepy = `<g transform="translate(236 108)">
    <rect x="56" y="39" width="65" height="89" rx="5" fill="#A45345"/>
    <rect x="67" y="56" width="43" height="61" rx="3" fill="#352924"/>
    <rect x="51" y="33" width="75" height="12" rx="3" fill="#CF9868"/>
    <path d="M79 108Q67 91 80 78Q83 93 91 72Q107 91 99 108Z" fill="#F3B74E"/>
    <path d="M85 108Q79 96 90 88Q100 102 94 108Z" fill="#FFE39B"/>
    <path d="M9 76Q-3 59 15 47Q27 19 46 24L54 63Z" fill="#B94C57"/>
    <circle cx="45" cy="65" r="20" fill="#F5C9A4"/>
    <path d="M26 57Q45 49 64 57" stroke="#FFF2DA" stroke-width="7" stroke-linecap="round"/>
    <circle cx="54" cy="31" r="7" fill="#FFF2DA"/>
    <path d="M33 65Q38 70 43 65M48 65Q53 70 58 65" stroke="#785048" stroke-width="2.5"/>
    <path d="M41 76Q46 80 51 76" stroke="#A16A5C" stroke-width="2"/>
    <path d="M22 88Q46 77 72 92L79 126H9Z" fill="#67916A"/>
    <path d="M15 109Q45 99 75 113" stroke="#F4D19A" stroke-width="4"/>
    <rect x="3" y="119" width="16" height="15" rx="3" fill="#EBC7A4"/>
    <path d="M19 122Q30 122 25 131L19 132" stroke="#EBC7A4" stroke-width="3"/>
    <g fill="#F8E8CC" font-family="sans-serif"><text x="3" y="45" font-size="11">z</text>
      <text x="12" y="30" font-size="15">z</text><text x="27" y="14" font-size="19">Z</text></g>
  </g>`;
  return svg(`<path d="M0 13Q180 43 360 13" stroke="#182C20" stroke-width="2.5"/>
    ${lights}${state === "done" ? sleepy : `${scenes[state] || ""}${elf}`}`);
}

window.CoursewiseNorthPoleArt = northPoleArtwork;

const ART = {
  northpole: {hero:northPoleArtwork(),scene:northPoleArtwork("stacking"),trim:northPoleArtwork()},
  cottage:{
    hero:svg(blooms),
    scene:svg(`<g fill="#b1d1a3"><path d="M0 230h360v10H0Z"/></g>
      <g fill="#c78073"><path d="M75 193q8-74 63-77t66 77Z"/>
      <path d="M218 209q7-42 43-45t42 45Z"/></g>
      <g fill="#f5e8cf"><path d="M117 193h38v44h-38Z"/>
      <path d="M247 209h27v27h-27Z"/></g>
      <g fill="#fff3df"><circle cx="135" cy="147" r="9"/>
      <circle cx="163" cy="177" r="6"/>
      <circle cx="262" cy="187" r="5"/></g>`),
    trim:svg(blooms)
  },
  pirate:{
    hero:svg(waves+ship),
    scene:svg(`<g stroke="#b9a06c" stroke-width="5">
      <circle cx="171" cy="119" r="75"/>
      <path d="M171 30v178M82 119h178M107 55l128 128
       M107 183 235 55"/></g>
       <path d="M171 55l18 64-18 64-18-64Z" fill="#e1c487"/>`),
    trim:svg(waves)
  },
  space:{
    hero:svg(`${starfield}
      <defs><radialGradient id="neb">
      <stop stop-color="#c1a5ec" stop-opacity=".7"/>
      <stop offset="1" stop-color="#8271bf" stop-opacity="0"/>
      </radialGradient></defs>
      <ellipse cx="252" cy="106" rx="124" ry="100" fill="url(#neb)"/>
      <circle cx="265" cy="173" r="33" fill="#aa96d8"/>
      <ellipse cx="265" cy="173" rx="64" ry="19"
      transform="rotate(-24 265 173)"
      stroke="#e8c7e2" stroke-width="7"/>`),
    scene:svg(`${starfield}
      <circle cx="180" cy="136" r="68" fill="#bdaadd"/>
      <ellipse cx="180" cy="136" rx="125" ry="30"
      transform="rotate(-24 180 136)"
      stroke="#ebceae" stroke-width="10"/>`),
    trim:svg(starfield)
  },
  kingdom:{
    hero:svg(castle),
    scene:svg(castle),
    trim:svg(`<path d="M40 47h280M70 48v94l30-21 30 21V48
      M171 48v94l30-21 30 21V48"
      fill="#d8bbd4" stroke="#c8aa7b" stroke-width="4"/>`)
  },
  west:{
    hero:svg(`<circle cx="294" cy="58" r="40"
      fill="#f5d5a0" opacity=".6"/>${train}`),
    scene:svg(train),
    trim:svg(`<path d="M20 202h320M20 223h320"
      stroke="#b78c6d" stroke-width="5"/>
      <path d="M45 201v24m55-24v24m55-24v24
      m55-24v24m55-24v24m55-24v24"
      stroke="#b78c6d" stroke-width="6"/>`)
  },
  dinos:{
    hero:svg(dinosaur),
    scene:svg(dinosaur),
    trim:svg(`<g stroke="#8ab18b" stroke-width="5">
      <path d="M35 236q0-90 52-151
      M325 236q0-90-52-151"/></g>`)
  },
  faeries:{
    hero:svg(unicorn),
    scene:svg(unicorn),
    trim:svg(starfield)
  },
  sports:{
    hero:svg(stadium),
    scene:svg(stadium),
    trim:svg(`<g fill="#ecd9a3" opacity=".8">
      <path d="M180 51l18 36 39 6-28 28 6 38
      -35-18-35 18 6-38-28-28 39-6Z"/></g>`)
  },
  cars:{
    hero:svg(`${car}<path d="M30 221h300"
      stroke="#ead9bc" stroke-width="4"
      stroke-dasharray="19 14"/>`),
    scene:svg(truck),
    trim:svg(`<path d="M15 185h330M15 210h330"
      stroke="#b8c2c4" stroke-width="5"/>
      <path d="M35 198h290" stroke="#f1daa7"
      stroke-width="4" stroke-dasharray="15 12"/>`)
  }
};

/* Main Whimsy styles. */
const style = document.createElement("style");
style.id = "coursewise-whimsy-v5";

style.textContent = `
  .cw-w-settings {
    border-top:1px solid var(--border);
    padding-top:1rem;
    margin-top:1rem;
  }
  .cw-w-picker {
    margin-top:.85rem;
    padding:.9rem;
    border-radius:12px;
    background:var(--muted,var(--bg));
  }
  .cw-w-picker[hidden] { display:none!important; }
  .cw-w-picker label {
    display:block;
    font-weight:650;
    margin-bottom:.55rem;
  }
  .cw-w-picker select {
    width:100%;
    min-height:43px;
    border:1px solid var(--border);
    border-radius:10px;
    background:var(--card,#fff);
    color:var(--fg,inherit);
    padding:.55rem .75rem;
    font:inherit;
  }
  .cw-w-picker small {display:block;margin-top:.5rem;}

  html[data-whimsy]:not([data-whimsy=off]) .hero {
    position:relative;
    isolation:isolate;
    overflow:hidden;
    background-image:var(--cw-w-hero),
      linear-gradient(135deg,var(--primary-dark),var(--primary));
    background-size:auto 100%,cover;
    background-position:right bottom,center;
    background-repeat:no-repeat;
  }
  html[data-whimsy=space] .hero {
    background-image:var(--cw-w-hero),
      radial-gradient(ellipse at 78% 34%,#5b4f99,transparent 68%),
      linear-gradient(120deg,#151c40,#383166)!important;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero::after {
    display:none!important;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero > * {
    position:relative;
    z-index:2;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero .hero-stat {
    z-index:5;
    position:relative;
    opacity:1!important;
    visibility:visible!important;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero .streak-chip {
    z-index:5;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero h2,
  html[data-whimsy]:not([data-whimsy=off]) .hero p {
    position:relative;
    z-index:4;
  }
  html[data-whimsy]:not([data-whimsy=off]) .hero::before {
    content:"";
    position:absolute;
    top:0;
    right:0;
    width:43%;
    height:100px;
    background:linear-gradient(90deg,transparent,rgba(16,29,47,.18));
    pointer-events:none;
  }
  html[data-whimsy]:not([data-whimsy=off]) .page-head h1::after {
    content:"";
    display:inline-block;
    width:51px;
    height:41px;
    margin-left:12px;
    vertical-align:middle;
    background:var(--cw-w-trim) center/contain no-repeat;
    opacity:.7;
  }
  html[data-whimsy]:not([data-whimsy=off])
  .card:not(.overdue-card):not(.cw-f-card) {
    position:relative;
    isolation:isolate;
  }
  html[data-whimsy]:not([data-whimsy=off])
  .card:not(.overdue-card):not(.cw-f-card)::before {
    content:"";
    position:absolute;
    right:5px;
    bottom:3px;
    width:58px;
    height:54px;
    background:var(--cw-w-trim) center/contain no-repeat;
    opacity:.15;
    pointer-events:none;
    z-index:0;
  }
  html[data-whimsy=pirate] .list-card::after {
    content:"";
    display:block;
    height:14px;
    opacity:.24;
    background:var(--cw-w-trim) bottom/120px 80px repeat-x;
    pointer-events:none;
  }
  html[data-whimsy=space] .page-head {
    background-image:
      radial-gradient(circle at 8% 25%,#b0a1d5 1px,transparent 2px),
      radial-gradient(circle at 63% 70%,#c4b6e0 1px,transparent 2px);
    background-size:160px 95px;
  }

  .cw-w-scene {
    position:absolute;
    inset:0;
    z-index:0;
    overflow:hidden;
    pointer-events:none;
  }
  .cw-w-art {
    position:absolute;
    left:var(--left);
    top:var(--top);
    width:var(--size);
    height:var(--size);
    background:var(--image) center/contain no-repeat;
    opacity:var(--opacity,.58);
    transform:rotate(var(--angle,0deg));
    pointer-events:none;
  }
  .cw-w-scene-host {
    position:relative;
    isolation:isolate;
  }
  .cw-w-scene-host > :not(.cw-w-scene) {
    position:relative;
    z-index:1;
  }
  body[data-page=profile] .cw-w-scene {
    top:var(--cw-w-canvas-end,520px);
    height:370px;
  }
  .cw-w-friend-art {
    width:54px;
    height:40px;
    background:var(--cw-w-trim) center/contain no-repeat;
    opacity:.6;
    pointer-events:none;
  }
  .cw-w-progress {
    display:flex;
    align-items:center;
    gap:6px;
    position:absolute!important;
    bottom:8px;
    right:19px;
    z-index:3!important;
    pointer-events:none;
  }
  .cw-w-progress i {
    width:8px;
    height:8px;
    display:block;
    border-radius:50%;
    border:1px solid #fffa;
    background:transparent;
  }
  .cw-w-progress i.on {background:#fff;}

  .cw-w-celebration {
    position:fixed;inset:0;z-index:9999;pointer-events:none;
  }
  .cw-w-message {
    position:absolute;top:min(13vh,105px);left:50%;
    transform:translateX(-50%);
    max-width:min(90vw,470px);
    width:max-content;
    padding:1rem 1.3rem;
    text-align:center;
    font-weight:700;
    border-radius:16px;
    border:2px solid var(--primary);
    background:var(--card,#fff);
    color:var(--fg,#233);
    box-shadow:0 12px 32px #0002;
    animation:cw-w-appear .35s ease-out both;
  }
  .cw-w-particle {
    position:absolute;
    top:-15px;
    left:var(--x);
    width:9px;height:12px;
    background:var(--tone);
    border-radius:2px;
    animation:cw-w-fall 2.4s var(--delay) ease-out both;
  }
  .cw-w-celebration.firework .cw-w-particle {
    top:30vh;
    border-radius:50%;
    animation:cw-w-burst 1.4s var(--delay) ease-out both;
  }
  .cw-w-checkbox-pop {animation:cw-w-pulse .55s ease-out;}
  @keyframes cw-w-appear {
    from{opacity:0;translate:0 -16px;scale:.94}
    to{opacity:1;translate:0 0;scale:1}
  }
  @keyframes cw-w-fall {
    0%{opacity:0;transform:translateY(0) rotate(0)}
    20%,80%{opacity:1}
    100%{opacity:0;transform:translate(var(--dx),90vh) rotate(640deg)}
  }
  @keyframes cw-w-burst {
    0%{opacity:0;transform:scale(.2)}
    25%{opacity:1}
    100%{opacity:0;transform:translate(var(--dx),40vh) scale(.1)}
  }
  @keyframes cw-w-pulse {
    0%{filter:brightness(1);scale:1}
    45%{filter:brightness(1.3);scale:1.18}
    100%{filter:brightness(1);scale:1}
  }
  @media(max-width:1100px) {
    .cw-w-scene {display:none!important;}
  }
  @media(max-width:560px) {
    html[data-whimsy]:not([data-whimsy=off]) .hero {
      background-size:auto 75%,cover;
    }
  }
  @media(prefers-reduced-motion:reduce) {
    .cw-w-particle{display:none!important}
    .cw-w-message,.cw-w-checkbox-pop{animation:none!important}
  }
`;
document.head.appendChild(style);

/* PART 2 BEGINS IMMEDIATELY BELOW THIS LINE. */


/* COURSEWISE — LIVING WHIMSY V5 */
/* PART 2 OF 2 */

const root = document.documentElement;
const STORAGE = "coursewise-whimsy-demo:";
let account = null;
let config = {enabled:false,theme:"cottage"};
let scheduled = false;
let sceneSignature = "";

function accountKey() {
  const state = window.Tidy?.state;
  return state?.signedIn && state.user?.email
    ? STORAGE + state.user.email.toLowerCase() : "";
}

function syncAccount() {
  const next = accountKey();
  if (next === account) return;

  account = next;
  let old = {};
  try {
    old = next ? JSON.parse(localStorage.getItem(next) || "{}") : {};
  } catch {}

  config = {
    enabled:old?.enabled === true,
    theme:THEMES[old?.theme] ? old.theme : "cottage"
  };
  sceneSignature = "";
}

function selected() {
  return config.enabled ? THEMES[config.theme] : null;
}

function save(patch) {
  syncAccount();
  config = {...config,...patch};

  if (account) {
    try {
      localStorage.setItem(account,JSON.stringify(config));
    } catch {}
  }

  sceneSignature = "";
  render();
}

/* Remember a daily prototype progress counter.
   These are successful completions in this browser,
   not a new database field or a cross-device count. */
function todayKey() {
  return window.Tidy?.toKey?.(new Date()) ||
    new Date().toLocaleDateString("en-CA");
}

function progressKey() {
  return account + ":living-whimsy:" + todayKey();
}

function progress() {
  if (!account) return 0;
  try {
    return Math.min(5,Math.max(0,
      Number(localStorage.getItem(progressKey())) || 0
    ));
  } catch { return 0; }
}

function advanceProgress() {
  if (!account) return;
  try {
    localStorage.setItem(progressKey(),
      String(Math.min(5,progress()+1)));
  } catch {}
}

/* Preserve original labels when Whimsy Mode is disabled. */
const LABELS = [
  ['body[data-page="home"] .hero small',0],
  ['body[data-page="home"] .today-card .section-head h2',1],
  ['body[data-page="home"] .overdue-card .section-head h2',2],
  ['body[data-page="home"] .week-card .section-head h2',3],
  ['body[data-page="todo"] .page-head h1',4],
  ['body[data-page="calendar"] .page-head h1',5],
  ['body[data-page="profile"] .page-head h1',6],
  [".cw-f-panel-head #cw-f-title",7],
  [".cw-f-trigger-label",7],
  ['.cw-f-tabs [data-f-tab="friends"]',8],
  ['.cw-f-tabs [data-f-tab="add"]',9],
  ['.cw-f-tabs [data-f-tab="requests"]',10],
  ['body[data-page="calendar"] .table-card:nth-of-type(2) .section-head h2',11],
  ['body[data-page="calendar"] .table-card:nth-of-type(3) .section-head h2',12]
];

function replaceLabel(el,replacement) {
  const textNode = [...el.childNodes].find(node =>
    node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()
  );
  if (!textNode) return;

  if (!el.dataset.cwWhimsyOriginal) {
    el.dataset.cwWhimsyOriginal = textNode.nodeValue
      .replace(/\s*\(\d+\)\s*$/,"").trim();
  }

  const count = textNode.nodeValue.match(/\s*\(\d+\)/)?.[0] || "";
  const next = (replacement || el.dataset.cwWhimsyOriginal) + count;

  if (textNode.nodeValue.trim() !== next) {
    textNode.nodeValue = next;
  }
}

function updateWords() {
  const theme = selected();

  for (const [selector,index] of LABELS) {
    document.querySelectorAll(selector).forEach(el =>
      replaceLabel(el,theme?.words[index])
    );
  }

  document.querySelectorAll(".cw-f-card h2").forEach(el =>
    replaceLabel(el,theme?.words[7])
  );

  /* Update cheer wording without replacing click handlers. */
  document.querySelectorAll(".cw-f-cheer:not(:disabled)")
    .forEach(button => {
      const node = [...button.childNodes].find(n =>
        n.nodeType === Node.TEXT_NODE && n.nodeValue.trim()
      );
      if (!node) return;

      if (!button.dataset.cwWhimsyOriginal) {
        button.dataset.cwWhimsyOriginal = node.nodeValue.trim();
      }

      const next = theme?.cheer ||
        button.dataset.cwWhimsyOriginal;

      if (node.nodeValue.trim() !== next)
        node.nodeValue = " " + next;
    });
}

/* Stable daily messages for supported empty states. */
function dailyMessage(theme,kind,bank) {
  if (!bank?.length) return "";

  const key = account + ":whimsy-message:" +
    config.theme + ":" + kind + ":" + todayKey();

  let index = 0;
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) {
      index = Math.floor(Math.random()*bank.length);
      localStorage.setItem(key,String(index));
    } else {
      index = Number(saved) || 0;
    }
  } catch {}

  return bank[Math.abs(index)%bank.length];
}

function updateEmptyStates() {
  const theme = selected();

  const supported = {
    "Nothing due today. Enjoy it.":"empty",
    "Nothing due today.":"empty",
    "Nothing due this day.":"empty",
    "No tasks in this list.":"empty",
    "You're all caught up.":"overdueEmpty"
  };

  document.querySelectorAll(".empty,.week-empty").forEach(el => {
    if (!el.dataset.cwWhimsyEmptyOriginal)
      el.dataset.cwWhimsyEmptyOriginal = el.textContent.trim();

    const original = el.dataset.cwWhimsyEmptyOriginal;
    const kind = supported[original];
    if (!kind) return;

    const next = theme
      ? dailyMessage(theme,kind,theme[kind]) : original;

    if (el.textContent.trim() !== next) el.textContent = next;
  });
}

/* Whimsy controls sit BELOW Show Completed Tasks. */
function mountSettings() {
  const row = document.querySelector("#p-done")
    ?.closest(".switch-row");

  if (!row) return;

  let panel = document.querySelector("#cw-w-settings");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "cw-w-settings";
    panel.className = "cw-w-settings";

    panel.innerHTML = `
      <div class="switch-row">
        <div>
          <label for="cw-w-on">Whimsy Mode</label>
          <small>
            Give Coursewise a little extra personality.
            Your colors and layout stay the same.
          </small>
        </div>
        <span class="switch">
          <input type="checkbox" id="cw-w-on">
          <span></span>
        </span>
      </div>

      <div class="cw-w-picker" id="cw-w-picker" hidden>
        <label for="cw-w-theme">Choose your whimsy theme</label>
        <select id="cw-w-theme">
          ${Object.entries(THEMES).map(([key,theme]) =>
            `<option value="${key}">${theme.name}</option>`
          ).join("")}
        </select>
        <small>Your whimsical world can change whenever you like.</small>
      </div>
    `;

    
    const appearanceCard = document.querySelector(".appearance-options")
    ?.closest("section.card");

    if (appearanceCard) {
    appearanceCard.appendChild(panel);
    } else {
    row.insertAdjacentElement("afterend", panel);
}


    panel.querySelector("#cw-w-on")
      .addEventListener("change",e =>
        save({enabled:e.target.checked})
      );

    panel.querySelector("#cw-w-theme")
      .addEventListener("change",e =>
        save({theme:e.target.value})
      );
  }

  panel.querySelector("#cw-w-on").checked = config.enabled;
  panel.querySelector("#cw-w-theme").value = config.theme;
  panel.querySelector("#cw-w-picker").hidden = !config.enabled;
}

/* Each page gets a different amount of background artwork. */
const SCENES = {
  todo:[
    [79,145,180,.68],
    [10,390,100,.27],
    [82,590,155,.52]
  ],
  profile:[
    [8,40,190,.75],
    [54,220,125,.45]
  ],
  calendar:[
    [87,390,120,.39]
  ],
  home:[
    [87,450,75,.25]
  ]
};

function createBackground(host,page,themeKey) {
  const scene = document.createElement("div");
  scene.className = "cw-w-scene";
  scene.setAttribute("aria-hidden","true");

  const positions = SCENES[page] || [];

  positions.forEach(([left,top,size,opacity],i) => {
    const piece = document.createElement("i");
    piece.className = "cw-w-art";

    piece.style.setProperty("--left",left+"%");
    piece.style.setProperty("--top",top+"px");
    piece.style.setProperty("--size",size+"px");
    piece.style.setProperty("--opacity",String(opacity));

    const illustration = i===1
      ? ART[themeKey].trim
      : ART[themeKey].scene;

    piece.style.setProperty("--image",illustration);
    piece.style.setProperty("--angle",((i-1)*7)+"deg");

    scene.appendChild(piece);
  });

  host.classList.add("cw-w-scene-host");
  host.appendChild(scene);
}

function updateScenes() {
  const theme = selected();
  const page = document.body?.dataset.page;

  const host = page === "profile"
    ? document.querySelector(".two-col > .col:first-child")
    : document.querySelector("#main > .container");

  const signature = [
    account,config.enabled,config.theme,page,!!host
  ].join("|");

  if (sceneSignature === signature &&
      (!theme || host?.querySelector(":scope > .cw-w-scene")))
    return;

  document.querySelectorAll(
    ".cw-w-scene,.cw-w-progress,.cw-w-friend-art"
  ).forEach(el => el.remove());

  sceneSignature = signature;
  if (!theme) return;

  const artwork = ART[config.theme];
  root.style.setProperty("--cw-w-hero",artwork.hero);
  root.style.setProperty("--cw-w-trim",artwork.trim);

  if (host && SCENES[page]) {
    if (page === "profile") {
      const canvas = host.querySelector("#canvas");
      if (canvas) {
        host.style.setProperty("--cw-w-canvas-end",
          (canvas.offsetTop+canvas.offsetHeight+25)+"px");
      }
    }
    createBackground(host,page,config.theme);
  }

  const hero = document.querySelector(".hero");

  if (hero && page === "home") {
    const progressArt = document.createElement("div");
    progressArt.className = "cw-w-progress";
    progressArt.setAttribute("aria-hidden","true");

    for (let i=0;i<5;i++) {
      const dot = document.createElement("i");
      dot.classList.toggle("on",i<progress());
      progressArt.appendChild(dot);
    }
    hero.appendChild(progressArt);
  }

  const friends = document.querySelector(".cw-f-panel-head");
  if (friends) {
    const art = document.createElement("i");
    art.className = "cw-w-friend-art";
    art.setAttribute("aria-hidden","true");
    art.style.setProperty("--cw-w-trim",ART[config.theme].trim);
    friends.appendChild(art);
  }
}

function updateProgress() {
  document.querySelectorAll(".cw-w-progress i")
    .forEach((dot,i) =>
      dot.classList.toggle("on",i<progress())
    );
}

/* A small theme-specific completion flourish. */
function checkboxFlourish(id) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches)
    return;

  const control = [...document.querySelectorAll(
    "[data-toggle],[data-task-id]"
  )].find(el =>
    String(el.dataset.toggle || el.dataset.taskId) === String(id)
  );

  if (!control) return;

  control.classList.remove("cw-w-checkbox-pop");
  void control.offsetWidth;
  control.classList.add("cw-w-checkbox-pop");

  setTimeout(() => control.classList.remove("cw-w-checkbox-pop"),700);
}

/* Confetti, occasional fireworks, and rare themed messages. */
function celebrate() {
  const theme = selected();
  if (!theme) return;

  document.querySelector(".cw-w-celebration")?.remove();

  const rare = Math.random()<.05;
  const bank = rare ? theme.rare : theme.messages;

  const overlay = document.createElement("div");
  overlay.className = "cw-w-celebration";

  if (Math.random()<.16) overlay.classList.add("firework");

  const message = document.createElement("div");
  message.className = "cw-w-message";
  message.setAttribute("role","status");
  message.textContent = bank[Math.floor(Math.random()*bank.length)];
  overlay.appendChild(message);

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i=0;i<30;i++) {
      const particle = document.createElement("i");
      particle.className = "cw-w-particle";

      particle.style.setProperty("--x",Math.random()*100+"vw");
      particle.style.setProperty("--dx",
        (Math.random()*180-90)+"px");
      particle.style.setProperty("--delay",
        Math.random()*.3+"s");
      particle.style.setProperty("--tone",
        theme.palette[i%theme.palette.length]);

      overlay.appendChild(particle);
    }
  }

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(),3800);
}

/* Hook into successful task completions only. */
function patchTaskCompletion() {
  const T = window.Tidy;
  if (!T?.toggleTask || T.toggleTask.__cwWhimsyV5) return;

  const original = T.toggleTask;

  const wrapped = async function(id,...args) {
    const task = T.state.tasks.find(t =>
      String(t.id) === String(id)
    );
    const wasIncomplete = !!task && !task.done;

    const result = await original.call(this,id,...args);

    if (wasIncomplete && result?.done === true && selected()) {
      advanceProgress();
      celebrate();
      checkboxFlourish(id);
      updateProgress();
    }

    return result;
  };

  wrapped.__cwWhimsyV5 = true;
  T.toggleTask = wrapped;
}

/* Theme friendly import messages without obscuring actual counts. */
function patchNotifications() {
  const ui = window.Tidy?.ui;
  if (!ui?.toast || ui.toast.__cwWhimsyV5) return;

  const original = ui.toast;

  const wrapped = function(message,...args) {
    const theme = selected();
    const text = String(message);

    const isCanvasImport =
      /new assignments imported|Canvas assignments imported successfully/i
        .test(text);

    const themed = theme && isCanvasImport
      ? theme.imported + " " + text : message;

    return original.call(this,themed,...args);
  };

  wrapped.__cwWhimsyV5 = true;
  ui.toast = wrapped;
}

function render() {
  syncAccount();

  const theme = selected();
  const value = theme ? config.theme : "off";

  if (root.dataset.whimsy !== value)
    root.dataset.whimsy = value;

  patchTaskCompletion();
  patchNotifications();
  updateWords();
  updateEmptyStates();
  mountSettings();
  updateScenes();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    scheduled = false;
    render();
  });
}

function initialize() {
  const main = document.querySelector("#main");

  if (main) {
    new MutationObserver(schedule).observe(main,{
      childList:true,
      subtree:true
    });
  }

  /* The Friends popup may be outside #main. */
  new MutationObserver(schedule).observe(document.body,{
    childList:true,
    subtree:true
  });

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded",initialize,{once:true});
} else {
  initialize();
}

window.CoursewiseWhimsy = {
  themes:THEMES,
  config:() => ({...config}),
  celebrate,
  apply:render
};

})();


/* ==============================================
   COURSEWISE WHIMSY V5.1
   Snapshot layering + Friends display repair
   Paste at the END of js/theme.js
   ============================================== */

(() => {
  "use strict";

  if (window.CoursewiseWhimsyRepair) return;
  window.CoursewiseWhimsyRepair = true;

  const style = document.createElement("style");
  style.id = "cw-whimsy-v51-repair";

  style.textContent = `

    /* =========================================
       1. DAILY SNAPSHOT LAYERS
       ========================================= */

    html[data-whimsy]:not([data-whimsy="off"]) .hero {
      position: relative !important;
      isolation: isolate;
      overflow: hidden;
    }

    /* Keep all original information in front. */
    html[data-whimsy]:not([data-whimsy="off"])
      .hero > :not(.cw-w-progress) {
      z-index: 3;
    }

    /* Restore the top-right task statistic
       to its own position, outside normal flow. */
    html[data-whimsy]:not([data-whimsy="off"])
      .hero .hero-stat {
      position: absolute !important;
      top: 28px;
      right: 32px;
      bottom: auto;
      left: auto;
      z-index: 5 !important;
      margin: 0;
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Protect the heading, supporting message,
       and streak from decorative layering. */
    html[data-whimsy]:not([data-whimsy="off"])
      .hero h2,
    html[data-whimsy]:not([data-whimsy="off"])
      .hero p,
    html[data-whimsy]:not([data-whimsy="off"])
      .hero small,
    html[data-whimsy]:not([data-whimsy="off"])
      .hero .streak-chip {
      position: relative;
      z-index: 4 !important;
    }

    /* Artwork is a background, NEVER a
       layout element that can push text down. */
    html[data-whimsy]:not([data-whimsy="off"])
      .hero::before,
    html[data-whimsy]:not([data-whimsy="off"])
      .hero::after {
      pointer-events: none !important;
    }

    /* Give text a safe zone and keep the
       illustrations toward the bottom-right. */
    html[data-whimsy="cottage"] .hero,
    html[data-whimsy="kingdom"] .hero,
    html[data-whimsy="west"] .hero,
    html[data-whimsy="dinos"] .hero,
    html[data-whimsy="faeries"] .hero,
    html[data-whimsy="sports"] .hero,
    html[data-whimsy="cars"] .hero {
      background-size: auto 83%, cover !important;
      background-position: right bottom, center !important;
      background-repeat: no-repeat !important;
    }

    /* Keep Pirate and Space at full size.
       Their artwork was already working well. */
    html[data-whimsy="pirate"] .hero,
    html[data-whimsy="space"] .hero {
      background-size: auto 100%, cover !important;
      background-position: right bottom, center !important;
    }

    /* Remove the five-dot prototype progress
       indicator. Preserve the actual task count. */
    .cw-w-progress {
      display: none !important;
    }

    /* =========================================
       2. FRIENDS POPUP LAYOUT
       ========================================= */

    /* Shorter action labels should never grow
       wider than the space available. */
    .cw-f-cheer {
      flex-shrink: 0;
      white-space: nowrap;
      max-width: 115px;
      box-sizing: border-box;
    }

    /* Keep the three navigation tabs balanced. */
    .cw-f-tabs {
      display: grid !important;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 4px;
    }

    .cw-f-tabs [data-f-tab] {
      min-width: 0 !important;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-left: 5px;
      padding-right: 5px;
      box-sizing: border-box;
    }

    /* =========================================
       3. RESPONSIVE SAFEGUARDS
       ========================================= */

    @media (max-width: 650px) {
      html[data-whimsy]:not([data-whimsy="off"])
        .hero .hero-stat {
        top: 18px;
        right: 18px;
      }

      html[data-whimsy]:not([data-whimsy="off"])
        .hero {
        background-size: auto 65%, cover !important;
      }

      .cw-f-cheer {
        max-width: 100px;
      }
    }

  `;

  document.head.appendChild(style);

  /* =========================================
     4. SHORTEN THE THEMED FRIENDS LABELS
     ========================================= */

  const whimsy = window.CoursewiseWhimsy;

  if (!whimsy?.themes) return;

  const replacements = {
    cottage: {
      cheer: "Sunshine",
      tabs: ["Neighbors", "Invite", "Invitations"]
    },
    pirate: {
      cheer: "Ahoy!",
      tabs: ["My Crew", "Recruit", "Requests"]
    },
    space: {
      cheer: "Transmit",
      tabs: ["My Crew", "Explore", "Signals"]
    },
    kingdom: {
      cheer: "Royal Praise",
      tabs: ["Subjects", "Welcome", "Petitions"]
    },
    west: {
      cheer: "Yeehaw!",
      tabs: ["Trailblazers", "Find Friends", "Messages"]
    },
    dinos: {
      cheer: "Roar!",
      tabs: ["Explorers", "Find Friends", "Invitations"]
    },
    faeries: {
      cheer: "Sparkles",
      tabs: ["My Circle", "Invite", "Invitations"]
    },
    sports: {
      cheer: "Go Team!",
      tabs: ["The Roster", "Draft", "Requests"]
    },
    cars: {
      cheer: "Rev Up!",
      tabs: ["My Crew", "Add Driver", "Requests"]
    }
  };

  for (const [key, changes] of Object.entries(replacements)) {
    const theme = whimsy.themes[key];
    if (!theme) continue;

    theme.cheer = changes.cheer;

    // Existing theme word bank indices:
    // 8 = Friends tab
    // 9 = Add Friends tab
    // 10 = Requests tab
    theme.words[8] = changes.tabs[0];
    theme.words[9] = changes.tabs[1];
    theme.words[10] = changes.tabs[2];
  }

  // Reapply the selected theme with the new labels.
  whimsy.apply?.();

})();


/* COURSEWISE WHIMSY — AMBIENT DECOR V5.2
   Add below V5 + the V5.1 layout fix in js/theme.js.
   Visual-only: no task data, Snapshot content or Friends logic changes.
*/
(() => {
  "use strict";
  if (document.getElementById("cw-ambient-v52")) return;

  const shapes = {
    cottage: `
      <g stroke="#80aa83" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M42 83Q20 55 45 25M42 64Q63 50 60 30M42 50Q22 45 18 29"/>
        <path d="M297 271Q274 241 297 211M297 251Q322 238 319 216"/>
      </g>
      <g fill="#a8cda9"><path d="M42 61q-23-14-26-28 23 5 26 28Z"/>
        <path d="M44 46q18-20 24-20-2 21-24 20Z"/>
        <path d="M297 248q-24-15-24-25 25 5 24 25Z"/></g>
      <g fill="#e8b8ca" opacity=".85"><circle cx="204" cy="97" r="5"/><circle cx="213" cy="104" r="5"/>
        <circle cx="196" cy="105" r="5"/><circle cx="204" cy="112" r="5"/></g>
      <circle cx="204" cy="105" r="4" fill="#cfa45b"/>
      <g stroke="#c7b2d6" stroke-width="2" fill="#d8c9e5"><path d="M360 152q-24-29-29-2 4 12 24 9M364 154q25-29 25-2-5 13-24 9"/></g>
      <path d="M365 149v20" stroke="#90a88d" stroke-width="3"/>
    `,
    pirate: `
      <g stroke="#75afc3" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8">
        <path d="M18 71q15-14 30 0t30 0t30 0M28 89q15-14 30 0t30 0"/>
        <path d="M249 291q18-14 36 0t36 0t36 0M259 310q18-14 36 0t36 0"/>
      </g>
      <path d="M194 44q26 12 12 34t-18 31q-7 22 19 32" stroke="#bda47d" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" fill="none"/>
      <g stroke="#8ca6b4" stroke-width="2.5" fill="none"><path d="M354 100q11-12 24 0 12-13 25 0"/>
        <path d="M74 254v44M55 277h38"/><circle cx="74" cy="249" r="9"/>
        <path d="M48 279q3 26 26 26t26-26"/></g>
    `,
    space: `
      <g fill="#aca3d7" opacity=".8"><circle cx="48" cy="63" r="2.5"/><circle cx="102" cy="34" r="2"/>
        <circle cx="267" cy="119" r="2"/><circle cx="341" cy="39" r="2.3"/>
        <circle cx="159" cy="252" r="2.3"/><circle cx="303" cy="295" r="1.8"/>
        <circle cx="68" cy="314" r="1.7"/></g>
      <g stroke="#aca3d7" stroke-width="2" stroke-linecap="round">
        <path d="M205 80v17m-9-8.5h18M362 223v22m-11-11h22M67 174v15m-7.5-7.5h15"/>
        <path d="M101 34L48 63 67 174 159 252" stroke-width="1" stroke-dasharray="3 9" opacity=".55" fill="none"/>
      </g>
      <ellipse cx="322" cy="246" rx="25" ry="9" transform="rotate(-23 322 246)" stroke="#d0b4da" stroke-width="3" fill="none" opacity=".75"/>
      <circle cx="322" cy="246" r="13" fill="#b3a9d7" opacity=".65"/>
    `,
    kingdom: `
      <g fill="none" stroke="#baa176" stroke-width="2.4" opacity=".72">
        <path d="M18 51q47 13 94 0"/><path d="M26 55v31l11-8 11 8V59M56 60v31l11-8 11 8V58M87 59v31l11-8 11 8V54"/>
        <path d="M295 254q27-28 53 0M310 254q14-17 28 0"/>
      </g>
      <g fill="#cbb5d3" opacity=".8"><path d="M26 55v31l11-8 11 8V59Z"/>
        <path d="M87 59v31l11-8 11 8V54Z"/></g>
      <g stroke="#c9b185" stroke-width="2" stroke-linecap="round">
        <path d="M248 59v16m-8-8h16M162 222v14m-7-7h14M385 123v13m-6-6h12"/></g>
      <path d="M50 245q19-14 31 0t31 0" fill="none" stroke="#c4a68c" stroke-width="2"/>
    `,
    west: `
      <g stroke="#caa680" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".85">
        <path d="M36 73q24-14 47 4t43 0M35 92q15-12 30 0"/>
        <path d="M299 269q20-10 40 4t41 1"/>
        <path d="M169 54q-12 21 2 36 15-15 4-37"/>
      </g>
      <g stroke="#8aa58a" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M347 93v48m0-25q-23 0-23-22m23 37q20 0 20-22"/>
      </g>
      <path d="M91 268q17-14 34 0t34 0" fill="none" stroke="#c8af86" stroke-width="2.5" stroke-dasharray="3 7"/>
      <g stroke="#b28e6d" stroke-width="3" fill="none"><path d="M232 219q-17-6-17-19t17-17q17 4 17 17t-17 19"/>
        <path d="M217 200l-12 10m40-10 12 10"/></g>
    `,
    dinos: `
      <g stroke="#8fae8f" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M32 120q15-55 25-89M32 120q-31-31-17-68M32 120q33-32 48-59"/>
        <path d="M339 323q-25-53-13-90M339 323q30-49 55-58"/>
      </g>
      <g fill="#b3caaa" opacity=".85"><path d="M40 91Q9 82 12 54q25 12 28 37Z"/>
        <path d="M43 74q21-35 39-30-8 31-39 30Z"/>
        <path d="M332 294q-30-29-16-54 25 13 16 54Z"/></g>
      <g fill="#a9b9a2" opacity=".8"><ellipse cx="208" cy="133" rx="9" ry="12"/>
        <ellipse cx="185" cy="156" rx="6" ry="8"/><ellipse cx="202" cy="162" rx="6" ry="8"/>
        <ellipse cx="217" cy="161" rx="6" ry="8"/></g>
      <path d="M80 294q22-18 43 0t44 0" stroke="#b8c5a2" stroke-width="2" fill="none"/>
    `,
    faeries: `
      <g fill="#e0b9e8" opacity=".83"><circle cx="52" cy="58" r="3"/>
        <circle cx="125" cy="44" r="2"/><circle cx="324" cy="95" r="3"/>
        <circle cx="171" cy="278" r="2.4"/><circle cx="374" cy="247" r="2.6"/></g>
      <g stroke="#d8aadf" stroke-width="2.3" stroke-linecap="round">
        <path d="M69 43v18m-9-9h18M276 188v23m-11-11h22M148 295v17m-8-8h16"/>
      </g>
      <path d="M198 92q44-54 81-6" stroke="#e7b8d7" stroke-width="5" fill="none" opacity=".62"/>
      <path d="M202 104q37-44 72-7" stroke="#cbb4ed" stroke-width="5" fill="none" opacity=".55"/>
      <path d="M206 116q31-35 65-5" stroke="#ead6a1" stroke-width="5" fill="none" opacity=".55"/>
      <g stroke="#ba9dce" stroke-width="1.7" fill="none"><path d="M46 246q-21-24-29-1 4 10 27 8M46 246q20-24 30-1-4 10-29 8"/></g>
    `,
    sports: `
      <g stroke="#abc0d3" stroke-width="2.8" fill="none" opacity=".75">
        <path d="M25 55h90v58H25Z"/><path d="M70 55v58"/><circle cx="70" cy="84" r="15"/>
        <path d="M274 268h81M274 281h81"/>
      </g>
      <g fill="#e2c891" opacity=".76"><path d="M214 52l7 15 16 2-12 12 3 16-14-8-14 8 3-16-12-12 16-2Z"/>
        <circle cx="349" cy="129" r="4"/><circle cx="363" cy="141" r="4"/>
        <circle cx="329" cy="145" r="3"/></g>
      <g stroke="#b8c8d2" stroke-width="2" fill="none"><path d="M109 246l23-25 23 25"/>
        <path d="M120 264l23-25 23 25"/></g>
    `,
    cars: `
      <g stroke="#afafae" stroke-width="3.2" fill="none" opacity=".75">
        <path d="M20 80q70-36 135 0t135 0t110 0" stroke-dasharray="15 13"/>
        <path d="M110 263q70-36 135 0t135 0" stroke-dasharray="15 13"/>
        <path d="M320 140l-18 13m18-13-18-13"/>
      </g>
      <g fill="#c4bbb1" opacity=".82"><rect x="66" y="161" width="10" height="20" rx="3"/>
        <rect x="82" y="172" width="10" height="20" rx="3"/>
        <rect x="98" y="183" width="10" height="20" rx="3"/></g>
      <path d="M244 171h44m-44 12h44" stroke="#d5bca4" stroke-width="3" stroke-dasharray="7 5"/>
    `
  };

  function imageFor(markup) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" fill="none">${markup}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  const style = document.createElement("style");
  style.id = "cw-ambient-v52";
  style.textContent = `
    body[data-page] #main { position:relative; isolation:isolate; }
    body[data-page] #main::before {
      content:"";
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      background-image:var(--cw-ambient-pattern);
      background-repeat:repeat;
      background-size:420px 340px;
      opacity:0;
    }
    body[data-page] #main > .container,
    body[data-page] #main > section { position:relative; z-index:1; }
    html[data-whimsy]:not([data-whimsy="off"])
      body[data-page="todo"] #main::before { opacity:.58; }
    html[data-whimsy]:not([data-whimsy="off"])
      body[data-page="profile"] #main::before { opacity:.46; }
    html[data-whimsy]:not([data-whimsy="off"])
      body[data-page="calendar"] #main::before { opacity:.34; }
    html[data-whimsy]:not([data-whimsy="off"])
      body[data-page="home"] #main::before { opacity:.20; }
    @media(max-width:800px) {
      body[data-page] #main::before { background-size:330px 270px; }
      html[data-whimsy]:not([data-whimsy="off"])
        body[data-page] #main::before { opacity:.16; }
    }
    @media(prefers-reduced-motion:reduce) {
      body[data-page] #main::before { animation:none!important; }
    }
  `;
  for (const [theme, markup] of Object.entries(shapes)) {
    style.textContent += `html[data-whimsy="${theme}"] { --cw-ambient-pattern:${imageFor(markup)}; }\n`;
  }
  document.head.appendChild(style);
})();


/* Coursewise Whimsy V5.3 — illustration cleanup.
   Paste after V5, V5.1, and V5.2 in js/theme.js. */
(() => {
  'use strict';
  if (document.getElementById('cw-whimsy-v53')) return;

  const wrap = inner => `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" fill="none">${inner}</svg>`
  )}")`;

  // Complete, recognizable motifs instead of disconnected line fragments.
  const icon = (content,x,y,size=1) =>
    `<g transform="translate(${x} ${y}) scale(${size})">${content}</g>`;

  const motifs = {
    flower:`<path d="M0 22v26m0-10q-17-6-16-17 15 0 16 17m0-11q15-8 16-20-15 3-16 20" stroke="#87ab8c" stroke-width="2.5"/><g fill="#e8b8c9" stroke="#f2dce4" stroke-width="1"><circle cx="-9" cy="0" r="9"/><circle cx="9" cy="0" r="9"/><circle cy="-10" r="9"/><circle cy="10" r="9"/></g><circle r="7" fill="#d9b46e"/>`,

    mushroom:`<path d="M-8 10v25h16V10" fill="#f6e6cd" stroke="#bca999" stroke-width="2"/><path d="M-25 12q3-36 25-36t25 36Z" fill="#d6a1a1" stroke="#bb8e91" stroke-width="2"/><g fill="#fff2e3"><circle cx="-10" cy="-6" r="4"/><circle cx="9" cy="-10" r="5"/></g>`,

    butterfly:`<path d="M0 0q-27-28-30-4t27 14Q-27 28-19 35T0 13Q19 37 27 25T3 10Q31 0 27-16T0 0Z" fill="#c8b4de" stroke="#ae9ac5" stroke-width="2"/><path d="M0-5v26" stroke="#8c8294" stroke-width="3"/>`,

    wave:`<g stroke="#84bdcb" stroke-width="3" stroke-linecap="round"><path d="M-40 0q20-18 40 0t40 0M-32 15q16-14 32 0t32 0"/></g>`,

    anchor:`<g stroke="#8eafbf" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cy="-23" r="8"/><path d="M0-15v58M-22 8h44M-32 22q2 28 32 28t32-28m-64 0 10 7m54-7-10 7"/></g>`,

    shell:`<path d="M-28 23Q-33-13 0-25q33 12 28 48Z" fill="#e8cfbb" stroke="#c8ae99" stroke-width="2"/><g stroke="#c8ae99" stroke-width="2"><path d="M0-24v46M-13-18l6 40M13-18 7 22"/></g>`,

    star:`<path d="M0-16v32m-16-16h32m-11-11L11 11m0-22-22 22" stroke="#afa3d9" stroke-width="2.5" stroke-linecap="round"/><circle r="3" fill="#d8c8e8"/>`,

    planet:`<circle r="17" fill="#c6b3df"/><ellipse rx="34" ry="12" transform="rotate(-25)" stroke="#e2c5d9" stroke-width="5"/>`,

    moon:`<path d="M9-22A28 28 0 1 0 24 20 28 28 0 0 1 9-22" fill="#d4c4e6"/>`,

    crown:`<path d="M-27 14-30-20-13-4 0-24 13-4 30-20 27 14Z" fill="#e2c68e" stroke="#c5aa78" stroke-width="2"/><path d="M-27 14h54v9h-54Z" fill="#cfacd2" stroke="#c5aa78" stroke-width="2"/>`,

    shield:`<path d="M0-28 25-17v21Q25 27 0 38-25 27-25 4v-21Z" fill="#d4badc" stroke="#b99cc3" stroke-width="2.5"/><path d="M0-17v43M-15 0h30" stroke="#f8e6ca" stroke-width="4"/>`,

    pennant:`<path d="M-33-23v68" stroke="#bda583" stroke-width="3"/><path d="M-31-21h53L6 0l16 20h-53Z" fill="#d4aebc" stroke="#ba9ba8" stroke-width="2"/>`,

    cactus:`<g fill="none" stroke="#9db49e" stroke-width="7" stroke-linecap="round"><path d="M0 40v-72M0 10q-26 0-26-25v-14M0-7q23 0 23-23v-9"/></g>`,

    horseshoe:`<path d="M-23-16v25q0 29 23 29T23 9v-25" stroke="#c9a67e" stroke-width="10" stroke-linecap="round"/><g fill="#f0d5a8"><circle cx="-23" cy="-8" r="3"/><circle cx="23" cy="-8" r="3"/></g>`,

    sheriff:`<path d="M0-31 9-13 28-17 19 0 28 17 9 13 0 31-9 13-28 17-19 0-28-17-9-13Z" fill="#dfbd87" stroke="#ba9a69" stroke-width="2"/><circle r="9" fill="#f6e8cc"/>`,

    footprint:`<ellipse cy="10" rx="13" ry="16" fill="#9cb4a0"/><g fill="#9cb4a0"><ellipse cx="-17" cy="-11" rx="6" ry="9" transform="rotate(-25 -17 -11)"/><ellipse cy="-19" rx="6" ry="10"/><ellipse cx="17" cy="-11" rx="6" ry="9" transform="rotate(25 17 -11)"/></g>`,

    fern:`<path d="M0 37Q3-1 0-32" stroke="#91af8f" stroke-width="3"/><g stroke="#9ab99a" stroke-width="2.5" stroke-linecap="round"><path d="M0-20q-19-14-25-13M0-9q23-15 28-22M1 1q-22-15-28-12M1 12q22-11 29-11M0 24q-18-9-24-8"/></g>`,

    egg:`<path d="M0-30q-21 0-26 34-4 27 26 30 30-3 26-30Q21-30 0-30Z" fill="#dfebd7" stroke="#abc3a8" stroke-width="2.5"/><path d="M-23 9-13 2-4 11 7 1 17 9 25 3" stroke="#b6c7ad" stroke-width="2.5"/>`,

    fairyDust:`<g stroke="#ccaddb" stroke-width="2.5" stroke-linecap="round"><path d="M0-19v38m-19-19h38M-13-13l26 26m0-26-26 26"/></g><circle r="4" fill="#f1d2bd"/>`,

    firefly:`<ellipse cx="-8" cy="-7" rx="12" ry="9" fill="#dccde8" opacity=".8"/><ellipse cx="8" cy="-7" rx="12" ry="9" fill="#dccde8" opacity=".8"/><path d="M0-12v28" stroke="#b39cc9" stroke-width="4"/><circle cy="17" r="8" fill="#eddfa5" opacity=".9"/>`,

    magicMushroom:`<path d="M-9 9v27h18V9" fill="#f7e8d8" stroke="#d1b6b6" stroke-width="2"/><path d="M-30 12q6-36 30-36t30 36Z" fill="#c9abd8" stroke="#af97bf" stroke-width="2"/><circle cx="-10" cy="-3" r="5" fill="#f7e6ec"/><circle cx="12" cy="-3" r="6" fill="#f7e6ec"/>`,

    trophy:`<path d="M-19-23h38v23q0 23-19 23T-19 0Z" fill="#e8cf95" stroke="#c5ab7a" stroke-width="3"/><path d="M-19-16h-13q-2 21 17 23M19-16h13Q34 5 15 7M0 23v13m-17 0h34" stroke="#c5ab7a" stroke-width="4" stroke-linecap="round"/>`,

    ball:`<circle r="25" fill="#f4e4be" stroke="#c9af80" stroke-width="3"/><path d="M-25 0h50M0-25v50M-17-18q34 18 0 36M17-18q-34 18 0 36" stroke="#c9af80" stroke-width="2.5"/>`,

    pennants:`<path d="M-43-29h86" stroke="#a8b8c9" stroke-width="3"/><path d="M-40-27v39l16-13 16 13v-39Z" fill="#d8c4a3"/><path d="M-2-27v39l16-13 16 13v-39Z" fill="#b5cbd9"/>`,

    flag:`<path d="M-27-33v70" stroke="#a7afb7" stroke-width="3"/><path d="M-26-30h53v37h-53Z" fill="#faf3e5" stroke="#aaa" stroke-width="1"/><g fill="#a9a8ae"><path d="M-26-30h13v12h-13Zm26 0h13v12H0Zm-13 12H0v12h-13ZM13-18h14v12H13ZM-26-6h13V7h-13ZM0-6h13V7H0Z"/></g>`,

    tire:`<circle r="27" fill="none" stroke="#a6aaae" stroke-width="9"/><circle r="11" fill="#c0c7ca" stroke="#a6aaae" stroke-width="2"/><path d="M0-25v12M0 13v12M-25 0h12M13 0h12" stroke="#b9c1c5" stroke-width="3"/>`,

    cone:`<path d="M0-31-21 25h42Z" fill="#e5ae83" stroke="#c58e71" stroke-width="2"/><path d="M-11 1h22M-17 17h34" stroke="#fff1df" stroke-width="7"/><path d="M-27 26h54v8h-54Z" fill="#b9adb0"/>`
  };

  // Each repeat is a 480x360 tile.
  // All illustrated objects have room around their edges.
  const tile = list => wrap(
    list.map(([name,x,y,s]) =>
      icon(motifs[name],x,y,s||1)
    ).join('')
  );

  const backgrounds = {
    cottage:tile([
      ['flower',65,80,.8],
      ['mushroom',355,85,.9],
      ['butterfly',200,245,.75],
      ['flower',415,300,.62],
      ['mushroom',90,307,.55]
    ]),
    pirate:tile([
      ['wave',85,80,1.1],
      ['anchor',370,135,.8],
      ['shell',155,255,.75],
      ['wave',385,300,.9],
      ['shell',290,65,.46]
    ]),
    space:tile([
      ['star',55,75,.7],
      ['star',200,50,.4],
      ['planet',355,110,.8],
      ['star',255,200,.55],
      ['moon',105,295,.65],
      ['star',425,310,.35],
      ['star',370,268,.4],
      ['star',155,165,.32]
    ]),
    kingdom:tile([
      ['crown',88,75,.72],
      ['shield',350,90,.72],
      ['pennant',205,265,.68],
      ['crown',410,300,.37],
      ['shield',80,295,.36]
    ]),
    west:tile([
      ['cactus',75,98,.7],
      ['horseshoe',365,95,.67],
      ['sheriff',180,260,.7],
      ['cactus',400,305,.45],
      ['sheriff',80,320,.38]
    ]),
    dinos:tile([
      ['fern',80,100,1],
      ['footprint',365,80,.72],
      ['egg',240,265,.76],
      ['fern',395,293,.65],
      ['footprint',95,300,.44]
    ]),
    faeries:tile([
      ['fairyDust',68,78,.7],
      ['magicMushroom',355,100,.85],
      ['firefly',200,260,.7],
      ['fairyDust',400,305,.5],
      ['fairyDust',95,296,.4]
    ]),
    sports:tile([
      ['trophy',75,98,.67],
      ['ball',370,92,.74],
      ['pennants',225,250,.8],
      ['ball',90,307,.44],
      ['trophy',420,297,.37]
    ]),
    cars:tile([
      ['flag',90,85,.85],
      ['tire',355,90,.8],
      ['cone',190,270,.8],
      ['flag',405,305,.45],
      ['tire',80,306,.45]
    ])
  };

  // Redesigned primary illustrations.
  // A friendly long-necked dinosaur, a four-legged unicorn,
  // an F1-style car, and a separate monster truck.

  const longneck = `
    <g stroke="#698f7d" stroke-width="3.2" stroke-linejoin="round">
      <path d="M60 182Q29 157 13 175Q29 195 65 196Q93 229 164 222
        L181 204Q205 198 220 165L235 82Q239 45 266 43
        Q293 43 301 63Q313 82 292 95L258 98
        Q258 155 238 205Q220 229 188 230H111Q77 226 60 182Z"
        fill="#a5cdb3"/>
      <path d="M90 217v45h27l10-45M177 216v46h27l10-50"
        fill="#a5cdb3"/>
      <path d="M238 65q17-11 31-3"
        fill="none" stroke="#bdddc1" stroke-width="6"/>
      <circle cx="277" cy="67" r="4.3"
        fill="#405d52" stroke="none"/>
      <path d="M278 84q10 5 18-3" fill="none"/>
    </g>
    <g fill="#bedac0">
      <circle cx="111" cy="178" r="17"/>
      <circle cx="161" cy="190" r="10"/>
      <circle cx="192" cy="173" r="12"/>
    </g>
    <g stroke="#83aa8d" stroke-width="3" stroke-linecap="round">
      <path d="M12 280q8-45 27-57M305 275q12-56 33-79"/>
    </g>
    <g fill="#9cbfa3">
      <path d="M29 260q-26-17-17-32 20 7 17 32"/>
      <path d="M325 238q27-20 33-7-9 16-33 7"/>
    </g>
  `;

  const unicorn = `
    <g stroke="#bbaacb" stroke-width="3.5" stroke-linejoin="round">
      <path d="M65 157Q41 135 42 113Q68 130 86 132Q112 108 155 113
        Q204 116 218 142L241 125Q251 87 275 83L301 98
        L330 115Q357 133 334 151Q324 167 296 163L266 151
        Q247 181 240 210H100Q70 203 65 157Z"
        fill="#faf2f5"/>
      <path d="M105 201v65h24l14-61M203 201v65h24l12-65"
        fill="#faf2f5"/>
      <path d="M277 89L288 48l14 48"
        fill="#eac5dd"/>
      <path d="M303 95l28-61 4 74"
        fill="#eddb9f" stroke="#c6b179"/>
      <path d="M272 84q-26 15-19 45t-10 40q-13-42 3-71"
        fill="#d8b9e3"/>
      <path d="M257 94q-28 16-20 43"
        fill="none" stroke="#b8cce9" stroke-width="10"/>
      <path d="M74 132q-42-29-43-8 7 21 31 32"
        fill="#e3c3eb"/>
      <circle cx="324" cy="127" r="4"
        fill="#65536d" stroke="none"/>
      <path d="M325 142q7 5 13-1"
        fill="none" stroke="#ae98bc" stroke-width="2"/>
    </g>
    <g stroke="#d5b5e6" stroke-width="3" stroke-linecap="round">
      <path d="M35 65v17m-8-8h16M372 79v23m-11-11h22M386 213v14m-7-7h14"/>
    </g>
    <path d="M63 89Q131 19 233 55"
      stroke="#e7cee9" stroke-width="7" opacity=".5"/>
    <path d="M65 100Q141 36 231 68"
      stroke="#f0dca8" stroke-width="7" opacity=".5"/>
  `;

  const f1 = `
    <g stroke-linejoin="round" stroke-width="3">
      <path d="M43 191h245l27-24h43l27 24h30v17H43Z"
        fill="#d7a5a8" stroke="#b9878f"/>
      <path d="M140 191l27-42h80l29 42"
        fill="#e8c2c3" stroke="#b9878f"/>
      <path d="M179 154h54l20 29H158Z"
        fill="#b7c9db"/>
      <path d="M63 183V153H35v38M369 178v-39h29v52"
        fill="#bfa5b1" stroke="#b9878f"/>
      <path d="M82 207h286"
        stroke="#b9878f" stroke-width="5"/>
      <circle cx="122" cy="207" r="28"
        fill="#40444a" stroke="#737d85"/>
      <circle cx="326" cy="207" r="28"
        fill="#40444a" stroke="#737d85"/>
      <circle cx="122" cy="207" r="11"
        fill="#afb7c0" stroke="none"/>
      <circle cx="326" cy="207" r="11"
        fill="#afb7c0" stroke="none"/>
      <path d="M175 190h70"
        stroke="#f8e9d9" stroke-width="5"/>
    </g>
    <g stroke="#b6b9bd" stroke-width="3" stroke-linecap="round">
      <path d="M50 251h90M176 252h84M293 252h87"
        stroke-dasharray="15 10"/>
    </g>
  `;

  const truck = `
    <g stroke-linejoin="round" stroke-width="3">
      <path d="M69 170h251l31 30H49Z"
        fill="#30373b" stroke="#65787a"/>
      <path d="M119 129h120l46 41H85Z"
        fill="#3c4347" stroke="#65787a"/>
      <path d="M139 135h83l31 29H110Z"
        fill="#8b88b2" stroke="#b2a2d3"/>
      <path d="M86 178q22-35 43-6t42-10 41 8 40-8 43 7"
        fill="none" stroke="#80c86a" stroke-width="10"/>
      <path d="M98 184l20-18 15 20 25-19 20 18"
        stroke="#b18dd2" stroke-width="6"/>
      <circle cx="124" cy="208" r="38"
        fill="#303239" stroke="#657074"/>
      <circle cx="286" cy="208" r="38"
        fill="#303239" stroke="#657074"/>
      <circle cx="124" cy="208" r="17"
        fill="#a4b3b6" stroke="none"/>
      <circle cx="286" cy="208" r="17"
        fill="#a4b3b6" stroke="none"/>
    </g>
  `;

  const centerScene = content => wrap(
    `<g transform="translate(32 24) scale(1.05)">${content}</g>`
  );

  const bigArt = {
    dinos:centerScene(longneck),
    faeries:centerScene(unicorn),
    cars:centerScene(f1)
  };

  const altArt = {
    dinos:centerScene(longneck),
    faeries:centerScene(unicorn),
    cars:centerScene(truck)
  };

  // CSS-only overrides preserve the V5.1 layering fix.
  const css = document.createElement('style');
  css.id = 'cw-whimsy-v53';

  css.textContent = `
    /* Keep the V5.2 density; replace only the motifs. */
    html[data-whimsy]:not([data-whimsy="off"])
    body #main::before {
      background-image:var(--cw-v53-pattern) !important;
    }

    /* Repaired illustrations for the three featured worlds. */
    html[data-whimsy="dinos"] .hero,
    html[data-whimsy="faeries"] .hero,
    html[data-whimsy="cars"] .hero {
      background-image:var(--cw-v53-main),
        linear-gradient(135deg,var(--primary-dark),var(--primary))
        !important;
      background-size:auto 83%,cover !important;
      background-position:right bottom,center !important;
      background-repeat:no-repeat !important;
    }

    html[data-whimsy="dinos"] .cw-w-art,
    html[data-whimsy="faeries"] .cw-w-art,
    html[data-whimsy="cars"] .cw-w-art {
      background-image:var(--cw-v53-alt) !important;
    }

    /* Give Fast Lane both vehicles instead of repeating one. */
    html[data-whimsy="cars"]
    .cw-w-scene .cw-w-art:first-child {
      background-image:var(--cw-v53-main) !important;
    }

    /* All illustrations remain noninteractive scenery. */
    html[data-whimsy]:not([data-whimsy="off"]) .cw-w-art,
    html[data-whimsy]:not([data-whimsy="off"]) .cw-w-scene,
    html[data-whimsy]:not([data-whimsy="off"]) #main::before {
      pointer-events:none !important;
    }

    /* The temporary prototype progress dots stay gone. */
    .cw-w-progress {
      display:none !important;
    }
  `;

  // Install the new ambient artwork for all nine themes.
  for (const [theme,url] of Object.entries(backgrounds)) {
    css.textContent +=
      `html[data-whimsy="${theme}"]{
        --cw-v53-pattern:${url};
      }\n`;
  }

  // Install the new large illustrations.
  for (const theme of Object.keys(bigArt)) {
    css.textContent +=
      `html[data-whimsy="${theme}"]{
        --cw-v53-main:${bigArt[theme]};
        --cw-v53-alt:${altArt[theme]};
      }\n`;
  }

  document.head.appendChild(css);
})();



/* ===========================================
   COURSEWISE WHIMSY V5.4
   Dinosaur back + F1 illustration polish

   Visual-only patch.
   Preserve V5.1, V5.2 and V5.3.
   =========================================== */

(() => {
  "use strict";

  if (document.getElementById("cw-whimsy-v54")) return;

  function svgBackground(content) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 480 360"
           fill="none">
        ${content}
      </svg>
    `;

    return `url("data:image/svg+xml,${
      encodeURIComponent(svg)
    }")`;
  }

  /* -----------------------------------------
     1. THE DINOSAUR

     One continuous body silhouette,
     rounded back, long neck, proper legs,
     spots and the same friendly face.
     ----------------------------------------- */

  const dinosaur = `
    <g stroke-linejoin="round" stroke-linecap="round">

      <!-- Back legs sit behind the body -->
      <path
        d="M138 192
           L134 264
           Q134 271 145 271
           H166
           Q174 271 174 261
           L184 207Z"
        fill="#91bda1"
        stroke="#739b85"
        stroke-width="3.5"
      />

      <path
        d="M202 183
           L199 264
           Q199 271 210 271
           H231
           Q239 271 239 261
           L245 186Z"
        fill="#91bda1"
        stroke="#739b85"
        stroke-width="3.5"
      />

      <!-- SINGLE CONTINUOUS BODY, BACK AND NECK -->
      <path
        d="
          M 112 218
          C 82 215 53 197 27 170
          Q 61 169 100 181

          C 108 149 130 127 159 125
          C 184 123 202 136 220 137

          C 231 116 233 76 242 56
          C 250 39 263 31 281 34

          C 300 35 315 47 315 62
          C 315 79 303 89 282 90

          L 261 91

          C 259 121 252 154 240 183
          C 226 218 198 231 163 230

          C 140 230 124 227 112 218
          Z
        "
        fill="#a8d0b2"
        stroke="#739b85"
        stroke-width="4"
      />

      <!-- Front legs -->
      <path
        d="M123 217
           L118 264
           Q118 272 129 272
           H150
           Q160 272 160 262
           L163 230"
        fill="#a8d0b2"
        stroke="#739b85"
        stroke-width="3.5"
      />

      <path
        d="M188 227
           L184 264
           Q184 272 195 272
           H217
           Q228 272 228 261
           L231 193"
        fill="#a8d0b2"
        stroke="#739b85"
        stroke-width="3.5"
      />

      <!-- Soft spots on his back -->
      <g fill="#d3e7c7" stroke="none">
        <circle cx="139" cy="165" r="14"/>
        <circle cx="172" cy="153" r="11"/>
        <circle cx="198" cy="174" r="13"/>
        <circle cx="163" cy="190" r="8"/>
      </g>

      <!-- Face -->
      <circle
        cx="285" cy="59" r="4.5"
        fill="#45695a"
        stroke="none"
      />

      <circle
        cx="307" cy="74" r="2.2"
        fill="#739b85"
        stroke="none"
      />

      <path
        d="M283 78 Q294 86 304 77"
        stroke="#739b85"
        stroke-width="2.7"
        fill="none"
      />

      <!-- A tiny rosy cheek -->
      <ellipse
        cx="273" cy="74" rx="8" ry="5"
        fill="#e3bbc0"
        opacity=".65"
        stroke="none"
      />

      <!-- Ground decoration -->
      <g
        fill="none"
        stroke="#92b79b"
        stroke-width="3"
      >
        <path d="M49 285 Q53 256 70 241"/>
        <path d="M58 268 Q39 259 36 246"/>
        <path d="M345 283 Q348 246 365 226"/>
        <path d="M356 260 Q374 252 381 238"/>
      </g>

      <g fill="#aecdb0" stroke="none">
        <path d="M57 267 Q34 258 35 242
                 Q54 247 57 267Z"/>
        <path d="M355 260 Q378 244 384 236
                 Q380 254 355 260Z"/>
      </g>

    </g>
  `;

  /* -----------------------------------------
     2. THE FORMULA-STYLE RACE CAR

     Low profile, exposed tires, open cockpit,
     pointed nose and clear racing wings.
     ----------------------------------------- */

  const raceCar = `
    <g stroke-linejoin="round" stroke-linecap="round">

      <!-- Ground and tiny speed lines -->
      <g
        stroke="#aabac1"
        stroke-width="3"
        stroke-dasharray="18 13"
        opacity=".6"
      >
        <path d="M40 279 H160"/>
        <path d="M200 279 H316"/>
        <path d="M348 279 H435"/>
      </g>

      <!-- Rear wing -->
      <path
        d="M55 127
           H119
           V143
           H55Z"
        fill="#bd8798"
        stroke="#a9798a"
        stroke-width="3"
      />

      <path
        d="M71 143 V198
           M104 143 V190"
        stroke="#a9798a"
        stroke-width="6"
      />

      <!-- Main low racing chassis -->
      <path
        d="
          M 60 200
          H 125
          L 169 180
          H 257
          L 304 194
          L 409 206
          V 230
          H 60
          Z
        "
        fill="#e6b4be"
        stroke="#b78393"
        stroke-width="3.5"
      />

      <!-- Cockpit body -->
      <path
        d="
          M 150 185
          L 181 146
          H 238
          L 262 186
          Z
        "
        fill="#ebc2c8"
        stroke="#b78393"
        stroke-width="3"
      />

      <!-- Open black cockpit -->
      <path
        d="
          M 185 157
          H 226
          L 243 181
          H 169
          Z
        "
        fill="#687783"
      />

      <!-- Helmet visible in cockpit -->
      <path
        d="
          M 190 160
          Q 190 138 207 138
          Q 224 138 224 160
          Z
        "
        fill="#f7e2d9"
        stroke="#c5a5a7"
        stroke-width="2"
      />

      <path
        d="M204 149 H223"
        stroke="#95aabe"
        stroke-width="6"
      />

      <!-- Protective halo -->
      <path
        d="M172 168 Q203 144 243 169"
        fill="none"
        stroke="#aa788b"
        stroke-width="6"
      />

      <!-- Long pointed front nose -->
      <path
        d="
          M 257 193
          L 386 207
          L 410 214
          L 410 229
          L 255 221
          Z
        "
        fill="#f0c8c6"
        stroke="#b78393"
        stroke-width="3"
      />

      <!-- Front wing -->
      <path
        d="
          M 381 203
          H 436
          V 216
          H 381
          Z
        "
        fill="#c38c9d"
        stroke="#ae7c8b"
        stroke-width="3"
      />

      <path
        d="M402 216 V232"
        stroke="#ae7c8b"
        stroke-width="4"
      />

      <!-- Racing stripe -->
      <path
        d="M117 195 H165
           M263 207 L375 219"
        stroke="#fff0e6"
        stroke-width="6"
      />

      <!-- Rear tire -->
      <circle
        cx="125" cy="228" r="38"
        fill="#343b43"
        stroke="#737d85"
        stroke-width="4"
      />
      <circle
        cx="125" cy="228" r="19"
        fill="#a9b9be"
        stroke="#d5dbdb"
        stroke-width="3"
      />
      <circle
        cx="125" cy="228" r="8"
        fill="#657783"
      />

      <!-- Front tire -->
      <circle
        cx="353" cy="228" r="36"
        fill="#343b43"
        stroke="#737d85"
        stroke-width="4"
      />
      <circle
        cx="353" cy="228" r="18"
        fill="#a9b9be"
        stroke="#d5dbdb"
        stroke-width="3"
      />
      <circle
        cx="353" cy="228" r="8"
        fill="#657783"
      />

    </g>
  `;

  const dinoImage = svgBackground(dinosaur);
  const raceImage = svgBackground(raceCar);

  /* -----------------------------------------
     3. APPLY AS ILLUSTRATION OVERRIDES ONLY
     ----------------------------------------- */

  const style = document.createElement("style");
  style.id = "cw-whimsy-v54";

  style.textContent = `
    html[data-whimsy="dinos"] {
      --cw-v53-main: ${dinoImage};
      --cw-v53-alt: ${dinoImage};
    }

    html[data-whimsy="cars"] {
      --cw-v53-main: ${raceImage};
    }

    /*
      Keep the completed/open-today statistic,
      text and streak above all artwork.
      No change to position or layout.
    */

    html[data-whimsy="dinos"] .hero .hero-stat,
    html[data-whimsy="cars"] .hero .hero-stat {
      z-index: 10 !important;
    }

    /*
      Existing monster truck is still supplied
      by --cw-v53-alt from V5.3.
    */
  `;

  document.head.appendChild(style);
})();


/* V5.5 — Restore the Daily Snapshot streak footer */
(() => {
  const style = document.createElement("style");
  style.textContent = `
    html[data-whimsy]:not([data-whimsy="off"])
    .hero.has-streak > .streak-bar {
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      width: 100%;
      margin: 0 !important;
      z-index: 5 !important;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
})();


/* ===========================================
   DECK THE DIVS — Mobile Snapshot repairs
   Original Whimsy worlds keep their desktop design.
   =========================================== */
(() => {
  if (document.getElementById("cw-whimsy-mobile-v56")) return;
  const style = document.createElement("style");
  style.id = "cw-whimsy-mobile-v56";
  style.textContent = `
    @media (max-width:650px) {
      html[data-whimsy]:not([data-whimsy="off"]) .hero {
        isolation:isolate; min-height:13rem;
      }
      html[data-whimsy]:not([data-whimsy="off"]) .hero > small,
      html[data-whimsy]:not([data-whimsy="off"]) .hero h2,
      html[data-whimsy]:not([data-whimsy="off"]) .hero p {
        position:relative; z-index:6!important;
      }
      html[data-whimsy]:not([data-whimsy="off"]) .hero h2 {
        font-size:clamp(1.35rem,5.6vw,1.6rem);line-height:1.2;
      }
      html[data-whimsy]:not([data-whimsy="off"]) .hero p {
        max-width:64%;font-size:.8rem;line-height:1.4;overflow-wrap:break-word;
      }
      html[data-whimsy]:not([data-whimsy="off"]) .hero .hero-stat {
        position:absolute!important;top:18px!important;right:16px!important;z-index:8!important;
      }
      html[data-whimsy]:not([data-whimsy="off"]) .hero.has-streak > .streak-bar {
        position:absolute!important;bottom:0!important;top:auto!important;
        left:0!important;right:0!important;z-index:7!important;
      }
      html[data-whimsy="space"] .hero {
        background-image:var(--cw-w-hero),linear-gradient(120deg,#151c40,#383166)!important;
        background-size:auto 63%,cover!important;
        background-position:right bottom 31px,center!important;
        background-repeat:no-repeat!important;
      }
      html[data-whimsy="space"] .hero > small {
        color:#fff!important;opacity:1!important;text-shadow:0 1px 4px #151c40;
      }
      html[data-whimsy="dinos"] .hero,
      html[data-whimsy="faeries"] .hero,
      html[data-whimsy="west"] .hero,
      html[data-whimsy="sports"] .hero,
      html[data-whimsy="cars"] .hero {
        background-size:auto 56%,cover!important;
        background-position:right bottom 28px,center!important;
        background-repeat:no-repeat!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

/* ===========================================
   DECK THE DIVS — North Pole ambience
   Dedicated snowfall layers: no pseudo-element collisions.
   =========================================== */
(() => {
  if (document.getElementById("cw-northpole-ambience")) return;
  const style=document.createElement("style");
  style.id="cw-northpole-ambience";
  style.textContent=`
    html[data-whimsy="northpole"] {--cw-w-trim:none!important;}
    html[data-whimsy="northpole"] .cw-w-scene,
    html[data-whimsy="northpole"] .cw-w-friend-art,
    html[data-whimsy="northpole"] .page-head h1::after,
    html[data-whimsy="northpole"] .card:not(.overdue-card):not(.cw-f-card)::before {
      display:none!important;content:none!important;
    }
    html[data-whimsy="northpole"] .hero {
      position:relative;isolation:isolate;overflow:hidden;
      background-image:var(--cw-w-hero),
        radial-gradient(ellipse at 78% 16%,rgba(255,191,91,.14),transparent 46%),
        radial-gradient(ellipse at 20% 80%,rgba(40,104,78,.35),transparent 65%),
        linear-gradient(125deg,#102B2B,#173F38 55%,#183B37)!important;
      background-size:auto 100%,cover,cover,cover!important;
      background-position:right bottom,center,center,center!important;
      background-repeat:no-repeat!important;
      box-shadow:0 15px 32px rgba(12,40,32,.20)!important;
    }
    html[data-whimsy="northpole"] .hero > .cw-np-night {
      position:absolute!important;inset:0!important;z-index:1!important;
      pointer-events:none!important;
      background:
        radial-gradient(ellipse at 66% 12%,rgba(255,185,72,.24),transparent 28%),
        radial-gradient(ellipse at 83% 13%,rgba(76,153,255,.24),transparent 22%),
        radial-gradient(ellipse at 96% 12%,rgba(247,76,105,.23),transparent 20%),
        linear-gradient(115deg,rgba(5,16,30,.78),rgba(8,29,36,.52) 60%,rgba(7,23,31,.44));
      animation:cwNPNightGlow 6s ease-in-out infinite alternate;
    }
    html[data-whimsy="northpole"] .hero > .cw-np-snow {
      position:absolute!important;inset:0!important;z-index:4!important;
      pointer-events:none!important;overflow:hidden;
    }
    html[data-whimsy="northpole"] .cw-np-flake {
      position:absolute;top:-18px;left:var(--x);color:#fff;font-size:var(--size);
      line-height:1;opacity:0;pointer-events:none;
      text-shadow:0 0 5px rgba(255,255,255,.85),0 0 10px rgba(201,229,255,.45);
      animation:cwNPSnowfall var(--duration) linear var(--delay) infinite;
    }
    html[data-whimsy="northpole"] .hero > :not(.cw-np-night):not(.cw-np-snow) {
      position:relative;z-index:5!important;
    }
    html[data-whimsy="northpole"] .hero.has-streak > .streak-bar {z-index:6!important;}
    @keyframes cwNPSnowfall {
      0% {transform:translate3d(0,-15px,0);opacity:0}
      12%,85% {opacity:.72}
      100% {transform:translate3d(24px,300px,0);opacity:0}
    }
    @keyframes cwNPNightGlow {from{opacity:.85}to{opacity:1}}
    @media (max-width:650px) {
      html[data-whimsy="northpole"] .hero {
        background-size:auto 77%,cover,cover,cover!important;
        background-position:right bottom 28px,center,center,center!important;
      }
    }
    @media (prefers-reduced-motion:reduce) {
      html[data-whimsy="northpole"] .cw-np-flake {
        animation:none!important;opacity:.45;top:var(--static-y);
      }
      html[data-whimsy="northpole"] .hero > .cw-np-night {animation:none!important;}
    }
  `;
  document.head.appendChild(style);
  function decorate(){
    if(document.documentElement.dataset.whimsy!=="northpole")return;
    document.querySelectorAll('body[data-page="home"] .hero').forEach(hero=>{
      if(hero.querySelector(':scope > .cw-np-snow'))return;
      const night=document.createElement('div');night.className='cw-np-night';night.setAttribute('aria-hidden','true');
      const snow=document.createElement('div');snow.className='cw-np-snow';snow.setAttribute('aria-hidden','true');
      for(let i=0;i<28;i++){
        const flake=document.createElement('span');flake.className='cw-np-flake';
        flake.textContent=i%5===0?'❄':'•';
        flake.style.setProperty('--x',`${(i*37+11)%97}%`);
        flake.style.setProperty('--size',`${7+(i%4)*2}px`);
        flake.style.setProperty('--duration',`${11+(i%7)*2}s`);
        flake.style.setProperty('--delay',`${-i*2.3}s`);
        flake.style.setProperty('--static-y',`${(i*41)%90}%`);
        snow.appendChild(flake);
      }
      hero.append(night,snow);
    });
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-whimsy']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});
  else decorate();
})();

/* ===========================================
   DECK THE DIVS — Full-viewport snowfall
   Icy blue in light mode, white in dark mode.
   =========================================== */
(() => {
  const ID='cw-np-fullpage-snow';
  if(document.getElementById('cw-northpole-page-snow-style'))return;
  const style=document.createElement('style');style.id='cw-northpole-page-snow-style';
  style.textContent=`
    #${ID} {
      position:fixed;inset:0;width:100%;height:100vh;height:100dvh;
      pointer-events:none!important;overflow:hidden;z-index:100;contain:layout paint;
    }
    html:not([data-whimsy="northpole"]) #${ID} {display:none!important;}
    #${ID} .cw-np-page-flake {
      position:absolute;top:-24px;left:var(--x);color:#729CB6;
      font-size:var(--size);line-height:1;opacity:0;pointer-events:none;
      text-shadow:0 0 5px rgba(114,156,182,.35),0 0 10px rgba(114,156,182,.15);
      animation:cwNPFullSnowfall var(--duration) linear var(--delay) infinite;
      will-change:transform;
    }
    html[data-theme="dark"] #${ID} .cw-np-page-flake,
    html[data-appearance="dark"] #${ID} .cw-np-page-flake,
    html.dark #${ID} .cw-np-page-flake,
    html[data-mode="dark"] #${ID} .cw-np-page-flake {
      color:#ECF6FF;
      text-shadow:0 0 6px rgba(255,255,255,.75),0 0 12px rgba(185,220,255,.35);
    }
    @keyframes cwNPFullSnowfall {
      0% {transform:translate3d(0,-25px,0);opacity:0}
      10%,85% {opacity:var(--opacity)}
      100% {transform:translate3d(var(--drift),calc(100dvh + 50px),0);opacity:0}
    }
    @media(max-width:650px) {#${ID} .cw-np-page-flake {font-size:calc(var(--size)*.8)}}
    @media(prefers-reduced-motion:reduce) {
      #${ID} .cw-np-page-flake {
        animation:none!important;transform:none!important;top:var(--static-y);
        opacity:.25;will-change:auto;
      }
    }
  `;
  document.head.appendChild(style);
  function sync(){
    const enabled=document.documentElement.dataset.whimsy==='northpole';
    let snow=document.getElementById(ID);
    if(!enabled){if(snow)snow.remove();return;}
    if(snow||!document.body)return;
    snow=document.createElement('div');snow.id=ID;snow.setAttribute('aria-hidden','true');
    const count=window.innerWidth<=650?32:55;
    for(let i=0;i<count;i++){
      const flake=document.createElement('span');flake.className='cw-np-page-flake';
      flake.textContent=i%7===0?'❄':'•';
      const duration=13+(i%9)*2.5;
      flake.style.setProperty('--x',`${(i*37.7+11)%100}%`);
      flake.style.setProperty('--size',`${6+(i%5)*2}px`);
      flake.style.setProperty('--duration',`${duration}s`);
      flake.style.setProperty('--delay',`${-((i*3.7)%duration)}s`);
      flake.style.setProperty('--drift',`${((i%7)-3)*12}px`);
      flake.style.setProperty('--opacity',String(.25+(i%4)*.1));
      flake.style.setProperty('--static-y',`${(i*23)%95}%`);
      snow.appendChild(flake);
    }
    document.body.appendChild(snow);
  }
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-whimsy']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();

/* ===========================================
   DECK THE DIVS — Christmas card decorations
   All existing snow and Snapshot styles are preserved.
   =========================================== */
(() => {
  if(document.getElementById('cw-np-card-style'))return;
  function svgImg(content,w=160,h=100){
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none">${content}</svg>`)}")`;
  }
  const colors=['#F85C58','#FFD45C','#62BAFF','#81DB80','#F18CB8'];
  const bulbs=Array.from({length:9},(_,i)=>{
    const x=12+i*17,y=12+10*Math.sin(Math.PI*x/160),c=colors[i%colors.length];
    return `<g transform="translate(${x} ${y})"><circle cy="9" r="13" fill="${c}" opacity=".18"/>
    <rect x="-2.5" y="-1" width="5" height="5" rx="1" fill="#25402D"/>
    <path d="M-3.5 8Q-3.5 4 0 4Q3.5 4 3.5 8L2.5 13Q0 17 -2.5 13Z" fill="${c}"/></g>`;
  }).join('');
  const garland=svgImg(`<path d="M0 8Q80 47 160 8" stroke="#315D3A" stroke-width="7"/>
    ${Array.from({length:22},(_,i)=>{const x=i*7.5,y=8+10*Math.sin(Math.PI*x/160);return `<path d="M${x} ${y}l-6 -8M${x} ${y}l6 -7M${x} ${y}l-4 9" stroke="#508450" stroke-width="2.5"/>`;}).join('')}
    <path d="M0 12Q80 52 160 12" stroke="#21362A" stroke-width="1.8"/>${bulbs}
    <g transform="translate(142 25)"><path d="M0 0Q-21 -17 -20 0Q-19 14 0 2Z" fill="#B8434D"/>
    <path d="M0 0Q21 -17 20 0Q19 14 0 2Z" fill="#C85259"/><circle r="5" fill="#8D3039"/>
    <path d="M-2 4L-9 27L1 23L8 28L4 4" fill="#B8434D"/></g>`);
  const presents=svgImg(`<ellipse cx="82" cy="90" rx="66" ry="7" fill="#40533E" opacity=".12"/>
    <rect x="25" y="42" width="59" height="47" rx="4" fill="#B8454D"/>
    <path d="M54 42V89M25 62H84" stroke="#F1C66C" stroke-width="7"/>
    <path d="M54 42C25 33 35 17 52 35C67 14 83 32 54 42Z" fill="#F1C66C"/>
    <rect x="87" y="53" width="48" height="36" rx="4" fill="#477C59"/>
    <path d="M111 53V89M87 69H135" stroke="#F7E2BD" stroke-width="6"/>
    <path d="M111 53C90 42 94 31 109 46C123 29 135 44 111 53Z" fill="#F7E2BD"/>`);
  const ornaments=svgImg(`<path d="M35 0V37M80 0V19M123 0V43" stroke="#B5A17A" stroke-width="1.6"/>
    <rect x="29" y="34" width="12" height="7" rx="2" fill="#CBAE72"/>
    <circle cx="35" cy="57" r="17" fill="#B7444D"/>
    <rect x="74" y="16" width="12" height="7" rx="2" fill="#CBAE72"/>
    <circle cx="80" cy="39" r="16" fill="#D8AF5F"/>
    <rect x="117" y="40" width="12" height="7" rx="2" fill="#CBAE72"/>
    <circle cx="123" cy="63" r="16" fill="#477A58"/>`);
  const holly=svgImg(`<g transform="translate(16 8)">
    <path d="M48 46Q12 12 9 27L18 35 9 43Q28 65 48 46Z" fill="#54835A"/>
    <path d="M48 46Q77 7 94 16L89 29 104 33Q89 61 48 46Z" fill="#376B48"/>
    <path d="M48 46Q57 69 87 77L77 66 93 60Q72 44 48 46Z" fill="#6B9666"/>
    <circle cx="44" cy="45" r="8" fill="#C84C51"/>
    <circle cx="56" cy="48" r="8" fill="#C84C51"/>
    <circle cx="49" cy="58" r="8" fill="#C84C51"/></g>`);
  const bells=svgImg(`<path d="M65 21Q80 11 95 21" stroke="#B7484C" stroke-width="8"/>
    <path d="M80 22L57 35M80 22L103 35" stroke="#B7484C" stroke-width="5"/>
    <path d="M43 36Q55 27 67 36L73 65H37Z" fill="#D9AD53"/>
    <path d="M93 36Q105 27 117 36L123 65H87Z" fill="#E8C16C"/>
    <path d="M37 65H73M87 65H123" stroke="#9D783B" stroke-width="5"/>
    <circle cx="55" cy="70" r="5" fill="#9D783B"/>
    <circle cx="105" cy="70" r="5" fill="#9D783B"/>`);
  const style=document.createElement('style');style.id='cw-np-card-style';
  style.textContent=`
    html[data-whimsy="northpole"] .cw-np-decor {
      position:absolute!important;pointer-events:none!important;user-select:none;z-index:1;
      background-repeat:no-repeat;background-position:center;background-size:contain;
    }
    html:not([data-whimsy="northpole"]) .cw-np-decor {display:none!important;}
    html[data-whimsy="northpole"] .cw-np-decorated {position:relative;isolation:isolate;}
    html[data-whimsy="northpole"] .cw-np-decor-garland {
      top:3px;right:8px;width:155px;height:75px;background-image:${garland};
    }
    html[data-whimsy="northpole"] .cw-np-decor-presents {
      right:12px;bottom:7px;width:104px;height:65px;background-image:${presents};opacity:.72;
    }
    html[data-whimsy="northpole"] .cw-np-decor-ornaments {
      top:3px;right:10px;width:105px;height:80px;background-image:${ornaments};opacity:.85;
    }
    html[data-whimsy="northpole"] .cw-np-decor-holly {
      bottom:7px;right:9px;width:67px;height:48px;background-image:${holly};opacity:.58;
    }
    html[data-whimsy="northpole"] .cw-np-decor-bells {
      right:12px;bottom:8px;width:65px;height:50px;background-image:${bells};opacity:.65;
    }
    html[data-whimsy="northpole"] .cw-np-decorated > :not(.cw-np-decor) {
      position:relative;z-index:2;
    }
    html[data-whimsy="northpole"] body[data-page="todo"] .list-card > .cw-np-decor {
      top:auto!important;bottom:8px!important;right:8px!important;max-width:75px;max-height:55px;opacity:.48;
    }
    @media(max-width:650px) {
      html[data-whimsy="northpole"] .cw-np-decor-garland {
        width:83px;height:42px;right:5px;top:4px;
      }
      html[data-whimsy="northpole"] .cw-np-decor-presents {
        width:57px;height:38px;right:6px;bottom:5px;opacity:.5;
      }
      html[data-whimsy="northpole"] .cw-np-decor-ornaments {
        width:52px;height:43px;right:5px;top:4px;opacity:.65;
      }
      html[data-whimsy="northpole"] .cw-np-decor-holly,
      html[data-whimsy="northpole"] .cw-np-decor-bells {
        width:40px;height:33px;right:5px;bottom:5px;opacity:.4;
      }
      html[data-whimsy="northpole"] body[data-page="todo"] .list-card > .cw-np-decor {
        max-width:40px;max-height:32px;opacity:.32;
      }
    }
  `;
  document.head.appendChild(style);
  const cardRules=[
    ['body[data-page="home"] .today-card','garland'],
    ['body[data-page="home"] .overdue-card','presents'],
    ['body[data-page="home"] .cw-f-card','ornaments'],
    ['body[data-page="home"] .week-card','holly'],
    ['body[data-page="todo"] .list-card','alternate'],
    ['body[data-page="calendar"] .cal','bells'],
    ['body[data-page="calendar"] .table-card','alternate'],
    ['body[data-page="profile"] .profile-card','ornaments'],
    ['body[data-page="profile"] .cw-profile-streak-card','bells'],
    ['body[data-page="profile"] .card:not(.profile-card):not(.cw-profile-streak-card)','alternate'],
    ['body[data-page="calendar"] .card:not(.cal):not(.table-card)','holly'],
    ['body[data-page="admin"] .card','alternate']
  ];
  function decorate(){
    if(document.documentElement.dataset.whimsy!=='northpole')return;
    for(const [selector,type] of cardRules){
      document.querySelectorAll(selector).forEach((card,index)=>{
        let kind=type==='alternate'?['garland','presents','ornaments','holly'][index%4]:type;
        if(document.body.dataset.page==='profile'){
          const name=card.querySelector('h2,h3')?.textContent?.trim().toLowerCase()||'';
          if(name.includes('canvas'))kind='presents';
          if(name.includes('appearance'))kind='holly';
          if(name.includes('streak'))kind='bells';
        }
        card.classList.add('cw-np-decorated');
        let deco=Array.from(card.children).find(e=>e.classList.contains('cw-np-decor'));
        if(!deco){deco=document.createElement('span');deco.setAttribute('aria-hidden','true');card.appendChild(deco);}
        const desired=`cw-np-decor cw-np-decor-${kind}`;
        if(deco.className!==desired)deco.className=desired;
      });
    }
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
  if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-whimsy']});
  schedule();
})();

/* ===========================================
   DECK THE DIVS — Progress-based elf
   Reads actual Today Snapshot counts; never a fake counter.
   =========================================== */
(() => {
  let scheduled=false;
  function update(){
    if(document.documentElement.dataset.whimsy!=='northpole')return;
    const hero=document.querySelector('body[data-page="home"] .hero');
    if(!hero)return;
    const completed=Number((hero.querySelector('.hero-stat strong')?.textContent||'0').replace(/,/g,''))||0;
    const headline=hero.querySelector('h2')?.textContent?.trim()||'';
    const match=headline.match(/^(\d+)\s+(?:thing|things)\s+left today/i);
    const remaining=match?Number(match[1]):/^(your day is clear|today is done)/i.test(headline)?0:null;
    if(remaining===null)return;
    const state=remaining===0?'done':completed===0?'planning':completed<=4?'wrapping':completed<=7?'stacking':'mountain';
    if(hero.dataset.northPoleElf===state && hero.style.getPropertyValue('--cw-w-hero'))return;
    hero.style.setProperty('--cw-w-hero',northPoleArtworkBridge(state));
    hero.dataset.northPoleElf=state;
  }
  // A private bridging function is supplied by the main Whimsy module below.
  function northPoleArtworkBridge(stage){
    return window.CoursewiseNorthPoleArt ? window.CoursewiseNorthPoleArt(stage) : '';
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update()})}
  function init(){
    const main=document.querySelector('#main');
    if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true,characterData:true});
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-whimsy']});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();