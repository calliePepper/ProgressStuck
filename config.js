// TODO These code bits don't really belong here, but this is the only 
// shared bit of js

function tabulate(list) {
  var result = '';
  $.each(list, function (index) {
    if (this.length == 2) {
      if (this[1].length)
        result += "   " + this[0] + ": " + this[1] + "\n";
    } else {
      result += "   " + this + "\n";
    }
  });
  return result;
}


String.prototype.escapeHtml = function () {
  return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function template(tmpl, data) {
  var brag = tmpl.replace(/\$([_A-Za-z.]+)/g, function (str, p1) {
    var dict = data;
    $.each(p1.split("."), function (i,v) {
      if (!dict) return true;
      if (v == "___") {
        dict = tabulate(dict);
      } else {
        dict = dict[v.replace("_"," ")];
        if (typeof dict == typeof "")
          dict = dict.escapeHtml();
      }
      return null;
    });
    if (dict === undefined) dict = '';
    return dict;
  });
  return brag;
}

// From http://baagoe.com/en/RandomMusings/javascript/
  // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  mash.version = 'Mash 0.9';
  return mash;
}


// From http://baagoe.com/en/RandomMusings/javascript/
function Alea() {
  return (function(args) {
    // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;
    
    if (!args.length) {
      args = [+new Date];
    }
    var mash = Mash();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');
    
    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    
    var random = function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() + 
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = 'Alea 0.9';
    random.args = args;
    random.state = function (newstate) {
      if (newstate) {
        s0 = newstate[0];
        s1 = newstate[1];
        s2 = newstate[2];
        c = newstate[3];
      }
      return [s0,s1,s2,c];
    };
    return random;
    
  } (Array.prototype.slice.call(arguments)));
}


var seed = new Alea();

function Random(n) {
  return seed.uint32() % n;
}


function randseed(set) {
  return seed.state(set);
}


function Pick(a) {
  return a[Random(a.length)];
}


var KParts = [
  'br|cr|dr|fr|gr|j|kr|l|m|n|pr||||r|sh|tr|v|wh|x|y|z|k|vr'.split('|'),
  'a|a|e|e|i|i|o|o|u|u|ae|ie|oo|ou'.split('|'),
  'b|ck|d|g|k|m|n|p|t|v|x|z'.split('|')];

function GenerateName() {
  var result = '';
  for (var i = 0; i <= 5; ++i)
    result += Pick(KParts[i % 3]);
  result = result.slice(0,6);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function LocalStorage() {
  this.getItem = function (key, callback) {
    var result = window.localStorage.getItem(key);
    if (callback)
      callback(result);
  };

  this.setItem = function (key, value, callback) {
    window.localStorage.setItem(key, value);
    if (callback)
      callback();
  };

  this.removeItem = function (key) {
    window.localStorage.removeItem(key);
  };
}


function CookieStorage() {
  this.getItem = function(key, callback) {
    var result;
    $.each(document.cookie.split(";"), function (i,cook) {
      if (cook.split("=")[0] === key)
        result = unescape(cook.split("=")[1]);
    });
    if (callback)
      setTimeout(function () { callback(result); }, 0);
    return result;
  };
  
  this.setItem = function (key, value, callback) {
    document.cookie = key + "=" + escape(value);
    if (callback)
      setTimeout(callback, 0);
  };

  this.removeItem = function (key) {
    document.cookie = key + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
  };
}

function SqlStorage() {
  this.async = true;

  this.db = window.openDatabase("pq", "", "Progress Quest", 2500);

  this.db.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS Storage(key TEXT UNIQUE, value TEXT)");
  });

  this.getItem = function(key, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql("SELECT value FROM Storage WHERE key=?", [key], function(tx, rs) {
        if (rs.rows.length) 
          callback(rs.rows.item(0).value);
        else
          callback();
      });
    });
  };
  
  this.setItem = function (key, value, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql("INSERT OR REPLACE INTO Storage (key,value) VALUES (?,?)",
                    [key, value], 
                    callback);
    });
  };
  
  this.removeItem = function (key) {
    this.db.transaction(function (tx) {
      tx.executeSql("DELETE FROM Storage WHERE key=?", [key]);
    });
  };
}

var iPad = navigator.userAgent.match(/iPad/);
var iPod = navigator.userAgent.match(/iPod/);
var iPhone = navigator.userAgent.match(/iPhone/);
var iOS = iPad || iPod || iPhone;

