// Lookup Table mapping team colors
const TEAM_COLORS = {

  // 0-9
  "49ers": "#AA0000", "76ers": "#006BB6",

  // A
  "Abilene Christian": "#4C2A85", "Aces": "#000000", "Air Force": "#003087", "Akron": "#041E42", "Alabama": "#9E1B32", "Alabama A&M": "#61162D", "Alaska": "#00205B", "Alaska Anchorage": "#005A36", 
  "Angels": "#BA0021", "App State": "#000000", "Arizona": "#CC0003", "Arizona State": "#8C1D40", "Arkansas": "#9D2235", "Arkansas State": "#CC0000", "Arkansas-Pine Bluff": "#FDB913", 
  "Army": "#D4BF91", "Assumption": "#004B87", "Astros": "#002D62", "Athletics": "#003831", "Auburn": "#0C2340", "Augustana": "#002D62", "Austin Peay": "#C41230", "Avalanche": "#6F263D", 
  
  // B
  "Ball State": "#BA0C2F", "Baylor": "#154734", "Bears": "#0B162A", "Bemidji State": "#004B49", "Bengals": "#FB4F14", "Bentley": "#00205B", "Bills": "#00338D", "Blackhawks": "#CF0A2C",
  "Blue Jackets": "#002654", "Blue Jays": "#134A8E", "Blues": "#002F87", "Boise State": "#0033A0", "Boston College": "#98002E", "Boston University": "#CC0000", "Bowling Green": "#4F2C1D", 
  "Braves": "#13274F", "Brewers": "#0A2351", "Broncos": "#FB4F14", "Brown": "#4E3629", "Browns": "#311D00", "Bruins": "#FFB81C", "Buccaneers": "#D50A0A", "Bucknell": "#003865",
  "Bucks": "#00471B", "Buffalo": "#005BBB", "Bulls": "#CE1141", "Butler": "#002D62", "BYU": "#0062B8", 
  
  // C
  "Cal": "#002676", "Cal Poly": "#003831", "Canadiens": "#AF1E2D", "Canisius": "#002D62", "Canucks": "#00205B", "Capitals": "#C8102E", "Cardinals": "#C41E3A", "AZ Cardinals": "#97233F", 
  "Cavaliers": "#860038", "Celtics": "#007A33", "Central Arkansas": "#4F2683", "Central Michigan": "#6A0032", "Chargers": "#0080C6", "Charleston": "#660000", "Charleston Southern": "#00205B",
  "Charlotte": "#00502F", "Chattanooga": "#003865", "Chiefs": "#E31837", "Cincinnati": "#000000", "Clarkson": "#004B49", "Clemson": "#F56600", "Clippers": "#C8102E", "Coastal Carolina": "#006F71", 
  "Colgate": "#821019", "Colts": "#002C5F", "Colorado": "#CFB87C", "Colorado College": "#000000", "Colorado State": "#1E4D2B", "Commanders": "#5A1414", "Coppin State": "#003056",
  "Cornell": "#B31B1B", "Cowboys": "#003594", "Coyotes": "#8C2633", "Creighton": "#005CA9", "Cubs": "#0E3386",

  // D
  "Dartmouth": "#00693E", "Davidson": "#AC1A2F", "Dayton": "#E4002B", "Delaware": "#00539F", "Delaware State": "#CC0000", "Denver": "#8B2332", "DePaul": "#003DA5", "Devils": "#CE1126", 
  "Diamondbacks": "#A71930", "Dodgers": "#005A9C", "Dolphins": "#008E97", "Drake": "#003087", "Dream": "#C8102E", "Ducks": "#F47A38", "Duke": "#003087", 
  
  // E
  "Eagles": "#004C54", "East Carolina": "#582C83", "East Tennessee State": "#002855", "East Texas A&M": "#002F6C", "Eastern Illinois": "#003594", "Eastern Kentucky": "#4C151B", 
  "Eastern Michigan": "#006633", "Eastern Washington": "#A10022",
  
  // F
  "Fairleigh Dickinson": "#72293C", "Falcons": "#A71930", "Ferris State": "#BA0C2F", "Fever": "#041E42", "Flames": "#C8102E", "Florida": "#0021A5", "Florida Atlantic": "#003366", 
  "Florida International": "#081E3F", "Florida State": "#782F40", "Flyers": "#F47920", "Fordham": "#860038", "Franklin Pierce": "#A91938", "Fresno State": "#C41230", "Furman": "#4D1979",
  
  // G
  "Gardner-Webb": "#CC0000", "Georgetown": "#041E42", "Georgia": "#BA0C2F", "Georgia Southern": "#00152B", "Georgia State": "#0039A6", "Georgia Tech": "#B3A369", "Giants": "#FD5A1E", 
  "NY Giants": "#0B2265", "Golden Knights": "#B3995D", "Gonzaga": "#041E42", "Green Bay": "#006747", "Grizzlies": "#5D76A9", "Guardians": "#0C2340",

  // H
  "Harvard": "#A51C30", "Hawai'i": "#024731", "Hawks": "#C8102E", "Heat": "#98002E", "Holy Cross": "#60269E", "Hornets": "#1D1160", "Houston": "#C8102E", "Houston Christian": "#002F6C", 
  "Howard": "#002147", "Hurricanes": "#CC0000",
  
  // I
  "Idaho": "#B3A369", "Idaho State": "#F47920", "Illinois": "#E84A27", "Illinois State": "#CE1126", "Incarnate Word": "#CB333B", "Indiana": "#990000", "Indiana State": "#00437A", 
  "Iowa": "#000000", "Iowa State": "#C8102E", "Islanders": "#00539B", 
  
  // J
  "Jackson State": "#002147", "Jacksonville State": "#CC0000", "Jaguars": "#006778", "James Madison": "#450084", "Jazz": "#002B5C", "Jets": "#041E42", "NY Jets": "#125740",
  
  // K
  "Kansas": "#0051BA", "Kansas City": "#FFD52F", "Kansas State": "#512888", "Kennesaw State": "#000000", "Kent State": "#002664", "Kentucky": "#0033A0", "Kings": "#5A2D81", 
  "LA Kings": "#000000", "Knicks": "#006BB6", "Kraken": "#001628",
  
  // L
  "Lafayette": "#9E1B32", "Lake Superior State": "#005A36", "Lamar": "#D11919", "Lakers": "#552583", "Lehigh": "#653815", "Liberty": "#6ECEB2", "Liberty University": "#B72025",
  "Lightning": "#002868", "Lindenwood": "#B3A369", "LionsUsual": "#0076B6", "Lions": "#111111", "LIU": "#69B3E7", "Louisiana": "#CE181E", "Louisiana Tech": "#003087", "Louisville": "#AD0000", 
  "LSU": "#461D7C", "Lynx": "#0C2340",
  
  // M
  "Magic": "#0077C0", "Maine": "#003263", "Mammoth": "#000000", "Maple Leafs": "#00205B", "Marist": "#C8102E", "Mariners": "#0C2C56", "Marlins": "#00A3E0", "Marquette": "#003366",
  "Marshall": "#00B359", "Maryland": "#E21A23", "Maryville": "#C8102E", "Mavericks": "#00538C", "McNeese": "#004B87", "Memphis": "#003087", "Mercer": "#F26522", "Mercyhurst": "#00594E", 
  "Mercury": "#211747", "Merrimack": "#00205B", "Mets": "#002D72", "Miami": "#F47321", "Miami (OH)": "#C41230", "Michigan": "#00274C", "Michigan State": "#18453B", "Michigan Tech": "#FFCD00",
  "Middle Tennessee": "#0066CC", "Minnesota": "#7A003C", "Minnesota Duluth": "#4A121A", "Minnesota State": "#4B2E83", "Mississippi State": "#660000", "Missouri": "#000000", 
  "Missouri State": "#5E0009", "Montana": "#660000", "Montana State": "#00205B", "Morehead State": "#002F6C", "Morgan State": "#FF6600", "Murray State": "#002147", "Mystics": "#C8102E",
  
  // N
  "Nationals": "#AB0003", "Navy": "#0C2340", "NC State": "#CC0000", "Nebraska": "#E31837", "Nets": "#000000", "Nevada": "#003366", "New Hampshire": "#00205B", "New Mexico": "#BA0C2F", 
  "New Mexico State": "#891216", "Niagara": "#002D62", "Nicholls": "#C41230", "Norfolk State": "#007A3D", "North Alabama": "#9E1B32", "North Carolina": "#7BAFD4", 
  "North Carolina Central": "#841F2B", "North Dakota": "#006A4E", "North Dakota State": "#00583D", "North Texas": "#00853E", "Northeastern": "#CC0000", "Northern Arizona": "#002447",
  "Northern Colorado": "#002A54", "Northern Illinois": "#C8102E", "Northern Michigan": "#006633", "Northwestern": "#4E2A84", "Northwestern State": "#F15A22", "Notre Dame": "#0C2340", 
  "Nuggets": "#0E2240",
  
  // O
  "Ohio": "#00694E", "Ohio State": "#BB0000", "Oilers": "#041E42", "Oklahoma": "#841617", "Oklahoma State": "#FE5C00", "Old Dominion": "#003057", "Ole Miss": "#006BA6", "Omaha": "#000000", 
  "Oregon": "#007030", "Oregon State": "#D73F09", "Orioles": "#DF4601", "Oral Roberts": "#002F60",
  
  // P
  "Pacers": "#002D62", "Packers": "#203731", "Padres": "#2F241D", "Panthers": "#C8102E", "FL Panthers": "#C8102E", "Patriots": "#002244", "Pelicans": "#002B5C", "Penguins": "#FCB514", "Penn State": "#001E44",
  "Phillies": "#E81828", "Pirates": "#27251F", "Pistons": "#1D428A", "Pitt": "#003594", "Portland State": "#154734", "Post": "#F68B1F", "Prairie View A&M": "#330066", "Predators": "#FFB81C", 
  "Presbyterian": "#002F6C", "Princeton": "#FF8F00", "Providence": "#000000", "Purdue": "#000000",
  
  // Q
  "Quinnipiac": "#0A2240",
  
  // R
  "Raiders": "#000000", "Rams": "#003594", "NY Rangers": "#0038A8", "Raptors": "#CE1141", "Ravens": "#241773", "Rays": "#092C5C", "Red Sox": "#BD3039", "Red Wings": "#CE1126", 
  "Reds": "#C6011F", "Rice": "#00205B", "Richmond": "#8A1538", "RIT": "#F36E21", "Robert Morris": "#00205B", "Rockies": "#33006F", "Rockets": "#CE1141", "Royals": "#004687",
  "RPI": "#D6001C", "Rutgers": "#CC0033",
  
  // S
  "Sabres": "#003087", "Sacred Heart": "#C8102E", "Sacramento State": "#043927", "St. Anselm": "#002B5C", "Saint Michael's": "#55318C", "Saints": "#D3BC8D", "Sam Houston": "#F47920", 
  "Samford": "#CC0000", "San Diego": "#007A33", "San Diego State": "#000000", "San José State": "#0055A2", "SE Louisiana": "#244A31", "SE Missouri State": "#CE1126", "Seahawks": "#002244", 
  "Senators": "#C8102E", "Seton Hall": "#004488", "Sharks": "#006D75", "Sky": "#418FDE", "SMU": "#0033A0", "South Alabama": "#00205B", "South Carolina": "#73000A", "South Carolina State": "#800000", "South Dakota": "#AD0000", "South Dakota State": "#0033A0",
  "South Florida": "#006747", "Southern Illinois": "#720000", "Southern Miss": "#000000", "Southern Utah": "#DB0000", "Sparks": "#702F8A", "Spurs": "#000000", "St. Cloud State": "#CC0000", 
  "St. John's": "#BA0C2F", "St. Lawrence": "#AF1E2D", "St. Thomas-Minnesota": "#512888", "Stanford": "#8C1515", "Stars": "#006847", "Steelers": "#101820", "Stetson": "#005A36",
  "Stonehill": "#00205B", "Storm": "#2C5234", "Stephen F. Austin": "#330066", "Sun": "#FC4C02", "Suns": "#1D1160", "Syracuse": "#F76900",
  
  // T
  "Tarleton State": "#4F2683", "TBD": "#000000", "TCU": "#4D1979", "Temple": "#9D2235", "Tennessee": "#FF8200", "Tennessee State": "#002147", "Tennessee Tech": "#4B2E83", "Texans": "#03202F",
  "Texas": "#BF5700", "Texas A&M": "#500000", "Texas State": "#501214", "Texas Tech": "#C30020", "The Citadel": "#3A75C4", "Thunder": "#007AC1", "Tigers": "#0C2340", "Timberwolves": "#0C2340",
  "Titans": "#0C2340", "Toledo": "#15397F", "Trail Blazers": "#E03A3E", "Troy": "#AE1127", "Tulane": "#006747", "Tulsa": "#002D62", "Twins": "#002B5C",

  // U
  "UAB": "#215732", "UC Davis": "#002855", "UCF": "#BA9B37", "UCLA": "#2D68C4", "UConn": "#000E2E", "UIW": "#C41230", "UL Monroe": "#531B2B", "UMass": "#881C1C", "UMass Lowell": "#0067C5", 
  "UMBC": "#000000", "UNI": "#4B116F", "Union": "#821019", "UNLV": "#E31837", "US NTDP": "#98002E", "USC": "#990000", "UT Martin": "#002A54", "UT Rio Grand Valley": "#F05A28", "UTEP": "#FF8200", 
  "Utah": "#BE0000", "Utah State": "#00263A", "Utah Tech": "#BA1C21", "UTSA": "#0C2340",
  
  // V
  "Valkyries": "#B896D4", "Valparaiso": "#613312", "Vanderbilt": "#866D4B", "Vermont": "#005A36", "Vikings": "#4F2683", "Villanova": "#00205B", "Virginia": "#232D4B", "Virginia Tech": "#630031", 
  "VMI": "#E4002B",
  
  // W
  "Wake Forest": "#9E7E38", "Warriors": "#1D428A", "Washington": "#4B2E83", "Washington State": "#981E32", "Weber State": "#4B2682", "West Florida": "#007A87", "West Georgia": "#002F6C", 
  "West Virginia": "#002855", "Western Carolina": "#51267B", "Western Illinois": "#663399", "Western Kentucky": "#BD0F26", "Western Michigan": "#5C1322", "White Sox": "#000000", "Wild": "#154734", 
  "William & Mary": "#115740", "Windsor": "#005A36", "Wings": "#0C2340", "Wisconsin": "#C5050C", "Wizards": "#002B5C", "Wofford": "#B3A369", "Wyoming": "#492F24",
  
  // X
  "Xavier": "#0C2340",
  
  // Y
  "Yale": "#00356B", "Yankees": "#0C2340", "Youngstown State": "#E4002B",

  // Host LPGA Tour
  "Sheshan GC": "#F75D5D", "Pine Beach Golf Links": "#F75D5D", "Kuala Lumpur": "#F75D5D",

  // Host PGA Tour
  "Port Royal GC": "#003C80",  "Vidanta Vallarta": "#003C80", "Diamante El Cardonal": "#003C80",
  
  // Host Tennis
  "Melbourne Park": "#1E8FD5", "Roland Garros": "#BB5522", "Wimbledon": "#046A38", "BJK National Tennis Center": "#FFD400",

  // Host Auto Racing
  "Daytona International Speedway": "#E4002B", "Talladega Superspeedway": "#E4002B", "Charlotte Motor Speedway": "#E4002B", "Indianapolis Motor Speedway": "#0072B4",
  "Atlanta Motor Speedway": "#E4002B", "Pocono Raceway": "#E4002B", "Michigan International Speedway": "#E4002B", "Homestead-Miami Speedway": "#E4002B",
  "Circuit of the Americas": "#969897",
  
  // Host Horse Racing
  "Churchill Downs": "#D6964A", "Pimlico Race Course": "#F5D033", "Belmont Park": "#04663D", "Keeneland": "#197D5C"

};
