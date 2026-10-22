document.addEventListener("DOMContentLoaded", function () {

  // ===========================================================================
  // 1. SIDEBAR TOGGLE & RESPONSIVE RESIZE HANDLING
  // ===========================================================================
  const toggleBtn = document.getElementById("toggleFilterBtn");
  const sidebar = document.getElementById("sidebarWrapper");

  if (toggleBtn && sidebar) {
    // Automatically collapse the filter sidebar on smaller viewports (< 1200px)
    if (window.innerWidth < 1200) {
      sidebar.classList.add("collapsed");
      toggleBtn.setAttribute("title", "Show Filters");
    }

    // Trigger an attention-flashing visual cue if the sidebar loads collapsed
    if (sidebar.classList.contains("collapsed")) {
      toggleBtn.classList.add("attention-flash");
      setTimeout(() => {
        toggleBtn.classList.remove("attention-flash");
      }, 3500);
    }

    // Handle click events to toggle sidebar expansion and trigger Plotly re-renders
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");

      const isCollapsed = sidebar.classList.contains("collapsed");
      toggleBtn.setAttribute("title", isCollapsed ? "Show Filters" : "Hide Filters");

      // Give CSS transitions time to finish before resizing Plotly charts to fit new width
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
  
  // List of television networks classified as streaming/digital rather than linear broadcast
  const DIGITAL_NETWORKS = [
    "ESPN+", "FloHockey", "NCHC.tv", "B1G+", "CCHA TV", "Peacock",
    "YouTube", "Midco", "USAHockeyTV.com", "[OffAir]", "TBA", "hudl", "NEC FR",
    "CACC Net", "FloSports", "Prime Video", "ACCNX", "SECN+", "America East", "FloCollege", "MEAC Net", "N/A", "MW+", "-- TBA --", "",
    "XAVIER+", "NBA LP", "MNMT"
  ];

  // Default Sports Leagues to display on initial load or date change
  const DEFAULT_LEAGUES = [
    "MLB (World Series)",
    "NBA",
    "NHL",
    "NFL",
    "NCAA Football",
    "NCAA Basketball (M)",
    "NCAA Basketball (W)",
    "WNBA (Finals)",
    "LPGA Tour",
    "PGA Tour"
  ];

  // Shared X-Axis time intervals (expressed in minutes from midnight) for vertical grid alignment
  const SHARED_X_AXIS_VALS = [480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200, 1260, 1320, 1380, 1440, 1500];
  const SHARED_X_AXIS_TEXT = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM'
  ];

  // Cached DOM references for filter container elements
  const DOM = {
    dateFilter: document.getElementById("dateFilter"),
    leagueFilter: document.getElementById("leagueFilter"),
    rankedFilter: document.getElementById("rankedFilter"),
    timeFilter: document.getElementById("timeFilter"),
    conferenceFilter: document.getElementById("conferenceFilter"),
    searchInput: document.getElementById("searchInput")
  };

  // ===========================================================================
  // 3. DATA LOADING & INITIALIZATION
  // ===========================================================================
  
  // Load raw schedule data from CSV, sanitize UTF-8 BOM characters, and initialize dashboard
  d3.csv("currentWeek/weekFull.csv", raw => {
    const clean = {};
    Object.keys(raw).forEach(key => {
      const normalizedKey = key.replace(/^\uFEFF/, "");
      clean[normalizedKey] = raw[key];
    });
    return clean;
  }).then(data => {
    window.gameData = data;

    // Determine initial date selection and populate date dropdown options
    const initialDate = getFirstAvailableDate(window.gameData);
    updateDateSlicerOptions(window.gameData, initialDate);
    
    // Build initial filter slicers and render charts
    refreshAllSlicersExcept();
    applyFilters();

    // Trigger window resize event shortly after load to ensure Plotly dimensions render correctly
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
      refreshAllSlicersExcept("top25");
      applyFilters();
    });

    // Event Listener: Text Search Input Change (Jumps to first available matching date & overrides filters)
    DOM.searchInput?.addEventListener("input", () => {
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

      refreshAllSlicersExcept();
      applyFilters();
    });
  });

  // ===========================================================================
  // 4. FILTERING & STATE MANAGEMENT FUNCTIONS
  // ===========================================================================

  /**
   * Retrieves the current user-selected state across all active filter controls.
   */
  function getActiveSelections() {
    const selectedDate = DOM.dateFilter ? DOM.dateFilter.value : null;
    const top25Only = DOM.rankedFilter ? (DOM.rankedFilter.checked && !DOM.rankedFilter.disabled) : false;

    const leagueAllEl = document.getElementById("league_all");
    
    // On initial load before the league slicer is rendered, default to the requested default leagues
    if (!leagueAllEl) {
      return {
        date: selectedDate,
        top25Only: top25Only,
        leagues: DEFAULT_LEAGUES,
        isLeagueAll: false,
        times: [],
        isTimeAll: true,
        conferences: [],
        isConfAll: true
      };
    }

    const leagueAllChecked = leagueAllEl.checked;
    const selectedLeagues = leagueAllChecked ? [] : Array.from(
      document.querySelectorAll("#leagueFilter .league-checkbox:checked")
    ).map(cb => cb.value);

    const timeAllChecked = document.getElementById("time_all")?.checked ?? true;
    const selectedTimes = timeAllChecked ? [] : Array.from(
      document.querySelectorAll("#timeFilter .time-checkbox:checked")
    ).map(cb => cb.value);

    const confAllChecked = document.getElementById("conf_all")?.checked ?? true;
    const selectedConferences = confAllChecked ? [] : Array.from(
      document.querySelectorAll("#conferenceFilter .conf-checkbox:checked")
    ).map(cb => cb.value);

    return {
      date: selectedDate,
      top25Only: top25Only,
      leagues: selectedLeagues,
      isLeagueAll: leagueAllChecked,
      times: selectedTimes,
      isTimeAll: timeAllChecked,
      conferences: selectedConferences,
      isConfAll: confAllChecked
    };
  }

  /**
   * Checks if a game scheduled for today has already concluded more than 15 minutes ago.
   */
  function isGameExpiredToday(d) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let cleanStr = d.Date?.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (cleanStr && !/\b20\d{2}\b/.test(cleanStr)) {
      cleanStr = `${cleanStr}, ${currentYear}`;
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

  /**
   * Multi-dimensional cross-filter evaluation engine supporting keyword search combined with active date/slicers.
   */
  function getFilteredDataExcept(excludedFilter = null) {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    return window.gameData.filter(d => {
      if (isGameExpiredToday(d)) return false;

      // Global Keyword Search Filter
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

        if (!matchesSearch) return false;
      }

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

      // 3. Ranked NCAA Teams Filter
      if (excludedFilter !== "top25" && state.top25Only) {
        const isTop25 = d.Ranked ? d.Ranked.trim().toUpperCase() === "Y" : false;
        if (!isTop25) return false;
      }

      // 4. Game Start Time Filter
      if (excludedFilter !== "time") {
        if (!state.isTimeAll && state.times.length === 0) return false;
        if (!state.isTimeAll && !state.times.includes(d.Start_Time)) return false;
      }

      // 5. Conference Filter (Visitor or Home Conference match)
      if (excludedFilter !== "conference") {
        if (!state.isConfAll && state.conferences.length === 0) return false;
        if (!state.isConfAll) {
          const vConf = d.Visitor_Conference?.trim();
          const hConf = d.Home_Conference?.trim();
          if (!state.conferences.includes(vConf) && !state.conferences.includes(hConf)) return false;
        }
      }

      return true;
    });
  }

  /**
   * Updates availability of the Ranked NCAA Teams toggle based on cross-filtered games.
   */
  function updateRankedToggleState(shouldReset = false) {
    if (!DOM.rankedFilter) return;

    const rankedSubset = getFilteredDataExcept("top25");
    const hasTop25 = rankedSubset.some(d => d.Ranked && d.Ranked.trim().toUpperCase() === "Y");

    if (!hasTop25) {
      DOM.rankedFilter.checked = false;
      DOM.rankedFilter.disabled = true;
    } else {
      DOM.rankedFilter.disabled = false;
      if (shouldReset) {
        DOM.rankedFilter.checked = false; // Default to unselected on initial load or date change
      }
    }
  }

  /**
   * Dynamically renders and binds event listeners for the Sports League checkbox filter panel.
   */
  function updateLeagueSlicer(filteredData, selectedLeagues = [], isAllChecked = false) {
    if (!DOM.leagueFilter) return;

    const uniqueLeagues = Array.from(new Set(filteredData.map(d => d.League?.trim()))).filter(Boolean).sort();

    DOM.leagueFilter.innerHTML = "";

    if (uniqueLeagues.length === 0) {
      DOM.leagueFilter.innerHTML = `<div class="text-muted small p-1">No leagues available</div>`;
      return;
    }

    // Render "All Leagues" master checkbox
    const allDiv = document.createElement("div");
    allDiv.className = "form-check border-bottom pb-1 mb-2";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="league_all" ${isAllChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="league_all">All Leagues</label>
    `;
    DOM.leagueFilter.appendChild(allDiv);

    // Render individual league checkboxes
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

    if (allCheckbox && itemCheckboxes.length > 0) {
      allCheckbox.checked = Array.from(itemCheckboxes).every(item => item.checked);
    }

    allCheckbox?.addEventListener("change", (e) => {
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      refreshAllSlicersExcept("league");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                              Array.from(itemCheckboxes).every(item => item.checked);
        refreshAllSlicersExcept("league");
        applyFilters();
      });
    });
  }

  /**
   * Refreshes all dependent filter slicers and toggle states while preserving user selections across dimensions.
   */
  function refreshAllSlicersExcept(targetSource = null) {
    const isDateChangeOrInit = (targetSource === "date" || targetSource === null);
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    updateRankedToggleState(isDateChangeOrInit);

    const currentState = getActiveSelections();

    if (targetSource !== "date") {
      const dateSubset = getFilteredDataExcept("date");
      updateDateSlicerOptions(dateSubset, currentState.date);
    }

    if (targetSource !== "league") {
      const leagueSubset = getFilteredDataExcept("league");
      // When keyword search is active, override league filters to default to all leagues checked
      const leaguesToUse = searchQuery ? [] : (isDateChangeOrInit ? DEFAULT_LEAGUES : currentState.leagues);
      const isAllToUse = searchQuery ? true : (isDateChangeOrInit ? false : currentState.isLeagueAll);
      updateLeagueSlicer(leagueSubset, leaguesToUse, isAllToUse);
    }

    if (targetSource !== "time") {
      const timeSubset = getFilteredDataExcept("time");
      updateTimeSlicer(timeSubset, currentState.times, currentState.isTimeAll);
    }

    if (targetSource !== "conference") {
      const confSubset = getFilteredDataExcept("conference");
      updateConferenceSlicer(confSubset, currentState.conferences, currentState.isConfAll);
    }
  }

  /**
   * Intelligent logic to determine the most relevant initial date to display on dashboard load.
   */
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

  /**
   * Populates the Date dropdown slicer options sorted chronologically (adaptive to active filters).
   */
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
  }

  /**
   * Dynamically renders and binds event listeners for the Game Start Time checkbox filter panel.
   */
  function updateTimeSlicer(filteredData, selectedTimes = [], isAllChecked = true) {
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
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      refreshAllSlicersExcept("time");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                              Array.from(itemCheckboxes).every(item => item.checked);
        refreshAllSlicersExcept("time");
        applyFilters();
      });
    });
  }

  /**
   * Dynamically renders and binds event listeners for the Conference checkbox filter panel.
   */
  function updateConferenceSlicer(filteredData, selectedConferences = [], isAllChecked = true) {
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
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      refreshAllSlicersExcept("conference");
      applyFilters();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        allCheckbox.checked = Array.from(itemCheckboxes).length > 0 && 
                              Array.from(itemCheckboxes).every(item => item.checked);
        refreshAllSlicersExcept("conference");
        applyFilters();
      });
    });
  }

  /**
   * Applies active filters, splits dataset into linear broadcast vs. digital streaming, and triggers rendering.
   */
  function applyFilters() {
    const filtered = getFilteredDataExcept(null);

    const primaryData = filtered.filter(d => !DIGITAL_NETWORKS.includes(d.TV_Network));
    const digitalData = filtered.filter(d => DIGITAL_NETWORKS.includes(d.TV_Network));

    renderChart('barChart', primaryData, false);
    renderChart('digitalChart', digitalData, true);
  }

  /**
   * Matches a game matchup string to the home team's brand hex color from TEAM_COLORS lookup.
   */
  function getHomeTeamColor(matchup) {
    if (!matchup) return '#D3D3D3';

    const parts = matchup.split(/\s+(?:at|vs\.?)\s+/i);
    if (parts.length < 2) return '#D3D3D3';

    const homeTeamRaw = parts[parts.length - 1].trim();

    if (Object.prototype.hasOwnProperty.call(TEAM_COLORS, homeTeamRaw)) {
      return TEAM_COLORS[homeTeamRaw];
    }

    let homeTeamClean = homeTeamRaw
      .replace(/^(?:No\.\s*\d+|#\d+)\s+/i, '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim();

    if (Object.prototype.hasOwnProperty.call(TEAM_COLORS, homeTeamClean)) {
      return TEAM_COLORS[homeTeamClean];
    }

    return '#D3D3D3';
  }

  /**
   * Helper function to convert 12-hour time string (e.g. "7:30 PM") into total minutes from midnight.
   */
  function timeToMinutes(t) {
    if (!t) return 0;
    const [time, ampm] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  /**
   * Bin-packing algorithm to stack overlapping game time windows into non-conflicting sub-rows.
   */
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
  // 5. CHART RENDERING & VISUALIZATION (PLOTLY)
  // ===========================================================================

  /**
   * Renders or updates a Plotly horizontal Gantt-style timeline chart for broadcast networks or streaming platforms.
   */
  function renderChart(targetId, data, isDigital = false) {
    const container = document.getElementById(targetId);

    // Handle empty data state by rendering a placeholder message
    if (!data || data.length === 0) {
      container.style.height = '120px';
      Plotly.newPlot(targetId, [], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        title: {
          text: isDigital ? 'No streaming games matching selections.' : 'No network games matching selections.',
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

    // Process each network group and construct Plotly bar traces for each game
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

    // Calculate dynamic container height based on total rows required
    const ROW_HEIGHT = 37;
    const TOP_MARGIN = 45;
    const BOTTOM_MARGIN = 29;
    
    const totalRows = yTicks.length;
    const calculatedPlotHeight = (totalRows * ROW_HEIGHT) + TOP_MARGIN + BOTTOM_MARGIN;

    container.style.height = `${calculatedPlotHeight}px`;

    // Determine earliest game start time to dynamically clamp X-axis starting range
    const currentFilteredSubset = getFilteredDataExcept(null);

    let earliestStart = 1440;
    if (currentFilteredSubset && currentFilteredSubset.length > 0) {
      currentFilteredSubset.forEach(game => {
        const startMin = timeToMinutes(game.Start_Time);
        if (!isNaN(startMin) && startMin < earliestStart) {
          earliestStart = startMin;
        }
      });
    }

    if (earliestStart === 1440 || isNaN(earliestStart)) {
      earliestStart = 600; // Fallback default (10:00 AM)
    }

    const END_OF_DAY_MINUTES = 1500; // 1:00 AM

    // Configure Plotly chart layout parameters
    const layout = {
      height: calculatedPlotHeight,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      barmode: 'stack',
      bargap: 0.15,               
      autosize: true,
      margin: {
        l: 67,
        r: 0,
        t: TOP_MARGIN,
        b: BOTTOM_MARGIN
      },
      dragmode: false,
      xaxis: {
        fixedrange: true,
        side: 'top',
        type: 'linear',
        range: [earliestStart, END_OF_DAY_MINUTES],
        tickmode: 'array',
        tickvals: SHARED_X_AXIS_VALS,
        ticktext: SHARED_X_AXIS_TEXT,
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

    // Render the Plotly chart inside the target container
    Plotly.newPlot(targetId, traces, layout, config);
  }

  // ===========================================================================
  // 6. GLOBAL TIMERS & EVENT LISTENERS
  // ===========================================================================

  // Auto-refresh active charts every 60 seconds (if refresh function is defined)
  setInterval(() => {
    if (typeof refreshActiveCharts === 'function') {
      refreshActiveCharts();
    }
  }, 60000);

  // Debounced window resize event listener to trigger responsive Plotly chart scaling
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