var storage = ((window.localStorage && !iOS) ? new LocalStorage() :
               window.openDatabase ? new SqlStorage() :
               new CookieStorage());
  
storage.loadRoster = function (callback) {
  function gotItem(value) {
    if (value) {
      try {
        value = JSON.parse(value);
      } catch (err) {
        // aight
      }
    }
    storage.games = value || {};
    callback(storage.games);
  }
  this.getItem("roster", gotItem);
}

storage.loadSheet = function (name, callback) {
  return this.loadRoster(function (games) {
    if (callback)
      callback(games[name]);
  });
}


storage.storeRoster = function (roster, callback) {
  this.games = roster;
  try {
    this.setItem("roster", JSON.stringify(roster), callback);
  } catch (err) {
    if (err.toString().indexOf("QUOTA_EXCEEDED_ERR") != -1) {
      alert("This browser lacks storage capacity to save this game. This game can continue but cannot be saved. (Mobile Safari, I'll wager?)");
      this.storeRoster = function (roster, callback) {
        setTimeout(callback, 0);
      };
      setTimeout(callback, 0);
    } else {
      throw err;
    }
  }
}

storage.addToRoster = function (newguy, callback) {
  if (this.games) {
    this.games[newguy.Traits.Name] = newguy;
    this.storeRoster(this.games, callback);
  } else {
    this.loadRoster(function () {
      if (storage.games)  // should always be true
        storage.addToRoster(newguy, callback);
    });
  }
}

Number.prototype.div = function (divisor) {
  var dividend = this / divisor;
  return (dividend < 0 ? Math.ceil : Math.floor)(dividend);
};


function LevelUpTime(tier) {  // seconds 
  // 20 minutes per tier
  return 20 * tier * 60;
}


var K = {};

K.Traits = ["Name", "Race", "Role", "Tier", "Echeladder"];
K.Planets = ["Current", "Visited"];

K.PrimeStats = ["Strife","Irony","Scamper","Inebriation","Genteel","Trickster"];
K.Stats = K.PrimeStats.slice(0).concat(["HP Max","MP Max"]);

K.Equips = ["Weapon",
            "Off Hand",
            "Hat",
            "Shirt",
            "Pants",
            "Shoes"];

K.Starters = [
  "Sick rhymes",
  "Small hammer",
  "A fork",
  "Broken sword",
  "Small scythe",
  "A stick",
  "Knitting needles",
  "Broken Pogo stick",
  "Rock",
  "Handgun",
  "Spoon"];

K.Spells = [
  "Aggrieve",
  "Aggress",
  "Assail",
  "Assault",
  "Abjure",
  "Abstain",
  "Abscond",
  "Abuse",
  "Accuse",
  "Accede",
  "Arraign",
  "Arsenalize",
  "Artillerate",
  "Armanentify",
  "Aggrub",
  "Clemency Owl",
  "Parliament Uproar",
  "Empathy Magpie",
  "Rapport Peacock",
  "OAffinity Crow",
  "Murder Flux",
  "Auto-Parry",
  "The Windy Thing",
  "Lass Scamper",
  "Flip the Fuck out",
  "Red Miles",
  "Honk"];

K.OffenseAttrib = [
  "Polished|+1",
  "Serrated|+1",
  "Heavy|+1",
  "Pronged|+2",
  "Steely|+2",
  "Vicious|+3",
  "Venomed|+4",
  "Stabbity|+4",
  "Dancing|+5",
  "Invisible|+6",
  "Vorpal|+7"];

K.DefenseAttrib = [
  "Studded|+1",
  "Banded|+2",
  "Gilded|+2",
  "Festooned|+3",
  "Holy|+4",
  "Cambric|+1",
  "Fine|+4",
  "Impressive|+5",
  "Custom|+3"];

K.Shields = [
  "Empty Sleeve|0",
  "Pie Plate|1",
  "Vintage Record|2",
  "Laptop|3",
  "Booze|4",
  "Pumpkin|4",
  "Swag|5",
  "Carapace|5",
  "Mysterious Ring|6",
  "Scabbard|6",
  "Dice|7",
  "Squiddle|8",
  "Corpse Shield|9",
  "Juju|11",
  "Creepy Puppet|12",
  "God Field|18"];

