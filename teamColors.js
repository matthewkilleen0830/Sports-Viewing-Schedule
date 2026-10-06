const TEAM_COLORS = {
      
    "Air Force": "#003087", "Alaska": "#00205B", "Alaska-Anchorage": "#005A36", "Arizona State": "#8C1D40",
    "Army": "#D4BF91", "Assumption": "#004B87", "Augustana": "#002D62", "Bemidji State": "#004B49",
    "Bentley": "#00205B", "Boston College": "#98002E", "Boston University": "#CC0000", "Bowling Green": "#4F2C1D",
    "Brown": "#4E3629", "Canisius": "#002D62", "Clarkson": "#004B49", "Colgate": "#821019", "Colorado College": "#000000",
    "Cornell": "#B31B1B", "Dartmouth": "#00693E", "Delaware": "#00539F", "Denver": "#8B2332",
    "Ferris State": "#BA0C2F", "Franklin Pierce": "#A91938", "Harvard": "#A51C30", "Holy Cross": "#60269E",
    "Lake Superior": "#005A36", "Lindenwood": "#B3A369", "LIU": "#69B3E7", "Maine": "#003263",
    "Maryville": "#C8102E", "Mercyhurst": "#00594E", "Merrimack": "#00205B", "Miami (Ohio)": "#B81137",
    "Michigan": "#00274C", "Michigan State": "#18453B", "Michigan Tech": "#FFCD00", "Minnesota": "#7A003C",
    "Minnesota Duluth": "#4A121A", "Minnesota State": "#4B2E83", "New Hampshire": "#00205B",
    "Niagara": "#002D62", "North Dakota": "#006A4E", "Northeastern": "#CC0000", "Northern Michigan": "#006633",
    "Notre Dame": "#0C2340", "Ohio State": "#BB0000", "Omaha": "#000000", "Penn State": "#001E44", "Post": "#F68B1F",
    "Princeton": "#FF8F00", "Providence": "#000000", "Quinnipiac": "#0A2240", "RIT": "#F36E21",
    "Robert Morris": "#00205B", "RPI": "#D6001C", "Sacred Heart": "#C8102E", "Saint Anselm": "#002B5C",
    "Saint Michael's": "#55318C", "St. Cloud State": "#CC0000", "St. Lawrence": "#AF1E2D",
    "St. Thomas": "#512888", "Stonehill": "#00205B", "Syracuse": "#F76900", "UConn": "#000E2E", "UMass": "#881C1C",
    "UMass Lowell": "#0067C5", "Union": "#821019", "US NTDP": "#98002E", "Vermont": "#005A36",
    "Western Michigan": "#5C1322", "Windsor": "#005A36", "Wisconsin": "#C5050C", "Yale": "#00356B",

    // Big Ten
      "Illinois": "#E84A27", "Indiana": "#990000", "Iowa": "#000000", "Maryland": "#E21A23",
      "Michigan": "#00274C", "Michigan State": "#18453B", "Minnesota": "#7A0019", "Nebraska": "#E31837",
      "Northwestern": "#4E2A84", "Ohio State": "#BB0000", "Oregon": "#001600", "Penn State": "#041E42",
      "Purdue": "#000000", "Rutgers": "#000000", "UCLA": "#2D68C4", "USC": "#990000",
      "Washington": "#4B2E83", "Wisconsin": "#C5050C",

      // SEC
      "Alabama": "#9E1B32", "Arkansas": "#9D2235", "Auburn": "#0C2340", "Florida": "#0021A5",
      "Georgia": "#BA0C2F", "Kentucky": "#0033A0", "LSU": "#461D7C", "Mississippi State": "#660000",
      "Missouri": "#000000", "Oklahoma": "#841617", "Ole Miss": "#006BA6", "South Carolina": "#73000A",
      "Tennessee": "#58595B", "Texas A&M": "#BA9B77", "Texas": "#BF5700", "Vanderbilt": "#866D4B",

      // ACC
      "Boston College": "#98002E", "Cal": "#002676", "Clemson": "#F56600", "Duke": "#003087",
      "Florida State": "#782F40", "Georgia Tech": "#B3A369", "Louisville": "#AD0000", "Miami": "#F47321",
      "North Carolina": "#7BAFD4", "NC State": "#CC0000", "Pitt": "#003594", "SMU": "#0033A0",
      "Stanford": "#8C1515", "Syracuse": "#D44500", "Virginia": "#232D4B", "Virginia Tech": "#630031",
      "Wake Forest": "#9E7E38",

      // Big 12
      "Arizona": "#CC0003", "Arizona State": "#8C1D40", "Baylor": "#154734", "BYU": "#0062B8",
      "Cincinnati": "#000000", "Colorado": "#CFB87C", "Houston": "#418FDE", "Iowa State": "#C8102E",
      "Kansas": "#0051BA", "Kansas State": "#512888", "Oklahoma State": "#FE5C00", "TCU": "#4D1979",
      "Texas Tech": "#C30020", "UCF": "#BA9B37", "Utah": "#CC0000", "West Virginia": "#002855",

      // MAC
      "Akron": "#041E42", "Ball State": "#BA0C2F", "Bowling Green": "#4F2C1D", "Buffalo": "#005BBB",
      "Central Michigan": "#6A0032", "Eastern Michigan": "#006633", "Kent State": "#002664",
      "Miami (Ohio)": "#C8102E", "Ohio": "#00694E", "Sacramento State": "#043927", "Toledo": "#15397F",
      "UMass": "#881C1C", "Western Michigan": "#532E1F",

      // Mountain West
      "Air Force": "#000000", "Hawai'i": "#024731", "Nevada": "#003366", "New Mexico": "#BA0C2F",
      "North Dakota State": "#00583D", "Northern Illinois": "#C8102E", "San Jose State": "#0055A2",
      "UNLV": "#E31837", "UTEP": "#FF8200", "Wyoming": "#492F24",

      // Pac-12
      "Boise State": "#0033A0", "Colorado State": "#1E4D2B", "Fresno State": "#C41230", "Oregon State": "#D73F09",
      "San Diego State": "#000000", "Texas State": "#501214", "Utah State": "#00263A", "Washington State": "#981E32",

      // AAC
      "Army": "#000000", "Charlotte": "#00502F", "East Carolina": "#582C83", "Florida Atlantic": "#003366",
      "Memphis": "#003087", "Navy": "#0C2340", "North Texas": "#00853E", "Rice": "#00205B",
      "South Florida": "#006747", "Temple": "#9D2235", "Tulane": "#006747", "Tulsa": "#002D62",
      "UAB": "#215732", "UTSA": "#0C2340",

      // Conference USA
      "Delaware": "#00539B", "Florida International": "#FE52E5", "Jacksonville State": "#CC0000",
      "Kennesaw State": "#000000", "Liberty": "#0A2342", "Middle Tennessee": "#0066CC",
      "Missouri State": "#5E0009", "New Mexico State": "#891216", "Sam Houston": "#F47920",
      "Western Kentucky": "#BD0F26",

      // Sun Belt
      "Appalachian State": "#000000", "Coastal Carolina": "#006F71", "Georgia Southern": "#00152B",
      "Georgia State": "#0039A6", "James Madison": "#450084", "Marshall": "#00B359",
      "Old Dominion": "#003057", "Arkansas State": "#CC0000", "Louisiana": "#CE181E",
      "Louisiana Tech": "#003087", "UL Monroe": "#531B2B", "South Alabama": "#00205B",
      "Southern Miss": "#000000", "Troy": "#AE1127",

      // Missouri Valley
      "Illinois State": "#CE1126", "Indiana State": "#00437A", "Murray State": "#002147",
      "North Dakota": "#008244", "UNI": "#4B116F", "South Dakota": "#AD0000",
      "South Dakota State": "#0033A0", "Southern Illinois": "#720000", "Youngstown State": "#E4002B",

      // Pioneer League
      "Butler": "#002D62", "Davidson": "#AC1A2F", "Dayton": "#E4002B", "Drake": "#003087",
      "Marist": "#C8102E", "Morehead State": "#002F6C", "Presbyterian": "#002F6C", "San Diego": "#007A33",
      "St. Thomas (MN)": "#51267B", "Stetson": "#005A36", "Valparaiso": "#613312",

      // UAC
      "Abilene Christian": "#4C2A85", "Austin Peay": "#C41230", "Central Arkansas": "#4F2683",
      "Eastern Kentucky": "#4C151B", "North Alabama": "#9E1B32", "Tarleton State": "#4F2683",
      "West Florida": "#007A87", "West Georgia": "#002F6C",

      // Ohio Valley
      "Charleston Southern": "#00205B", "Eastern Illinois": "#003594", "Gardner-Webb": "#CC0000",
      "Lindenwood": "#B5A36A", "SE Missouri State": "#CE1126", "Tennessee State": "#002147",
      "UT Martin": "#002A54", "Western Illinois": "#663399",

      // Patriot League
      "Bucknell": "#003865", "Colgate": "#822433", "Fordham": "#860038", "Georgetown": "#041E42",
      "Holy Cross": "#602D89", "Lafayette": "#9E1B32", "Lehigh": "#653815", "Richmond": "#8A1538",
      "Villanova": "#00205B", "William & Mary": "#115740",

      // MEAC
      "Delaware State": "#CC0000", "Howard": "#002147", "Morgan State": "#FF6600",
      "Norfolk State": "#007A3d", "North Carolina Central": "#841F2B", "South Carolina State": "#800000",

      // Big Sky
      "Cal Poly": "#003831", "Eastern Washington": "#A10022", "Idaho": "#B3A369", "Idaho State": "#F47920",
      "Montana": "#660000", "Montana State": "#00205B", "Northern Arizona": "#002447",
      "Northern Colorado": "#002A54", "Portland State": "#154734", "Southern Utah": "#DB0000",
      "UC Davis": "#002855", "Utah Tech": "#BA1C21", "Weber State": "#4B2682",

      // Southern
      "Chattanooga": "#003865", "East Tennessee State": "#002855", "Furman": "#4D1979", "Mercer": "#F26522",
      "Samford": "#CC0000", "Tennessee Tech": "#4B2E83", "The Citadel": "#3A75C4", "VMI": "#E4002B",
      "Western Carolina": "#51267B", "Wofford": "#B3A369",

      // Southland
      "East Texas A&M": "#002F6C", "Houston Christian": "#002F6C", "Lamar": "#D11919", "McNeese": "#004B87",
      "Nicholls": "#C41230", "Northwestern State": "#F15A22", "SE Louisiana": "#244A31",
      "Stephen F. Austin": "#330066", "UIW": "#C41230", "UT Rio Grand Valley": "#F05A28",

      // Independent & Other
      "Notre Dame": "#00843D", "Jackson State": "#002147", "Prairie View A&M": "#330066", "UConn": "#000E2F",

      "Avalanche": "#6F263D", "Blackhawks": "#CF0A2C", "Blue Jackets": "#002654", "Blues": "#002F87",
      "Bruins": "#FFB81C", "Canadiens": "#AF1E2D", "Canucks": "#00205B",
      "Capitals": "#C8102E", "Coyotes": "#8C2633", "Devils": "#CE1126", "Ducks": "#F47A38",
      "Flames": "#C8102E", "Flyers": "#F47920", "Golden Knights": "#B3995D", "Hurricanes": "#CC0000",
      "Islanders": "#00539B", "Jets": "#041E42", "Kings": "#111111", "Kraken": "#001628",
      "Lightning": "#002868", "Mammoth": "#000000", "Maple Leafs": "#00205B", "Oilers": "#041E42", "Panthers": "#C8102E",
      "Penguins": "#FCB514", "Predators": "#FFB81C", "Rangers": "#0038A8", "Red Wings": "#CE1126", "Sabres": "#003087",
      "Senators": "#C8102E", "Sharks": "#006D75", "Stars": "#006847", "Utah": "#69B3E7",
      "Wild": "#154734"

    };