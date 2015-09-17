/* copyright (c)2002-2010 Eric Fredricksen all rights reserved */


function Roll(stat) {
  stats[stat] = 3 + Random(6) + Random(6) + Random(6);
  if (document)
    $("#"+stat).text(stats[stat]);
  return stats[stat];
}

function Choose(n, k) {
  var result = n;
  var d = 1;
  for (var i = 2; i <= k; ++i) {
    result *= (1+n-i);
    d = d * i;
  }
  return result / d;
}

var stats = {};
var traits = {};
var total = 0;
var seedHistory = [];

function RollEm() {
  stats.seed = randseed();
  total = 0;
  var best = -1;
  $.each(K.PrimeStats, function () { 
    total += Roll(this);
    if (best < stats[this]) {
      best = stats[this];
      stats.best = this;
    }
  });
  stats['HP Max'] = Random(8) + stats.Irony.div(6);
  stats['MP Max'] = Random(8) + stats.Inebriation.div(6);

  var color = 
    (total >= (63+18)) ? 'red'    :
    (total > (4 * 18)) ? 'yellow' :
    (total <= (63-18)) ? 'grey'   :
    (total < (3 * 18)) ? 'silver' :
    'white';

  if (document) {
    var Total = $("#Total");
    Total.text(total);
    Total.css("background-color", color);

    $("#Unroll").attr("disabled", !seedHistory.length);
  }
}

function RerollClick() {
  seedHistory.push(stats.seed);
  RollEm();
}


function UnrollClick() {
  randseed(seedHistory.pop());
  RollEm();
}

function fill(e, a, n) {
  var def = Random(a.length);
  for (var i = 0; i < a.length; ++i) {
    var v = a[i].split("|")[0];
    var check = (def == i) ? " checked " : " ";
    if (def == i) traits[n] = v;
    if (document) {
      $("<div><input type=radio id='" + v + "' name=\"" + n + "\" value=\"" + v + "\" " +
        check  +"><label for='" + v + "'>" + v + "</label></div>").appendTo(e);
    }
  }
}

function NewGuyFormLoad() {
  seed = new Alea();
  RollEm();
  GenClick();

  fill("#races", K.Races, "Race");
  fill("#classes", K.Klasses, "Class");
  fill("#aspects", K.Aspects, "Aspect");

  if (document) {
    $("#Reroll").click(RerollClick);
    $("#Unroll").click(UnrollClick);
    $("#RandomName").click(GenClick);
    $('#Sold').click(sold);
    $('#quit').click(cancel);

    //var caption = 'Progress Stuck - New Character';
    //if (MainForm.GetHostName != '')
      //  caption = caption + ' [' + MainForm.GetHostName + ']';

    $("#Name").focus();
    $("#Name").select();
  }

  if (window.location.href.indexOf("?sold") > 0)
    sold();  // TODO: cheesy
}


if (document)
  $(document).ready(NewGuyFormLoad);

/* Multiplayer:
function TNewGuyForm_ParseSoldResponse(body) {
  if ((LowerCase(Split(body,0)) == 'ok')) {
    MainForm.SetPasskey(Split(body,1));
    MainForm.SetLogin(GetAccount);
    MainForm.SetPassword(GetPassword);
    ModalResult = mrOk;
  } else {
    ShowMessage(body);
  }
}

function TNewGuyForm_GetAccount() {
  return Account.Visible ? Account.Text : '';
}

function TNewGuyForm_GetPassword() {
  return (Password.Visible) ? Password.Text : '';
}

function TNewGuyForm_SoldClick() {
  if (MainForm.GetHostAddr == '') {
    ModalResult = mrOk;
  } else {
    try {
      Screen.Cursor = crHourglass;
      try {
        if ((MainForm.Label8.Tag && 16) == 0
       ) url = MainForm.GetHostAddr
        else url = 'http://www.progressquest.com/create.php?';
        // url = StringReplace(url, '.com/', '.com/dev/', []);
        if ((GetAccount() != '') || (GetPassword != ''))
          url = StuffString(url, 8, 0, GetAccount() + ':' + GetPassword() + '@');
        args = 'cmd=create' +
                '&name=' + escape(Name.Text) +
                '&realm=' + escape(MainForm.GetHostName) +
                RevString;
        ParseSoldResponse(DownloadString(url + args));
      } catch (EWebError) {
        ShowMessage('Error connecting to server');
      }
    } finally {
      Screen.Cursor = crDefault;
    }
  }
}
*/

function sold() {
  var posn = Random(K.Starters.length);
  var planetName = CreatePlanet();
  var planet = planetName + "(Home)";
  var planetTime = {
      Current: '<p>' + planet + '</p>',
      Visited: '<p>' + planet + '</p>'
    }; 
  var newguy = {
    Traits: traits,
    Planets: planetTime,
    dna: stats.seed,
    backgroundKid: 'back_john.jpg',
    seed: stats.seed,
    birthday: ''+new Date(),
    birthstamp: +new Date(),
    Stats: stats,
    beststat: stats.best + " " + stats[stats.best],
    task: "",
    tasks: 0,
    elapsed: 0,
    bestequip: K.Starters[posn],
    Equips: {},
    Inventory: [['Grist', 0]],
    Spells: [],
    act: 0,
    bestplot: "Prologue",
    Quests: [],
    questmonster: "",
    kill: "Loading....",
    ExpBar: { position: 0, max: LevelUpTime(1) },
    EncumBar: { position: 0, max: stats.Strife + 10 },
    PlotBar: { position: 0, max: 26 },
    QuestBar: { position: 0, max: 1 },
    TaskBar: { position: 0, max: 2000 },
    queue: [
      'task|10|Loading up Sburb for the first time you connect with your server player',
      "task|6|After losing your toilet to an unfortunate accident, your server player sets you up",
      'task|6|Just in the nick of time you enter your session as your house and planet are threatened with destruction',
      'task|4|You find yourself in a strange land, and head out to start your new adventure in the '+planetName,
      'plot|2|Loading'
    ]
  };

  if (document) {
    newguy.Traits.Name = $("#Name").val();
    newguy.Traits.Race = $("input:radio[name=Race]:checked").val();
    newguy.Traits.Role = $("input:radio[name=Class]:checked").val() + " of " + $("input:radio[name=Aspect]:checked").val();
    newguy.Traits.Echeladder = 'Scamp';
  }
  newguy.Traits.Tier = 1;

  newguy.date = newguy.birthday;
  newguy.stamp = newguy.birthstamp;

  $.each(K.Equips, function (i,equip) { newguy.Equips[equip] = ''; });
  newguy.Equips.Weapon = newguy.bestequip;
  newguy.Equips.Short = "Cloth Shirt";

  storage.addToRoster(newguy, function () {
    window.location.href = "main.html#" + escape(newguy.Traits.Name);
  });

}

function cancel() {
  window.location.href = "roster.html";
}

function GenClick() {
  traits.Name = GenerateName();
  if (document)
    $("#Name").attr("value", traits.Name);
}