K.Armors = [
  "Ragged|1",
  "Worn|2",
  "Standard|3",
  "Shiny|4",
  "Well Cut|5",
  "Fine|6",
  "Dandy|7",
  "Dashing|8",
  "Finely Cut|9",
  "Matching|10",
  "Handsome|12",
  "Chainmail|14",
  "Destructively spiffy|15",
  "Platemail|16",
  "Ultimate outfit|17",
  "Kevlar|18",
  "Armoured|19",
  "Strong Amour|20",
  "Hardened Armour|25",
  "God Pajamas|30"];

K.Weapons = [
  "Stick|0",
  "Broken Bottle|1",
  "Shiv|1",
  "Large Stick|1",
  "Hammer|1",
  "Fighting Fork|2",
  "Broken Sword|2",
  "Claw Hammer|2",
  "White magnum|2",
  "Revolver|3",
  "Fighting Scythe|3",
  "Harpoon Gun|3",
  "Fighting Stick|3",
  "Crowbar|4",
  "Mace|4",
  "Lipstick|4",
  "Bedeviled Needles|5",
  "Caledscratch|5",
  "Longiron|5",
  "Pogo Hammer|5",
  "Thorns of Oglogoth|5",
  "Dragon Cane|5",
  "White Wand|6",
  "Fluorite Octet|6",
  "Fiduspear|6",
  "The Condesce's Double Trident|6",
  "Demonbane Ragripper|7",
  "Clawsickle|7",
  "Action Claws|7",
  "Skaia War Fork|7",
  "Cigarette Holder Lancer|8",
  "Ahab's Crosshairs|8",
  "Fear No Anvil|8",
  "Unbreakable Katana|9",
  "Thistles of Zillywich|9",
  "Blunderbuss of Zillwigh|10",
  "Cutlass of Zillywair|10",
  "Flintlocks of Zillyhau|11",
  "Battlespork of Zillywut|12",
  "Warhammer of Zillyhoo|15",
  "Pop-a-matic Vrillyhoo Hammer|16",
  "Lord English's Assault Rifle|17"];

K.Specials = [
  "Diadem",
  "Festoon",
  "Gemstone",
  "Phial",
  "Tiara",
  "Scabbard",
  "Arrow",
  "Lens",
  "Lamp",
  "Hymnal",
  "Fleece",
  "Laurel",
  "Brooch",
  "Gimlet",
  "Cobble",
  "Albatross",
  "Brazier",
  "Bandolier",
  "Tome",
  "Garnet",
  "Amethyst",
  "Candelabra",
  "Corset",
  "Sphere",
  "Sceptre",
  "Ankh",
  "Talisman",
  "Orb",
  "Gammel",
  "Ornament",
  "Brocade",
  "Galoon",
  "Bijou",
  "Spangle",
  "Gimcrack",
  "Hood",
  "Vulpeculum"];

K.ItemAttrib = [
  "Golden",
  "Gilded",
  "Spectral",
  "Astral",
  "Garlanded",
  "Precious",
  "Crafted",
  "Dual",
  "Filigreed",
  "Cruciate",
  "Arcane",
  "Blessed",
  "Reverential",
  "Lucky",
  "Enchanted",
  "Gleaming",
  "Grandiose",
  "Sacred",
  "Legendary",
  "Mythic",
  "Crystalline",
  "Austere",
  "Ostentatious",
  "One True",
  "Proverbial",
  "Fearsome",
  "Deadly",
  "Benevolent",
  "Unearthly",
  "Magnificent",
  "Iron",
  "Ormolu",
  "Puissant"];

K.ItemOfs = [
  "Foreboding",
  "Foreshadowing",
  "Nervousness",
  "Happiness",
  "Torpor",
  "Danger",
  "Craft",
  "Silence",
  "Invisibility",
  "Rapidity",
  "Pleasure",
  "Practicality",
  "Hurting",
  "Joy",
  "Petulance",
  "Intrusion",
  "Chaos",
  "Suffering",
  "Extroversion",
  "Frenzy",
  "Sisu",
  "Solitude",
  "Punctuality",
  "Efficiency",
  "Comfort",
  "Patience",
  "Internment",
  "Incarceration",
  "Misapprehension",
  "Loyalty",
  "Envy",
  "Acrimony",
  "Worry",
  "Fear",
  "Awe",
  "Guile",
  "Prurience",
  "Fortune",
  "Perspicacity",
  "Domination",
  "Submission",
  "Fealty",
  "Hunger",
  "Despair",
  "Cruelty",
  "Grob",
  "Dignard",
  "Ra",
  "the Bone",
  "Diamonique",
  "Electrum",
  "Hydragyrum"];

