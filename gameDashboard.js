document.addEventListener("DOMContentLoaded", function () {

  // ===========================================================================
  // 1. SIDEBAR TOGGLE & RESPONSIVE RESIZE HANDLING
  // ===========================================================================
  const toggleBtn = document.getElementById("toggleFilterBtn");
  const sidebar = document.getElementById("sidebarWrapper");

  if (toggleBtn && sidebar) {
    if (window.innerWidth < 1200) {
      sidebar.classList.add("collapsed");
    }

    const isInitialCollapsed = sidebar.classList.contains("collapsed");
    toggleBtn.setAttribute("title", isInitialCollapsed ? "Show Filters" : "Hide Filters");

    toggleBtn.classList.add("attention-flash");
    setTimeout(() => {
      toggleBtn.classList.remove("attention-flash");
    }, 5600);

    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");

      const isCollapsed = sidebar.classList.contains("collapsed");
      toggleBtn.setAttribute("title", isCollapsed ? "Show Filters" : "Hide Filters");

      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        const barChart = document.getElementById("barChart");
        const digitalChart = document.getElementById("digitalChart");
        if (window.Plotly) {
          if (barChart && barChart.clientHeight > 0) Plotly.Plots.resize(barChart);
          if (digitalChart && digitalChart.clientHeight > 0) Plotly.Plots.resize(digitalChart);
        }
      }, 320);
    });
  }

  // ===========================================================================
  // 2. CONSTANTS & DOM ELEMENT CACHE
  // ===========================================================================
  
  const DIGITAL_NETWORKS = [
    "ESPN+", "FloHockey", "NCHC.tv", "B1G+", "CCHA TV", "Peacock",
    "YouTube", "Midco", "USAHockeyTV.com", "[OffAir]", "TBA", "hudl", "NEC FR",
    "CACC Net", "FloSports", "Prime Video", "ACCNX", "SECN+", "America East", "FloCollege", "MEAC Net", "N/A", "MW+", "-- TBA --", "",
    "XAVIER+", "NBA LP", "MNMT", "Apple TV", "Patriot League TV", "SLN", "BlazerVision",
    "DAZN MIN", "Thunder App", "Pelicans.com", "DAZN MEM", "ClipperVision", "DAZN (YES)",
    "Bucks App", "Summit", "Suns Live"
  ];

  const DEFAULT_LEAGUES = [
    "MLB (World Series)",
    "NBA",
    "NHL",
    "NFL",
    "NCAA Football",
    "NCAA Basketball (M)",
  ];

  const SHARED_X_AXIS_VALS = [480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200, 1260, 1320, 1380, 1440, 1500, 1560, 1620];
  const SHARED_X_AXIS_TEXT = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM'
  ];

  const DOM = {
    dateFilter: document.getElementById("dateFilter"),
    leagueFilter: document.getElementById("leagueFilter"),
    rankedFilter: document.getElementById("rankedFilter"),
    timeFilter: document.getElementById("timeFilter"),
    conferenceFilter: document.getElementById("conferenceFilter"),
    searchInput: document.getElementById("searchInput")
  };

  // Persistent User Filter State & Modification Flag
  let userHasModifiedFilters = false;
  const filterState = {
    leagues: [...DEFAULT_LEAGUES],
    isLeagueAll: false,
    conferences: [],
    isConfAll: true,
    times: [],
    isTimeAll: true,
    top25Only: false
  };

  // ===========================================================================
  // 3. TIMEZONE CONVERSION UTILITY (CENTRAL TIME -> LOCAL TIME)
  // ===========================================================================

  function centralDateTimeToEpoch(dateStr, timeStr, currentYear) {
    if (!dateStr || !timeStr) return 0;
    
    let cleanStr = dateStr.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (!/\b20\d{2}\b/.test(cleanStr)) {
      cleanStr = `${cleanStr}, ${currentYear}`;
    }
    const tempDate = new Date(cleanStr);
    const month = tempDate.getMonth();
    const day = tempDate.getDate();
    const year = tempDate.getFullYear();

    const [time, ampm] = timeStr.split(' ');
    if (!time) return 0;
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const utcGuess = Date.UTC(year, month, day, h, m, 0);
    
    const options = { 
      timeZone: 'America/Chicago', 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric', 
      second: 'numeric', 
      hour12: false 
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date(utcGuess));
    const chicagoParts = {};
    parts.forEach(p => chicagoParts[p.type] = p.value);
    
    const chicagoAsUtc = Date.UTC(
      chicagoParts.year,
      chicagoParts.month - 1,
      chicagoParts.day,
      chicagoParts.hour === 24 ? 0 : chicagoParts.hour,
      chicagoParts.minute,
      chicagoParts.second
    );
    
    const offsetMs = chicagoAsUtc - utcGuess;
    return utcGuess - offsetMs;
  }

  // ===========================================================================
  // 4. DATA LOADING & INITIALIZATION
  // ===========================================================================
  
  d3.csv("currentWeek/weekFull.csv", raw => {
    const clean = {};
    Object.keys(raw).forEach(key => {
      const normalizedKey = key.replace(/^\uFEFF/, "");
      clean[normalizedKey] = raw[key];
    });
    return clean;
  }).then(rawRows => {
    const currentYear = new Date().getFullYear();

    window.gameData = rawRows.map(d => {
      const startEpoch = centralDateTimeToEpoch(d.Date, d.Start_Time, currentYear);
      const endEpoch = centralDateTimeToEpoch(d.Date, d.End_Time, currentYear);
      
      let adjustedEndEpoch = endEpoch;
      if (adjustedEndEpoch < startEpoch) {
        adjustedEndEpoch += 24 * 60 * 60 * 1000;
      }

      const localStart = new Date(startEpoch);
      const localEnd = new Date(adjustedEndEpoch);

      const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      const localDateStr = localStart.toLocaleDateString('en-US', dateOptions);

      const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      const localStartStr = localStart.toLocaleTimeString('en-US', timeOptions);
      const localEndStr = localEnd.toLocaleTimeString('en-US', timeOptions);

      return {
        ...d,
        Original_Date: d.Date,
        Original_Start_Time: d.Start_Time,
        Original_End_Time: d.End_Time,
        Date: localDateStr,
        Start_Time: localStartStr,
        End_Time: localEndStr,
        _startEpoch: startEpoch,
        _endEpoch: adjustedEndEpoch
      };
    });

    const initialDate = getFirstAvailableDate(window.gameData);
    updateDateSlicerOptions(window.gameData, initialDate);
    
    refreshAllSlicersExcept(null);
    applyFilters();

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      const barChart = document.getElementById("barChart");
      const digitalChart = document.getElementById("digitalChart");
      if (window.Plotly) {
        if (barChart && barChart.clientHeight > 0) Plotly.Plots.resize(barChart);
        if (digitalChart && digitalChart.clientHeight > 0) Plotly.Plots.resize(digitalChart);
      }
    }, 100);

    // Event Listener: Date Slicer Change
    DOM.dateFilter?.addEventListener("change", () => {
      refreshAllSlicersExcept("date");
      applyFilters();
    });

    // Event Listener: Ranked Teams Checkbox Change
    DOM.rankedFilter?.addEventListener("change", () => {
      userHasModifiedFilters = true;
      filterState.top25Only = DOM.rankedFilter.checked;
      refreshAllSlicersExcept("top25");
      applyFilters();
    });

    // Event Listener: Text Search Input Change (Supersedes everything)
    DOM.searchInput?.addEventListener("input", () => {
      userHasModifiedFilters = true;
      const searchQuery = DOM.searchInput.value.trim().toLowerCase();
      if (searchQuery) {
        const matchingGames = window.gameData.filter(d => {
          if (isGameExpiredToday(d)) return false;
          const matchup = d.Matchup?.toLowerCase() || "";
          const league = d.League?.toLowerCase() || "";
          const network = d.TV_Network?.toLowerCase() || "";
          const vConf = d.Visitor_Conference?.toLowerCase() || "";
          const hConf = d.Home_Conference?.toLowerCase() || "";
          return matchup.includes(searchQuery) ||
                 league.includes(searchQuery) ||
                 network.includes(searchQuery) ||
                 vConf.includes(searchQuery) ||
                 hConf.includes(searchQuery);
        });

        if (matchingGames.length > 0) {
          const firstDate = getFirstAvailableDate(matchingGames);
          if (firstDate) {
            updateDateSlicerOptions(window.gameData, firstDate);
            DOM.dateFilter.value = firstDate;
          }
        }
      } else {
        const initialDate = getFirstAvailableDate(window.gameData);
        updateDateSlicerOptions(window.gameData, initialDate);
      }

      refreshAllSlicersExcept(null);
      applyFilters();
    });
  });

  // ===========================================================================
  // 5. FILTERING & STATE MANAGEMENT FUNCTIONS
  // ===========================================================================

  function syncStateFromDOM() {
    filterState.date = DOM.dateFilter ? DOM.dateFilter.value : null;
    filterState.top25Only = DOM.rankedFilter ? DOM.rankedFilter.checked : false;

    const leagueAllEl = document.getElementById("league_all");
    if (leagueAllEl) {
      filterState.isLeagueAll = leagueAllEl.checked;
      filterState.leagues = filterState.isLeagueAll ? [] : Array.from(
        document.querySelectorAll("#leagueFilter .league-checkbox:checked")
      ).map(cb => cb.value);
    }

    const timeAllEl = document.getElementById("time_all");
    if (timeAllEl) {
      filterState.isTimeAll = timeAllEl.checked;
      filterState.times = filterState.isTimeAll ? [] : Array.from(
        document.querySelectorAll("#timeFilter .time-checkbox:checked")
      ).map(cb => cb.value);
    }

    const confAllEl = document.getElementById("conf_all");
    if (confAllEl) {
      filterState.isConfAll = confAllEl.checked;
      filterState.conferences = filterState.isConfAll ? [] : Array.from(
        document.querySelectorAll("#conferenceFilter .conf-checkbox:checked")
      ).map(cb => cb.value);
    }
  }

  function getActiveSelections() {
    syncStateFromDOM();
    return filterState;
  }

  function isGameExpiredToday(d) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let cleanStr = d.Date?.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (cleanStr && !/\b20\d{2}\b/.test(cleanStr)) {
      cleanStr = `${cleanStr}, ${now.getFullYear()}`;
    }
    const gameDateParsed = cleanStr ? new Date(cleanStr) : null;
    if (!gameDateParsed) return false;

    const gameNormalized = new Date(gameDateParsed.getFullYear(), gameDateParsed.getMonth(), gameDateParsed.getDate());

    if (gameNormalized.getTime() === startOfToday.getTime()) {
      const startMins = timeToMinutes(d.Start_Time);
      let endMins = timeToMinutes(d.End_Time);
      if (endMins < startMins) endMins += 1440;

      const gameEndTimestamp = startOfToday.getTime() + endMins * 60000;
      const thresholdTimestamp = gameEndTimestamp + 15 * 60000;

      if (now.getTime() >= thresholdTimestamp) {
        return true;
      }
    }
    return false;
  }

  function getFilteredDataExcept(excludedFilter = null) {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    return window.gameData.filter(d => {
      if (isGameExpiredToday(d)) return false;

      // SEARCH SUPERSEDENCE: If user has entered a search query, check it first.
      // If it matches, bypass all other UI filter restrictions completely!
      if (searchQuery) {
        const matchup = d.Matchup?.toLowerCase() || "";
        const league = d.League?.toLowerCase() || "";
        const network = d.TV_Network?.toLowerCase() || "";
        const vConf = d.Visitor_Conference?.toLowerCase() || "";
        const hConf = d.Home_Conference?.toLowerCase() || "";

        const matchesSearch = matchup.includes(searchQuery) ||
                              league.includes(searchQuery) ||
                              network.includes(searchQuery) ||
                              vConf.includes(searchQuery) ||
                              hConf.includes(searchQuery);

        if (matchesSearch) {
          // If searching, still respect date filter if selected, or return all matching games across dates
          if (excludedFilter !== "date" && state.date && d.Date !== state.date) {
            return false;
          }
          return true;
        } else {
          return false;
        }
      }

      // Standard Filtering Logic (when search query is empty)
      // 1. Date Filter
      if (excludedFilter !== "date" && state.date && d.Date !== state.date) {
        return false;
      }

      // 2. League Filter
      if (excludedFilter !== "league") {
        if (!state.isLeagueAll && state.leagues.length === 0) return false;
        if (!state.isLeagueAll) {
          const gameLeague = d.League?.trim();
          if (!state.leagues.includes(gameLeague)) return false;
        }
      }

      // 3. Ranked NCAA Teams Filter (Only applies to NCAA leagues if ranked is checked)
      if (excludedFilter !== "top25" && state.top25Only) {
        const isNcaaLeague = d.League && d.League.trim().toUpperCase().startsWith("NCAA");
        if (isNcaaLeague) {
          const isTop25 = d.Ranked ? d.Ranked.trim().toUpperCase() === "Y" : false;
          if (!isTop25) return false;
        }
      }

      // 4. Game Start Time Filter
      if (excludedFilter !== "time") {
        if (!state.isTimeAll && state.times.length === 0) return false;
        if (!state.isTimeAll && !state.times.includes(d.Start_Time)) return false;
      }

      // 5. Conference Filter (Only applies to NCAA leagues; non-NCAA leagues bypass conference filter)
      if (excludedFilter !== "conference") {
        const isNcaaLeague = d.League && d.League.trim().toUpperCase().startsWith("NCAA");
        if (isNcaaLeague && !state.isConfAll) {
          if (state.conferences.length === 0) return false;
          const vConf = d.Visitor_Conference?.trim();
          const hConf = d.Home_Conference?.trim();
          if (!state.conferences.includes(vConf) && !state.conferences.includes(hConf)) return false;
        }
      }

      return true;
    });
  }

  function getRankedScopeData() {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    return window.gameData.filter(d => {
      if (isGameExpiredToday(d)) return false;

      if (searchQuery) {
        const matchup = d.Matchup?.toLowerCase() || "";
        const league = d.League?.toLowerCase() || "";
        const network = d.TV_Network?.toLowerCase() || "";
        const vConf = d.Visitor_Conference?.toLowerCase() || "";
        const hConf = d.Home_Conference?.toLowerCase() || "";
        if (!matchup.includes(searchQuery) && !league.includes(searchQuery) && !network.includes(searchQuery) && !vConf.includes(searchQuery) && !hConf.includes(searchQuery)) {
          return false;
        }
      }

      if (state.date && d.Date !== state.date) return false;

      if (!state.isLeagueAll) {
        if (state.leagues.length === 0) return false;
        const gameLeague = d.League?.trim();
        if (!state.leagues.includes(gameLeague)) return false;
      }

      return true;
    });
  }

  function updateRankedToggleState(isInit = false) {
    if (!DOM.rankedFilter) return;

    const rankedScope = getRankedScopeData();
    const hasTop25 = rankedScope.some(d => d.Ranked && d.Ranked.trim().toUpperCase() === "Y");

    if (!hasTop25) {
      DOM.rankedFilter.checked = false;
      DOM.rankedFilter.disabled = true;
      filterState.top25Only = false;
    } else {
      DOM.rankedFilter.disabled = false;
      if (isInit) {
        DOM.rankedFilter.checked = false;
        filterState.top25Only = false;
      } else {
        DOM.rankedFilter.checked = filterState.top25Only;
      }
    }
  }

  function updateLeagueSlicer(filteredData, selectedLeagues = [], isAllChecked = false) {
    if (!DOM.leagueFilter) return;

    const uniqueLeagues = Array.from(new Set(window.gameData.map(d => d.League?.trim()))).filter(Boolean).sort();

    DOM.leagueFilter.innerHTML = "";

    if (uniqueLeagues.length === 0) {
      DOM.leagueFilter.innerHTML = `<div class="text-muted small p-1">No leagues available</div>`;
      return;
    }

    const allDiv = document.createElement("div");
    allDiv.className = "form-check border-bottom pb-1 mb-2";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="league_all" ${isAllChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="league_all">All Leagues</label>
    `;
    DOM.leagueFilter.appendChild(allDiv);

    uniqueLeagues.forEach((league, idx) => {
      const isChecked = isAllChecked || selectedLeagues.includes(league);
      const div = document.createElement("div");
      div.className = "form-check";
      div.innerHTML = `
        <input class="form-check-input league-checkbox" type="checkbox" value="${league}" id="league_${idx}" ${isChecked ? 'checked' : ''}>
        <label class="form-check-label" for="league_${idx}">${league}</label>
      `;
      DOM.leagueFilter.appendChild(div);
    });

    const allCheckbox = document.getElementById("league_all");
    const itemCheckboxes = DOM.leagueFilter.querySelectorAll(".league-checkbox");

    allCheckbox?.addEventListener("change", (e) => {
      userHasModifiedFilters = true;
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      syncStateFromDOM();
      refreshAllSlicersExcept("league");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        userHasModifiedFilters = true;
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                            Array.from(itemCheckboxes).every(item => item.checked);
        syncStateFromDOM();
        refreshAllSlicersExcept("league");
        applyFilters();
      });
    });
  }

  function updateTimeSlicer(filteredData, selectedTimes = [], isAllChecked = true) {
    if (!DOM.timeFilter) return;

    const uniqueTimes = Array.from(new Set(filteredData.map(d => d.Start_Time)))
      .filter(Boolean)
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

    DOM.timeFilter.innerHTML = "";

    if (uniqueTimes.length === 0) {
      DOM.timeFilter.innerHTML = `<div class="text-muted small p-1">No times available</div>`;
      return;
    }

    const allDiv = document.createElement("div");
    allDiv.className = "form-check border-bottom pb-1 mb-2";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="time_all" ${isAllChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="time_all">All Times</label>
    `;
    DOM.timeFilter.appendChild(allDiv);

    uniqueTimes.forEach((time, idx) => {
      const isChecked = isAllChecked || selectedTimes.includes(time);
      const div = document.createElement("div");
      div.className = "form-check";
      div.innerHTML = `
        <input class="form-check-input time-checkbox" type="checkbox" value="${time}" id="time_${idx}" ${isChecked ? 'checked' : ''}>
        <label class="form-check-label" for="time_${idx}">${time}</label>
      `;
      DOM.timeFilter.appendChild(div);
    });

    const allCheckbox = document.getElementById("time_all");
    const itemCheckboxes = DOM.timeFilter.querySelectorAll(".time-checkbox");

    allCheckbox?.addEventListener("change", (e) => {
      userHasModifiedFilters = true;
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      syncStateFromDOM();
      refreshAllSlicersExcept("time");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        userHasModifiedFilters = true;
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                            Array.from(itemCheckboxes).every(item => item.checked);
        syncStateFromDOM();
        refreshAllSlicersExcept("time");
        applyFilters();
      });
    });
  }

  function updateConferenceSlicer(filteredData, selectedConferences = [], isAllChecked = true) {
    if (!DOM.conferenceFilter) return;

    const extractedConfs = new Set();
    filteredData.forEach(d => {
      if (d.Visitor_Conference) extractedConfs.add(d.Visitor_Conference.trim());
      if (d.Home_Conference) extractedConfs.add(d.Home_Conference.trim());
    });

    const orderedConfs = Array.from(extractedConfs).filter(Boolean).sort((a, b) => a.localeCompare(b));

    DOM.conferenceFilter.innerHTML = "";

    if (orderedConfs.length === 0) {
      DOM.conferenceFilter.innerHTML = `<div class="text-muted small p-1">No conferences available</div>`;
      return;
    }

    const allDiv = document.createElement("div");
    allDiv.className = "form-check border-bottom pb-1 mb-2";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="conf_all" ${isAllChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="conf_all">All Conferences</label>
    `;
    DOM.conferenceFilter.appendChild(allDiv);

    orderedConfs.forEach((conf, idx) => {
      const isChecked = isAllChecked || selectedConferences.includes(conf);
      const div = document.createElement("div");
      div.className = "form-check";
      div.innerHTML = `
        <input class="form-check-input conf-checkbox" type="checkbox" value="${conf}" id="conf_${idx}" ${isChecked ? 'checked' : ''}>
        <label class="form-check-label" for="conf_${idx}">${conf}</label>
      `;
      DOM.conferenceFilter.appendChild(div);
    });

    const allCheckbox = document.getElementById("conf_all");
    const itemCheckboxes = DOM.conferenceFilter.querySelectorAll(".conf-checkbox");

    allCheckbox?.addEventListener("change", (e) => {
      userHasModifiedFilters = true;
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      syncStateFromDOM();
      refreshAllSlicersExcept("conference");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        userHasModifiedFilters = true;
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                            Array.from(itemCheckboxes).every(item => item.checked);
        syncStateFromDOM();
        refreshAllSlicersExcept("conference");
        applyFilters();
      });
    });
  }

  function refreshAllSlicersExcept(targetSource = null) {
    const isInit = (targetSource === null);
    const isDateChange = (targetSource === "date");
    const currentSelectedDate = DOM.dateFilter ? DOM.dateFilter.value : null;

    if (isInit) {
      userHasModifiedFilters = false;
      filterState.leagues = [...DEFAULT_LEAGUES];
      filterState.isLeagueAll = false;
      filterState.conferences = [];
      filterState.isConfAll = true;
      filterState.times = [];
      filterState.isTimeAll = true;
      filterState.top25Only = false;
    } else if (isDateChange && !userHasModifiedFilters) {
      filterState.leagues = [...DEFAULT_LEAGUES];
      filterState.isLeagueAll = false;
      filterState.conferences = [];
      filterState.isConfAll = true;
      filterState.times = [];
      filterState.isTimeAll = true;
      filterState.top25Only = false;
    } else {
      syncStateFromDOM();
    }

    updateRankedToggleState(isInit || (isDateChange && !userHasModifiedFilters));

    if (isInit || targetSource !== "date") {
      const subsetWithoutDate = getFilteredDataExcept("date");
      const dateSourceData = (subsetWithoutDate.length > 0) ? subsetWithoutDate : window.gameData;
      const firstMatchDate = getFirstAvailableDate(dateSourceData);
      
      const targetDate = (currentSelectedDate && dateSourceData.some(d => d.Date === currentSelectedDate))
        ? currentSelectedDate
        : firstMatchDate;

      updateDateSlicerOptions(dateSourceData, targetDate);
    } else {
      const dateSourceData = getFilteredDataExcept("date");
      updateDateSlicerOptions(dateSourceData, filterState.date);
    }

    if (targetSource !== "league") {
      const leagueSubset = getFilteredDataExcept("league");
      updateLeagueSlicer(leagueSubset, filterState.leagues, filterState.isLeagueAll);
    }

    if (targetSource !== "time") {
      const timeSubset = getFilteredDataExcept("time");
      updateTimeSlicer(timeSubset, filterState.times, filterState.isTimeAll);
    }

    if (targetSource !== "conference") {
      const confSubset = getFilteredDataExcept("conference");
      updateConferenceSlicer(confSubset, filterState.conferences, filterState.isConfAll);
    }
  }

  function getFirstAvailableDate(allData) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const uniqueDates = Array.from(new Set(allData.map(d => d.Date))).filter(Boolean);

    if (uniqueDates.length === 0) return null;

    const parsedDates = uniqueDates.map(dateStr => {
      let cleanStr = dateStr.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');

      if (!/\b20\d{2}\b/.test(cleanStr)) {
        cleanStr = `${cleanStr}, ${currentYear}`;
      }

      const parsed = new Date(cleanStr);
      const normalized = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

      return { originalStr: dateStr, parsedDate: normalized };
    });

    parsedDates.sort((a, b) => a.parsedDate - b.parsedDate);

    const todayItem = parsedDates.find(item => item.parsedDate.getTime() === startOfToday.getTime());

    if (todayItem) {
      const todaysGames = allData.filter(d => d.Date === todayItem.originalStr);
      if (todaysGames.length > 0) {
        let maxEndMinutes = -1;
        todaysGames.forEach(g => {
          const startMins = timeToMinutes(g.Start_Time);
          let endMins = timeToMinutes(g.End_Time);
          if (endMins < startMins) endMins += 1440;
          if (endMins > maxEndMinutes) {
            maxEndMinutes = endMins;
          }
        });

        if (maxEndMinutes !== -1) {
          const latestEndDateTime = new Date(startOfToday.getTime() + maxEndMinutes * 60000);
          const thresholdTime = new Date(latestEndDateTime.getTime() + 15 * 60000);

          if (now.getTime() < thresholdTime.getTime()) {
            return todayItem.originalStr;
          }
        }
      }
    }

    const upcoming = parsedDates.find(item => item.parsedDate.getTime() > startOfToday.getTime()) ||
                     parsedDates.find(item => item.parsedDate.getTime() >= startOfToday.getTime());

    return upcoming ? upcoming.originalStr : parsedDates[parsedDates.length - 1].originalStr;
  }

  function updateDateSlicerOptions(filteredData, selectedDate) {
    const uniqueDates = Array.from(new Set(filteredData.map(d => d.Date))).filter(Boolean);

    const currentYear = new Date().getFullYear();
    uniqueDates.sort((a, b) => {
      let cleanA = a.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
      let cleanB = b.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
      if (!/\b20\d{2}\b/.test(cleanA)) cleanA = `${cleanA}, ${currentYear}`;
      if (!/\b20\d{2}\b/.test(cleanB)) cleanB = `${cleanB}, ${currentYear}`;
      return new Date(cleanA) - new Date(cleanB);
    });

    const previousSelection = DOM.dateFilter.value;
    DOM.dateFilter.innerHTML = "";

    if (uniqueDates.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No dates matching selections.";
      DOM.dateFilter.appendChild(opt);
      return;
    }

    uniqueDates.forEach(date => {
      const opt = document.createElement("option");
      opt.value = date;
      opt.textContent = date;
      DOM.dateFilter.appendChild(opt);
    });

    if (selectedDate && uniqueDates.includes(selectedDate)) {
      DOM.dateFilter.value = selectedDate;
    } else if (previousSelection && uniqueDates.includes(previousSelection)) {
      DOM.dateFilter.value = previousSelection;
    } else {
      DOM.dateFilter.value = uniqueDates[0];
    }
    filterState.date = DOM.dateFilter.value;
  }

  function applyFilters() {
    syncStateFromDOM();
    const filtered = getFilteredDataExcept(null);
    const selectedDateText = DOM.dateFilter ? DOM.dateFilter.value : "";

    document.querySelectorAll('.chart-date-label').forEach(el => {
      el.textContent = selectedDateText ? `\u00A0\u00A0${selectedDateText}` : "";
    });

    let earliestStart = 1440;
    let latestEnd = 0;

    if (filtered && filtered.length > 0) {
      filtered.forEach(game => {
        const start = timeToMinutes(game.Start_Time);
        let end = timeToMinutes(game.End_Time);
        if (end < start) end += 1440;

        if (!isNaN(start) && start < earliestStart) earliestStart = start;
        if (!isNaN(end) && end > latestEnd) latestEnd = end;
      });
    }

    if (earliestStart === 1440 || isNaN(earliestStart)) earliestStart = 600;
    if (latestEnd === 0 || isNaN(latestEnd)) latestEnd = 1440;

    const paddedStart = Math.max(0, earliestStart - 10);
    const paddedEnd = Math.max(paddedStart + 60, latestEnd + 15);
    const syncedXRange = [paddedStart, paddedEnd];

    const primaryData = filtered.filter(d => !DIGITAL_NETWORKS.includes(d.TV_Network));
    const digitalData = filtered.filter(d => DIGITAL_NETWORKS.includes(d.TV_Network));

    renderChart('barChart', primaryData, false, syncedXRange);
    renderChart('digitalChart', digitalData, true, syncedXRange);
  }

  function getHomeTeamColor(matchup) {
    if (!matchup) return '#D3D3D3';

    const parts = matchup.split(/\s+(?:at|vs\.?)\s+/i);
    if (parts.length < 2) return '#D3D3D3';

    const homeTeamRaw = parts[parts.length - 1].trim();

    if (typeof TEAM_COLORS !== 'undefined' && Object.prototype.hasOwnProperty.call(TEAM_COLORS, homeTeamRaw)) {
      return TEAM_COLORS[homeTeamRaw];
    }

    let homeTeamClean = homeTeamRaw
      .replace(/^(?:No\.\s*\d+|#\d+)\s+/i, '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim();

    if (typeof TEAM_COLORS !== 'undefined' && Object.prototype.hasOwnProperty.call(TEAM_COLORS, homeTeamClean)) {
      return TEAM_COLORS[homeTeamClean];
    }

    return '#D3D3D3';
  }

  function timeToMinutes(t) {
    if (!t) return 0;
    const [time, ampm] = t.split(' ');
    if (!time) return 0;
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  function resolveOverlapSubRows(games) {
    games.sort((a, b) => timeToMinutes(a.Start_Time) - timeToMinutes(b.Start_Time));

    const subRowEndTimes = [];
    const assignedGames = [];

    games.forEach(game => {
      const start = timeToMinutes(game.Start_Time);
      const end = timeToMinutes(game.End_Time);
      const effectiveEnd = end >= start ? end : end + 1440;

      let rowIndex = -1;
      for (let i = 0; i < subRowEndTimes.length; i++) {
        if (subRowEndTimes[i] <= start) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        subRowEndTimes.push(effectiveEnd);
        rowIndex = subRowEndTimes.length - 1;
      } else {
        subRowEndTimes[rowIndex] = effectiveEnd;
      }

      assignedGames.push({
        ...game,
        subRowIndex: rowIndex
      });
    });

    return { assignedGames, totalSubRows: subRowEndTimes.length };
  }

  // ===========================================================================
  // 6. CHART RENDERING & VISUALIZATION (PLOTLY)
  // ===========================================================================

  function renderChart(targetId, data, isDigital = false, xAxisRange = [480, 1500]) {
    const container = document.getElementById(targetId);

    if (!data || data.length === 0) {
      container.style.height = '120px';
      Plotly.newPlot(targetId, [], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: {
          text: isDigital ? 'No streaming events matching selections.' : 'No network events matching selections.',
          font: { size: 16, color: '#f3e5ab', family: 'Segoe UI, Arial, sans-serif' }
        },
        xaxis: { visible: false },
        yaxis: { visible: false },
        showlegend: false
      }, { responsive: true, displayModeBar: false });
      return;
    }

    const grouped = d3.group(data, d => d.TV_Network);
    const traces = [];
    const yTicks = [];
    const yTickLabels = [];

    grouped.forEach((games, network) => {
      const { assignedGames, totalSubRows } = resolveOverlapSubRows(games);

      for (let i = 0; i < totalSubRows; i++) {
        const rowKey = `${network}_row_${i}`;
        yTicks.push(rowKey);
        yTickLabels.push(network);
      }

      assignedGames.forEach(game => {
        const start = timeToMinutes(game.Start_Time);
        const end = timeToMinutes(game.End_Time);
        const duration = end >= start ? (end - start) : (end + 1440 - start);
        const teamHexColor = getHomeTeamColor(game.Matchup);
        const internalRowKey = `${network}_row_${game.subRowIndex}`;
        const isRanked = game.Matchup.includes('#');
        const matchupText = isRanked ? `<b>${game.Matchup}</b>` : game.Matchup;
        const formattedLabel = `<span style="font-size: 22px;">${matchupText}</span><br><span style="font-size: 16px; opacity: 0.85;">${game.League}</span>`;

        traces.push({
          type: 'bar',
          orientation: 'h',
          y: [internalRowKey],
          x: [duration],
          base: [start],
          name: game.Matchup,
          textfont: {
            size: 16,
          },
          marker: { 
            color: teamHexColor,
            line: { color: '#eab308', width: 1.25 },
            cornerradius: "45%"
          },
          text: [formattedLabel],
          textposition: 'inside',
          insidetextanchor: 'middle',
          insidetextfont: { 
            family: 'Segoe UI, Arial, sans-serif',
            color: '#ffffff'
          },
          hoverlabel: {
            font: {
              family: 'Segoe UI, Arial, sans-serif',
              size: 20,
            },
            bgcolor: teamHexColor
          },
          hovertemplate:
            '<b>' + game.Matchup + '</b><br>' +
            'League: ' + game.League + '<br>' +
            'Live Broadcast: ' + network + '<br>' +
            'Start Time: %{customdata[0]}<extra></extra>',
          customdata: [[
            game.Start_Time
          ]]
        });
      });
    });

    const ROW_HEIGHT = 37;
    const TOP_MARGIN = 45;
    const BOTTOM_MARGIN = 29;
    
    const totalRows = yTicks.length;
    const calculatedPlotHeight = (totalRows * ROW_HEIGHT) + TOP_MARGIN + BOTTOM_MARGIN;

    container.style.height = `${calculatedPlotHeight}px`;

    const [rangeStart, rangeEnd] = xAxisRange;
    const tickIndices = [];
    SHARED_X_AXIS_VALS.forEach((val, idx) => {
      if (val >= rangeStart - 60 && val <= rangeEnd + 60) {
        tickIndices.push(idx);
      }
    });
    const tickvals = tickIndices.map(i => SHARED_X_AXIS_VALS[i]);
    const ticktext = tickIndices.map(i => SHARED_X_AXIS_TEXT[i]);

    const layout = {
      height: calculatedPlotHeight,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      barmode: 'stack',
      bargap: 0.15,               
      autosize: true,
      margin: {
        // l: 67,
        r: 0,
        t: TOP_MARGIN,
        b: BOTTOM_MARGIN
      },
      automargin: true,
      dragmode: false,
      xaxis: {
        fixedrange: true,
        side: 'top',
        type: 'linear',
        range: [rangeStart, rangeEnd],
        tickmode: 'array',
        tickvals: tickvals,
        ticktext: ticktext,
        tickangle: -30,
        tickfont: { family: 'Segoe UI, Arial, sans-serif', size: 10, color: '#f3e5ab' },
        ticks: 'outside',
        ticklen: 10,
        tickcolor: 'rgba(0,0,0,0)',
        showgrid: true,
        gridcolor: 'rgba(212, 175, 55, 0.15)',
        autorange: false,
        automargin: false
      },
      yaxis: {
        fixedrange: true,
        ticksuffix: '',
        autorange: 'reversed',
        ticks: 'outside',
        ticklen: 8,
        tickcolor: 'rgba(0,0,0,0)',
        tickmode: 'array',
        tickvals: yTicks,
        ticktext: yTickLabels,
        tickfont: { family: 'Segoe UI, Arial, sans-serif', color: '#f3e5ab' }
      },
      showlegend: false
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot(targetId, traces, layout, config);
  }

  // ===========================================================================
  // 7. GLOBAL TIMERS & EVENT LISTENERS
  // ===========================================================================

  setInterval(() => {
    if (typeof refreshActiveCharts === 'function') {
      refreshActiveCharts();
    }
  }, 60000);

  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const plotlyContainers = document.querySelectorAll('.plotly-chart');
      plotlyContainers.forEach(container => {
        if (window.Plotly && container.clientHeight > 0) {
          Plotly.Plots.resize(container);
        }
      });
    }, 100);
  });

});