K.BoringItems = [
  "nail",
  "lunchpail",
  "sock",
  "I.O.U.",
  "cookie",
  "pint",
  "toothpick",
  "writ",
  "newspaper",
  "letter",
  "plank",
  "hat",
  "egg",
  "coin",
  "needle",
  "bucket",
  "ladder",
  "chicken",
  "twig",
  "dirtclod",
  "counterpane",
  "vest",
  "teratoma",
  "bunny",
  "rock",
  "pole",
  "carrot",
  "canoe",
  "inkwell",
  "hoe",
  "bandage",
  "trowel",
  "towel",
  "planter box",
  "anvil",
  "axle",
  "tuppence",
  "casket",
  "nosegay",
  "trinket",
  "credenza",
  "writ"];

K.PlanetAspect = [
  "Feet",
  "Shotguns",
  "Mist",
  "Light",
  "Clouds",
  "Gas",
  "Poison",
  "Heat",
  "Cold",
  "Clockwork",
  "Danger",
  "Chairs",
  "Teapots",
  "Teacups",
  "Pickles",
  "Oboes",
  "Colour",
  "Magic",
  "Skeletons",
  "Ruins",
  "People",
  "Tiny Horses",
  "Oversized Bugs",
  "Boats",
  "Guns",
  "Vapor",
  "Dirt",
  "Rocks",
  "Mountains",
  "Plains",
  "Birds",
  "Tea",
  "Biscuits",
  "Yogurt",
  "Cups",
  "Pills",
  "Books",
  "Bookshelves",
  "Giants",
  "Videos",
  "Malls",
  "Arcades",
  "Carparks",
  "Midgets",
  "Dwarves",
  "Crystal",
  "Vaseline",
  "Porn",
  "Games",
  "TVs",
  "Display Cases",
  "Spiders",
  "Space Ships",
  "Dogs",
  "Cats",
  "Lizards",
  "Canines",
  "Badgers",
  "Death",
  "Darkness",
  "Band Posters",
  "Airplanes",
  "Gloves",
  "Spectacles",
  "Angels",
  "Demons",
  "RSS Feeds",
  "Browsers",
  "Mirrors",
  "Coins",
  "Maps",
  "Bags",
  "Plains",
  "Shoes",
  "Coloured Mists",
  "Toxins",
  "Venom",
  "Circuit Boards",
  "Teatowels",
  "Oceans",
  "Lakes",
  "Holes",
  "Pens",
  "Towers",
  "Houses",
  "Roads",
  "Highways",
  "Ditches",
  "Potholes",
  "Clouds",
  "Trees",
  "Ice",
  "Fire",
  "Peas",
  "Deserts",
  "Forests",
  "Glaciers",
  "Monsters",
  "Snow",
  "Torpor",
  "Puppies",
  "Kitties",
  "Jokes",
  "Androids",
  "Pain",
  "Passion",
  "Justice",
  "Pies",
  "Natural Disasters",
  "Cake",
  "Genitalia",
  "Santa Statues",
  "Elves",
  "Pumpkins",
  "Hills",
  "Dales",
  "Juice",
  "Airports",
  "Crime",
  "Criminals",
  "Courts",
  "Japes",
  "Irony",
  "Centaurs",
  "Winged Horses",
  "Lightning",
  "Thunder",
  "Earthquakes",
  "Whirlpools",
  "Tornadoes",
  "Corn Fields",
  "Gravel",
  "Rain",
  "Pizza",
  "Wills",
  "Rainbows",
  "Grapes",
  "Timepieces",
  "Ropes",
  "Candles",
  "Kites",
  "Obelisks",
  "Monuments",
  "Tests",
  "Tombs",
  "Wolves",
  "Frogs",
  "Squids",
  "Huts",
  "Ice cream",
  "Dreams",
  "Gates",
  "Igloos",
  "Cotton Puffs",
  "Adventure",
  "Figs",
  "Tulips",
  "Asymmetry",
  "Spectacles",
  "Slides",
  "Ladders",
  "Puns",
  "Pyramids",
  "Scarecrows",
  "Idioms",
  "Cliffs",
  "Hugs",
  "Fences",
  "Caves",
  "Volcanoes",
  "Yurts",
  "Invertebrates",
  "Rhyme",
  "Dance",
  "Pineapples",
  "Beaches",
  "Fragrance",
  "Rapids"];

K.Monsters = [
  "Imp|1| horns",
  "Imp|1| middle digit",
  "Salamander|1| bubble",
  "Crocodile|1| nak",
  "Turtle|1|'s respect",
  "Iguana|1|'s unhappiness",
  "ICP wannabe|1|'s lack of self respect",
  "Salamander|1| toes",
  "Crocodile|1|'s bussiness sense",
  "Ogre|2|'s anger",
  "Ogre|2| club",
  "Clown|2| codpiece",
  "Shale Imp|2|'s oiled hat",
  "Chalk imp|2|'s pile of chalk",
  "Amber imp|2|'s amber trapped insect",
  "Black drone|2|'s polished stick",
  "Black drone|2| unmentionables",
  "White drone|2|'s cane",
  "White drone|2|'s lack of hat",
  "Salamancer|3|'s magic staff",
  "Salamancer|3|'s thirst for power",
  "Mercury Imp|3|'s toxic vial",
  "Crude ogre|3|'s oil shale",
  "Marble imp|3|'s candycane rock",
  "Rust imp|3|'s rusted sword",
  "Crocodiddle|3|'s diddle",
  "Salamander Skeleton|3| skull",
  "Crocodile Skeleton|3| rib bone",
  "Ogre Skeleton|4| humerous",
  "Prototyped imp|4|'s weapon",
  "Lime ogre|4|'s lime pieces",
  "Cobalt imp|4|'s blue pants",
  "Basilisk|4| glare",
  "White knight|4| mount",
  "White knight|4|'s self respect",
  "Black knight|4|'s destructive tendencies",
  "ICP follower|5| face paint",
  "Tar Basilisk|5|'s poop shaped tar",
  "Sulfur ogre|5|'s rotten eggs",
  "Mummy|5| bandage",
  "Smuppet|6| felt butt",
  "Smuppet|6| knowing eyes",
  "Amber Basilisk|6|'s amber fork",
  "Amber ogre|6|'s amber underwear",
  "Doomed self|7|'s terror",
  "Uranium imp|7|'s irradiated cabbage",
  "Lich|8| phylactory",
  "Angel|8| halo",
  "Purple Basilisk|8|'s lizard codpiece",
  "Angel|8| wing",
  "Giant|9|'s oversized pants",
  "Caulk lich|9|'s caulk chalk",
  "Giclops|10|'s single large eye",
  "Purple Lich|10|'s fabulous pants",
  "Lepricorn|10|'s numbered hat",
  "Ruby giclops|11|'s ruby slippers",
  "Cherub|12|'s red spiral",
  "Cherub|12|'s green spiral",
  "Typheus|15|'s slumber drool",
  "Cetus|14|'s scale",
  "Hephaestus|16|'s forge",
  "Echidna|17|'s quill",
  "Hemera|18|'s light",
  "Nyx|19|'s darkness",
  "Yaldabaoth|20|'s creation",
  "Insane clown posse leader|20| face paint",
  "Abraxas|21|'s merge",
  "Black Queen|23| ring",
  "White Queen|25| ring",
  "Black King|27| staff",
  "White King|29| staff",
  "Horror Terror|32| tentacle",
  "Mating cherub|35|'s wrath",
  "Mating cherub|36|'s calm",
  "Doc Scratch|40|'s cue ball",
  "Condesce|58|'s control of troll kind",
  "Lord English|66|'s golden leg",
  "Andrew Hussie|100|'s plot"];

K.OldList = [
  "Anhkheg|6|chitin",
  "Ant|0|antenna",
  "Ape|4|ass",
  "Baluchitherium|14|ear",
  "Beholder|10|eyestalk",
  "Black Pudding|10|saliva",
  "Blink Dog|4|eyelid",
  "Cub Scout|1|neckerchief",
  "Girl Scout|2|cookie",
  "Boy Scout|3|merit badge",
  "Eagle Scout|4|merit badge",
  "Bugbear|3|skin",
  "Bugboar|3|tusk",
  "Boogie|3|slime",
  "Camel|2|hump",
  "Carrion Crawler|3|egg",
  "Catoblepas|6|neck",
  "Centaur|4|rib",
  "Centipede|0|leg",
  "Cockatrice|5|wattle",
  "Couatl|9|wing",
  "Crayfish|0|antenna",
  "Demogorgon|53|tentacle",
  "Jubilex|17|gel",
  "Manes|1|tooth",
  "Orcus|27|wand",
  "Succubus|6|bra",
  "Vrock|8|neck",
  "Hezrou|9|leg",
  "Glabrezu|10|collar",
  "Nalfeshnee|11|tusk",
  "Marilith|7|arm",
  "Balor|8|whip",
  "Yeenoghu|25|flail",
  "Asmodeus|52|leathers",
  "Baalzebul|43|pants",
  "Barbed Devil|8|flame",
  "Bone Devil|9|hook",
  "Dispater|30|matches",
  "Erinyes|6|thong",
  "Geryon|30|cornucopia",
  "Malebranche|5|fork",
  "Ice Devil|11|snow",
  "Lemure|3|blob",
  "Pit Fiend|13|seed",
  "Anklyosaurus|9|tail",
  "Brontosaurus|30|brain",
  "Diplodocus|24|fin",
  "Elasmosaurus|15|neck",
  "Gorgosaurus|13|arm",
  "Iguanadon|6|thumb",
  "Megalosaurus|12|jaw",
  "Monoclonius|8|horn",
  "Pentasaurus|12|head",
  "Stegosaurus|18|plate",
  "Triceratops|16|horn",
  "Tyranosauraus Rex|18|forearm",
  "Djinn|7|lamp",
  "Doppleganger|4|face",
  "Black Dragon|7|*",
  "Plaid Dragon|7|sporrin",
  "Blue Dragon|9|*",
  "Beige Dragon|9|*",
  "Brass Dragon|7|pole",
  "Tin Dragon|8|*",
  "Bronze Dragon|9|medal",
  "Chromatic Dragon|16|scale",
  "Copper Dragon|8|loafer",
  "Gold Dragon|8|filling",
  "Green Dragon|8|*",
  "Platinum Dragon|21|*",
  "Red Dragon|10|cocktail",
  "Silver Dragon|10|*",
  "White Dragon|6|tooth",
  "Dragon Turtle|13|shell",
  "Dryad|2|acorn",
  "Dwarf|1|drawers",
  "Eel|2|sashimi",
  "Efreet|10|cinder",
  "Sand Elemental|8|glass",
  "Bacon Elemental|10|bit",
  "Porn Elemental|12|lube",
  "Cheese Elemental|14|curd",
  "Hair Elemental|16|follicle",
  "Swamp Elf|1|lilypad",
  "Brown Elf|1|tusk",
  "Sea Elf|1|jerkin",
  "Ettin|10|fur",
  "Frog|0|leg",
  "Violet Fungi|3|spore",
  "Gargoyle|4|gravel",
  "Gelatinous Cube|4|jam",
  "Ghast|4|vomit",
  "Ghost|10|*",
  "Ghoul|2|muscle",
  "Humidity Giant|12|drops",
  "Beef Giant|11|steak",
  "Quartz Giant|10|crystal",
  "Porcelain Giant|9|fixture",
  "Rice Giant|8|grain",
  "Cloud Giant|12|condensation",
  "Fire Giant|11|cigarettes",
  "Frost Giant|10|snowman",
  "Hill Giant|8|corpse",
  "Stone Giant|9|hatchling",
  "Storm Giant|15|barometer",
  "Mini Giant|4|pompadour",
  "Gnoll|2|collar",
  "Gnome|1|hat",
  "Goblin|1|ear",
  "Grid Bug|1|carapace",
  "Jellyrock|9|seedling",
  "Beer Golem|15|foam",
  "Oxygen Golem|17|platelet",
  "Cardboard Golem|14|recycling",
  "Rubber Golem|16|ball",
  "Leather Golem|15|fob",
  "Gorgon|8|testicle",
  "Gray Ooze|3|gravy",
  "Green Slime|2|sample",
  "Griffon|7|nest",
  "Banshee|7|larynx",
  "Harpy|3|mascara",
  "Hell Hound|5|tongue",
  "Hippocampus|4|mane",
  "Hippogriff|3|egg",
  "Hobgoblin|1|patella",
  "Homonculus|2|fluid",
  "Hydra|8|gyrum",
  "Imp|2|tail",
  "Invisible Stalker|8|*",
  "Iron Peasant|3|chaff",
  "Jumpskin|3|shin",
  "Kobold|1|penis",
  "Leprechaun|1|wallet",
  "Leucrotta|6|hoof",
  "Lich|11|crown",
  "Lizard Man|2|tail",
  "Lurker|10|sac",
  "Manticore|6|spike",
  "Mastodon|12|tusk",
  "Medusa|6|eye",
  "Multicell|2|dendrite",
  "Pirate|1|booty",
  "Berserker|1|shirt",
  "Caveman|2|club",
  "Dervish|1|robe",
  "Merman|1|trident",
  "Mermaid|1|gills",
  "Mimic|9|hinge",
  "Mind Flayer|8|tentacle",
  "Minotaur|6|map",
  "Yellow Mold|1|spore",
  "Morkoth|7|teeth",
  "Mummy|6|gauze",
  "Naga|9|rattle",
  "Nebbish|1|belly",
  "Neo-Otyugh|11|organ ",
  "Nixie|1|webbing",
  "Nymph|3|hanky",
  "Ochre Jelly|6|nucleus",
  "Octopus|2|beak",
  "Ogre|4|talon",
  "Ogre Mage|5|apparel",
  "Orc|1|snout",
  "Otyugh|7|organ",
  "Owlbear|5|feather",
  "Pegasus|4|aileron",
  "Peryton|4|antler",
  "Piercer|3|tip",
  "Pixie|1|dust",
  "Man-o-war|3|tentacle",
  "Purple Worm|15|dung",
  "Quasit|3|tail",
  "Rakshasa|7|pajamas",
  "Rat|0|tail",
  "Remorhaz|11|protrusion",
  "Roc|18|wing",
  "Roper|11|twine",
  "Rot Grub|1|eggsac",
  "Rust Monster|5|shavings",
  "Satyr|5|hoof",
  "Sea Hag|3|wart",
  "Silkie|3|fur",
  "Shadow|3|silhouette",
  "Shambling Mound|10|mulch",
  "Shedu|9|hoof",
  "Shrieker|3|stalk",
  "Skeleton|1|clavicle",
  "Spectre|7|vestige",
  "Sphinx|10|paw",
  "Spider|0|web",
  "Sprite|1|can",
  "Stirge|1|proboscis",
  "Stun Bear|5|tooth",
  "Stun Worm|2|trode",
  "Su-monster|5|tail",
  "Sylph|3|thigh",
  "Titan|20|sandal",
  "Trapper|12|shag",
  "Treant|10|acorn",
  "Triton|3|scale",
  "Troglodyte|2|tail",
  "Troll|6|hide",
  "Umber Hulk|8|claw",
  "Unicorn|4|blood",
  "Vampire|8|pancreas",
  "Wight|4|lung",
  "Will-o'-the-Wisp|9|wisp",
  "Wraith|5|finger",
  "Wyvern|7|wing",
  "Xorn|7|jaw",
  "Yeti|4|fur",
  "Zombie|2|forehead",
  "Wasp|0|stinger",
  "Rat|1|tail",
  "Bunny|0|ear",
  "Moth|0|dust",
  "Beagle|0|collar",
  "Midge|0|corpse",
  "Ostrich|1|beak",
  "Billy Goat|1|beard",
  "Bat|1|wing",
  "Koala|2|heart",
  "Wolf|2|paw",
  "Whippet|2|collar",
  "Uruk|2|boot",
  "Poroid|4|node",
  "Moakum|8|frenum",
  "Fly|0|*",
  "Hogbird|3|curl",
  "Wolog|4|lemma"];

K.MonMods = [
  "-4 fœtal *",
  "-4 dying *",
  "-3 crippled *",
  "-3 baby *",
  "-2 adolescent",
  "-2 very sick *",
  "-1 lesser *",
  "-1 undernourished *",
  "+1 greater *",
  "+1 * Elder",
  "+1 Prototyped",
  "+2 war *",
  "+2 Battle-*",
  "+3 Were-*",
  "+3 undead *",
  "+4 giant *",
  "+4 * Rex"];

K.OffenseBad = [
  "Derpy|-2",
  "Artifacted|-1",
  "Crap|-3",
  "Blunt|-5",
  "Bent|-4",
  "Tiny|-4",
  "Rubber|-6",
  "Nerdy|-7",
  "Miniscule|-2"];

K.DefenseBad = [
  "Holey|-1",
  "Patched|-1",
  "Threadbare|-2",
  "Faded|-1",
  "Rusty|-3",
  "Motheaten|-3",
  "Mildewed|-2",
  "Torn|-3",
  "Dented|-3",
  "Cursed|-5",
  "Plastic|-4",
  "Cracked|-4",
  "Warped|-3",
  "Corroded|-3"];

K.Races = [
  "Troll|MP Max",
  "Human|Trickster",
  "Doomed Self|Irony",
  "Dream Self|Irony",
  "Salamander|Scamper",
  "Crocodile|Strife",
  "Turtle|Irony",
  "Iguana|Inebriation",
  "Smuppet|Irony",
  "Drone|HP Max",
  "Imp|Trickster",
  "Ogre|Strife",
  "Basilisk|Strife",
  "White Carapace|MP Max",
  "Black Carapace|Trickster",
  "Cherub|Inebriation",
  "Horror Terror|Irony"];


K.Klasses = [
  "Rogue|Scamper",
  "Thief|Scamper",
  "Heir|Strife",
  "Maid|Inebriation",
  "Page|Irony",
  "Knight|Irony",
  "Seer|Inebriation",
  "Mage|Genteel",
  "Sylph|HP Max",
  "Witch|MP Max",
  "Bard|Trickster",
  "Prince|Trickster",
  "Muse|Inebriation",
  "Lord|Trickster"
  ];

K.Aspects = [
  "Time|Irony",
  "Space|MP Max",
  "Void|Inebriation",
  "Light|Inebriation",
  "Mind|Trickster",
  "Heart|Genteel",
  "Rage|Strife",
  "Hope|Trickster",
  "Doom|HP Max",
  "Life|HP Max",
  "Blood|Scamper",
  "Breath|Irony"
];


K.Titles = [
  "Mr.",
  "Mrs.",
  "Sir",
  "Sgt.",
  "Ms.",
  "Captain",
  "Chief",
  "Admiral",
  "Saint"];

K.ImpressiveTitles = [
  "King",
  "Queen",
  "Lord",
  "Lady",
  "Viceroy",
  "Mayor",
  "Prince",
  "Princess",
  "Chief",
  "Boss",
  "Archbishop"];

K.Dividers = [
  " ",
  "-"
];

K.TitleBits = [
  "Greentike",
  "Kiddo",
  "Eclipse",
  "Ribbit",
  "Rustler",
  "Shuteye",
  "Crackshot",
  "Viridian",
  "Neophyte",
  "Satellite",
  "Debutante",
  "Claberlass",
  "Atom",
  "Nabber",
  "Narcoleptoddler",
  "Dreamteen",
  "Fallout",
  "Bloomer",
  "Peacock",
  "Smartypants",
  "Blowsack",
  "Scalawag",
  "Glasshouse",
  "Urchin",
  "Lil'",
  "Plucky",
  "Tot",
  "Juvesquirt",
  "Fidgety",
  "Anklebiter",
  "Champ",
  "Fry",
  "Pesky",
  "Urchin",
  "Boy",
  "Skylark",
  "Heir",
  "Transparent",
  "Pentacle",
  "Therapist",
  "Threadspinner",
  "Glare",
  "Hotpotato",
  "Butterfingers",
  "Pimpslayer",
  "Ectobotananna",
  "Britches",
  "Ripper",
  "Batterlass",
  "Slapstick",
  "Juniorsleuth",
  "Overbite",
  "Restart",
  "Snorkbait",
  "Sporkplug",
  "Bespectacled",
  "Skeptic",
  "Haberdasher",
  "Breaches",
  "Pratfall",
  "Confidante",
  "Mourning",
  "Star",
  "Skullsmuggler",
  "Pumpkinpatch",
  "Gunslinger",
  "Scrumrunner",
  "Hope-a-Dope",
  "Boxer",
  "Sharkbait",
  "Heartthrob",
  "Panache"
];

function CreatePlanet() {
  var posn = Random(K.PlanetAspect.length);
  var posn2 = Random(K.PlanetAspect.length);
  while (posn == posn2) {
    var posn2 = Random(K.PlanetAspect.length);
  }
  return 'Land of ' + K.PlanetAspect[posn] + " and " + K.PlanetAspect[posn2];
}