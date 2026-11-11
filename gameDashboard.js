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
    }, 15000);

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
    "YouTube", "Midco Sports", "USAHockeyTV.com", "[OffAir]", "TBA", "hudl", "NEC FR",
    "CACC Net", "FloSports", "Prime Video", "ACCNX", "SECN+", "America East", "FloCollege", "MEAC Net", "N/A", "MW+", "-- TBA --", "",
    "XAVIER+", "NBA LP", "MNMT", "Apple TV", "Patriot League TV", "SLN", "BlazerVision",
    "DAZN MIN", "Thunder App", "Pelicans.com", "DAZN MEM", "ClipperVision", "DAZN (YES)",
    "Bucks App", "Summit", "Suns Live", "MavsTV", "DAZN SAS", "MEAC Network", "DAZN CLE", "Jazz+", "Midco/Summit", "DAZN IND", "NEC Front Row",
    "Paramount+"
  ];

  const SHARED_X_AXIS_VALS = [
    0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 
    720, 780, 840, 900, 960, 1020, 1080, 1140, 1200, 1260, 1320, 1380, 
    1440, 1500, 1560, 1620, 1680, 1740
  ];
  const SHARED_X_AXIS_TEXT = [
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', 
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM'
  ];

  const DOM = {
    dateFilter: document.getElementById("dateFilter"),
    leagueFilter: document.getElementById("leagueFilter"),
    rankedFilter: document.getElementById("rankedFilter"),
    timeFilter: document.getElementById("timeFilter"),
    conferenceFilter: document.getElementById("conferenceFilter"),
    searchInput: document.getElementById("searchInput")
  };

  let userHasModifiedFilters = false;
  let currentUserXRange = null;

  const filterState = {
    leagues: [],
    isLeagueAll: true,
    conferences: [],
    isConfAll: true,
    times: [],
    isTimeAll: true,
    top25Only: false,
    date: null
  };

  // ===========================================================================
  // 3. OPTIMIZED TIMEZONE CONVERSION UTILITY (MEMOIZED)
  // ===========================================================================

  const chicagoFormatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'America/Chicago', 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: false 
  });

  const offsetCache = {};

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
    const cacheKey = `${year}-${month}-${day}`;
    
    let offsetMs = offsetCache[cacheKey];
    if (offsetMs === undefined) {
      const parts = chicagoFormatter.formatToParts(new Date(utcGuess));
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
      
      offsetMs = chicagoAsUtc - utcGuess;
      offsetCache[cacheKey] = offsetMs;
    }
    
    return utcGuess - offsetMs;
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

      const startMins = timeToMinutes(localStartStr);
      let endMins = timeToMinutes(localEndStr);
      if (endMins < startMins) endMins += 1440;

      let cleanStr = d.Date?.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
      if (cleanStr && !/\b20\d{2}\b/.test(cleanStr)) {
        cleanStr = `${cleanStr}, ${currentYear}`;
      }
      const gameDateParsed = cleanStr ? new Date(cleanStr) : null;
      const gameNormalizedTime = gameDateParsed ? new Date(gameDateParsed.getFullYear(), gameDateParsed.getMonth(), gameDateParsed.getDate()).getTime() : 0;

      return {
        ...d,
        Original_Date: d.Date,
        Original_Start_Time: d.Start_Time,
        Original_End_Time: d.End_Time,
        Date: localDateStr,
        Start_Time: localStartStr,
        End_Time: localEndStr,
        _startEpoch: startEpoch,
        _endEpoch: adjustedEndEpoch,
        _startMins: startMins,
        _endMins: endMins,
        _gameNormalizedTime: gameNormalizedTime,
        _isNcaa: Boolean(d.League && d.League.trim().toUpperCase().startsWith("NCAA")),
        _cleanLeague: d.League?.trim() || "",
        _cleanVisitorConf: d.Visitor_Conference?.trim() || "",
        _cleanHomeConf: d.Home_Conference?.trim() || ""
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

    DOM.dateFilter?.addEventListener("change", () => {
      currentUserXRange = null;
      refreshAllSlicersExcept("date");
      applyFilters();
    });

    DOM.rankedFilter?.addEventListener("change", () => {
      userHasModifiedFilters = true;
      filterState.top25Only = DOM.rankedFilter.checked;
      refreshAllSlicersExcept("top25");
      applyFilters();
    });

    DOM.searchInput?.addEventListener("input", () => {
      userHasModifiedFilters = true;
      currentUserXRange = null;
      const searchQuery = DOM.searchInput.value.trim().toLowerCase();
      if (searchQuery) {
        const now = new Date();
        const startOfTodayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const nowTime = now.getTime();

        const matchingGames = window.gameData.filter(d => {
          if (isGameExpiredToday(d, startOfTodayTime, nowTime)) return false;
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

  function isGameExpiredToday(d, startOfTodayTime, nowTime) {
    if (d._gameNormalizedTime !== startOfTodayTime) return false;

    const gameEndTimestamp = startOfTodayTime + d._endMins * 60000;
    const thresholdTimestamp = gameEndTimestamp + 20 * 60000;  // minutes after scheduled end to filter out matchup

    return nowTime >= thresholdTimestamp;
  }

  function getFilteredDataExcept(excludedFilter = null) {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";
    
    const now = new Date();
    const startOfTodayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const nowTime = now.getTime();

    const isExcluded = (name) => {
      if (!excludedFilter) return false;
      if (Array.isArray(excludedFilter)) return excludedFilter.includes(name);
      return excludedFilter === name;
    };

    return window.gameData.filter(d => {
      if (isGameExpiredToday(d, startOfTodayTime, nowTime)) return false;

      if (!isExcluded("date") && state.date && d.Date !== state.date) {
        return false;
      }

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

      if (!isExcluded("league")) {
        if (!state.isLeagueAll && state.leagues.length === 0) return false;
        if (!state.isLeagueAll && !state.leagues.includes(d._cleanLeague)) return false;
      }

      if (!isExcluded("top25") && state.top25Only) {
        if (d._isNcaa) {
          const isTop25 = d.Ranked ? d.Ranked.trim().toUpperCase() === "Y" : false;
          if (!isTop25) return false;
        }
      }

      if (!isExcluded("time")) {
        if (!state.isTimeAll && state.times.length === 0) return false;
        if (!state.isTimeAll && !state.times.includes(d.Start_Time)) return false;
      }

      if (!isExcluded("conference")) {
        if (d._isNcaa && !state.isConfAll) {
          if (state.conferences.length === 0) return false;
          if (!state.conferences.includes(d._cleanVisitorConf) && !state.conferences.includes(d._cleanHomeConf)) return false;
        }
      }

      return true;
    });
  }

  function getRankedScopeData() {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    return window.gameData.filter(d => {
      if (isGameExpiredToday(d, new Date().setHours(0,0,0,0), Date.now())) return false;

      if (state.date && d.Date !== state.date) return false;

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

      if (!state.isLeagueAll) {
        if (state.leagues.length === 0) return false;
        if (!state.leagues.includes(d._cleanLeague)) return false;
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

  function renderCheckboxSlicer(containerEl, allId, itemClass, allLabel, items, selectedItems, isAllChecked, onChangeCallback) {
    if (!containerEl) return;
    
    const scrollTop = containerEl.scrollTop;
    containerEl.innerHTML = "";

    if (items.length === 0) {
      containerEl.innerHTML = `<div class="text-muted small p-1">No items available</div>`;
      return;
    }

    const allDiv = document.createElement("div");
    allDiv.className = "form-check border-bottom pb-1 mb-2";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="${allId}" ${isAllChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="${allId}">${allLabel}</label>
    `;
    containerEl.appendChild(allDiv);

    items.forEach((item, idx) => {
      const isChecked = isAllChecked || selectedItems.includes(item);
      const div = document.createElement("div");
      div.className = "form-check";
      div.innerHTML = `
        <input class="form-check-input ${itemClass}" type="checkbox" value="${item}" id="${allId}_${idx}" ${isChecked ? 'checked' : ''}>
        <label class="form-check-label" for="${allId}_${idx}">${item}</label>
      `;
      containerEl.appendChild(div);
    });

    const allCheckbox = document.getElementById(allId);
    const itemCheckboxes = containerEl.querySelectorAll(`.${itemClass}`);

    allCheckbox?.addEventListener("change", (e) => {
      userHasModifiedFilters = true;
      itemCheckboxes.forEach(cb => cb.checked = e.target.checked);
      syncStateFromDOM();
      onChangeCallback();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        userHasModifiedFilters = true;
        allCheckbox.checked = itemCheckboxes.length > 0 && Array.from(itemCheckboxes).every(item => item.checked);
        syncStateFromDOM();
        onChangeCallback();
      });
    });

    containerEl.scrollTop = scrollTop;
  }

  function updateLeagueSlicer(filteredData, selectedLeagues = [], isAllChecked = true) {
    const uniqueLeagues = Array.from(new Set(filteredData.map(d => d._cleanLeague))).filter(Boolean).sort();
    renderCheckboxSlicer(
      DOM.leagueFilter,
      "league_all",
      "league-checkbox",
      "All Leagues",
      uniqueLeagues,
      selectedLeagues,
      isAllChecked,
      () => {
        refreshAllSlicersExcept("league");
        applyFilters();
      }
    );
  }

  function updateTimeSlicer(filteredData, selectedTimes = [], isAllChecked = true) {
    const uniqueTimes = Array.from(new Set(filteredData.map(d => d.Start_Time)))
      .filter(Boolean)
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

    renderCheckboxSlicer(
      DOM.timeFilter,
      "time_all",
      "time-checkbox",
      "All Times",
      uniqueTimes,
      selectedTimes,
      isAllChecked,
      () => {
        refreshAllSlicersExcept("time");
        applyFilters();
      }
    );
  }

  function updateConferenceSlicer(filteredData, selectedConferences = [], isAllChecked = true) {
    const extractedConfs = new Set();
    filteredData.forEach(d => {
      if (d._cleanVisitorConf) extractedConfs.add(d._cleanVisitorConf);
      if (d._cleanHomeConf) extractedConfs.add(d._cleanHomeConf);
    });

    const orderedConfs = Array.from(extractedConfs).filter(Boolean).sort((a, b) => a.localeCompare(b));

    renderCheckboxSlicer(
      DOM.conferenceFilter,
      "conf_all",
      "conf-checkbox",
      "All Conferences",
      orderedConfs,
      selectedConferences,
      isAllChecked,
      () => {
        refreshAllSlicersExcept("conference");
        applyFilters();
      }
    );
  }

  function refreshAllSlicersExcept(targetSource = null) {
    const isInit = (targetSource === null);
    const isDateChange = (targetSource === "date");
    const currentSelectedDate = DOM.dateFilter ? DOM.dateFilter.value : null;

    if (isInit) {
      userHasModifiedFilters = false;
      filterState.leagues = [];
      filterState.isLeagueAll = true;
      filterState.conferences = [];
      filterState.isConfAll = true;
      filterState.times = [];
      filterState.isTimeAll = true;
      filterState.top25Only = false;
    } else {
      syncStateFromDOM();
    }

    updateRankedToggleState(isInit);

    if (isInit || !isDateChange) {
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
      const confSubset = getFilteredDataExcept(["date", "conference"]);
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
          if (g._endMins > maxEndMinutes) maxEndMinutes = g._endMins;
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
        if (!isNaN(game._startMins) && game._startMins < earliestStart) earliestStart = game._startMins;
        if (!isNaN(game._endMins) && game._endMins > latestEnd) latestEnd = game._endMins;
      });
    }

    if (earliestStart === 1440 || isNaN(earliestStart)) earliestStart = 600;
    if (latestEnd === 0 || isNaN(latestEnd)) latestEnd = 1440;

    const paddedStart = Math.max(0, earliestStart - 15);
    const paddedEnd = Math.max(paddedStart + 60, latestEnd + 15);
    const syncedXRange = [paddedStart, paddedEnd];

    const primaryData = filtered.filter(d => !DIGITAL_NETWORKS.includes(d.TV_Network));
    const digitalData = filtered.filter(d => DIGITAL_NETWORKS.includes(d.TV_Network));

    renderChart('barChart', primaryData, false, syncedXRange);
    renderChart('digitalChart', digitalData, true, syncedXRange);
  }

  function getHomeTeamColor(matchup) {
    if (!matchup) return '#FFFFFF';  // if home team not found in teamColors.js

    if (/\bBowl\b/.test(matchup)) return '#1E3A8A'; // if exactly "Bowl" is found in matchup string

    // Pregame or other Shows
    if (/\bBig Noon Kickoff\b/.test(matchup)) return '#002a54'; // if exactly "Big Noon Kickoff" is found in matchup string
    if (/\bCollege GameDay\b/.test(matchup)) return '#f16722'; // if exactly "College GameDay" is found in matchup string
    if (/\bACC Huddle\b/.test(matchup)) return '#017684'; // if exactly "ACC Huddle" is found in matchup string
    if (/\bSEC Nation\b/.test(matchup)) return '#1d366c'; // if exactly "SEC Nation" is found in matchup string
    if (/\bB1G Tailgate\b/.test(matchup)) return '#0f87c9'; // if exactly "B1G Tailgate" is found in matchup string
    if (/\bCFP Rankings\b/.test(matchup)) return '#C28C19'; // if exactly "CFP Rankings" is found in matchup string
    
    if (/\bUFC\b/.test(matchup)) return '#d20a0a'; // if exactly "UFC" is found in matchup string

    if (/\bNCAA Tournament Selection Show\b/.test(matchup)) return '#0f7cc1'; // if exactly "NCAA Tournament Selection Show" is found in matchup string

    if (/\bLive From\b/.test(matchup)) return '#003a6f'; // if exactly "Live From" is found in matchup string
    if (/\bBreakfast\b/.test(matchup)) return '#593987'; // if exactly "Breakfast" is found in matchup string; overrides " at " color matching
    if (/\bNASCAR RaceDay\b/.test(matchup)) return '#E4002B'; // if exactly "NASCAR RaceDay" is found in matchup string; overrides " at " color matching


    // Neutral site handler for non-Bowl Games
    // if (/\b vs \b/.test(matchup)) return '#000000'; // if exactly " vs " is found in matchup string

    // if (!matchup.toLowerCase().includes(' at ')) return '#C28C19'; // if matchup string does not include " at "

    const parts = matchup.split(/\s+at\s+/i);
    if (parts.length < 2) return '#FFFFFF';

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

  function resolveOverlapSubRows(games) {
    games.sort((a, b) => a._startMins - b._startMins);

    const subRowEndTimes = [];
    const assignedGames = [];

    games.forEach(game => {
      let rowIndex = -1;
      for (let i = 0; i < subRowEndTimes.length; i++) {
        if (subRowEndTimes[i] <= game._startMins) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        subRowEndTimes.push(game._endMins);
        rowIndex = subRowEndTimes.length - 1;
      } else {
        subRowEndTimes[rowIndex] = game._endMins;
      }

      assignedGames.push({
        ...game,
        subRowIndex: rowIndex
      });
    });

    return { assignedGames, totalSubRows: subRowEndTimes.length };
  }

  // ===========================================================================
  // 6. CHART RENDERING & VISUALIZATION (PLOTLY - OPTIMIZED WITH PLOTLY.REACT)
  // ===========================================================================

  function renderChart(targetId, data, isDigital = false, xAxisRange = [480, 1500]) {
    const container = document.getElementById(targetId);

    if (!data || data.length === 0) {
      container.style.height = '120px';
      Plotly.react(targetId, [], {
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

    const isNarrow = window.innerWidth < 1200;
    const isMobilePortrait = isNarrow && window.innerHeight > window.innerWidth;

    const matchupFontSize = isNarrow ? '17px' : '22px';
    const leagueFontSize = isNarrow ? '12px' : '16px';
    const fontStack = "'Arial Narrow', Arial, sans-serif";

    grouped.forEach((games, network) => {
      const { assignedGames, totalSubRows } = resolveOverlapSubRows(games);

      for (let i = 0; i < totalSubRows; i++) {
        const rowKey = `${network}_row_${i}`;
        yTicks.push(rowKey);
        yTickLabels.push(network);
      }

      assignedGames.forEach(game => {
        const duration = game._endMins >= game._startMins ? (game._endMins - game._startMins) : (game._endMins + 1440 - game._startMins);
        const teamHexColor = getHomeTeamColor(game.Matchup);
        const internalRowKey = `${network}_row_${game.subRowIndex}`;
        const isRanked = game.Matchup.includes('#');
        const matchupText = isRanked ? `<b>${game.Matchup}</b>` : game.Matchup;
        const formattedLabel = `<span style="font-family: ${fontStack}; font-size: ${matchupFontSize};">${matchupText}</span><br><span style="font-family: ${fontStack}; font-size: ${leagueFontSize}; opacity: 0.85;">${game.League}</span>`;

        traces.push({
          type: 'bar',
          orientation: 'h',
          y: [internalRowKey],
          x: [duration],
          base: [game._startMins],
          name: game.Matchup,
          textfont: { size: isNarrow ? 14 : 16 },
          marker: { 
            color: teamHexColor,
            line: { color: '#eab308', width: 1.25 },
            cornerradius: "45%"
          },
          text: [formattedLabel],
          textposition: 'inside',
          insidetextanchor: 'middle',
          insidetextfont: { 
            family: fontStack,
            color: '#ffffff'
          },
          hoverlabel: {
            font: { family: 'Segoe UI, Arial, sans-serif', size: 20 },
            bgcolor: teamHexColor
          },
          hovertemplate:
            '<b>' + game.Matchup + '</b><br>' +
            'League: ' + game.League + '<br>' +
            'Live Broadcast: ' + network + '<br>' +
            'Scheduled Start: %{customdata[0]}<extra></extra>',
          customdata: [[game.Start_Time]]
        });
      });
    });

    const ROW_HEIGHT = 45;
    const TOP_MARGIN = 45;
    const BOTTOM_MARGIN = 29;
    
    const totalRows = yTicks.length;
    const calculatedPlotHeight = (totalRows * ROW_HEIGHT) + TOP_MARGIN + BOTTOM_MARGIN;

    container.style.height = `${calculatedPlotHeight}px`;

    const [rawRangeStart, rawRangeEnd] = xAxisRange;
    let rangeStart = rawRangeStart;
    let rangeEnd = rawRangeEnd;

    if (currentUserXRange) {
      rangeStart = currentUserXRange[0];
      rangeEnd = currentUserXRange[1];
    } else if (isMobilePortrait) {
      rangeEnd = Math.min(rawRangeEnd, rangeStart + 165); // 2:45 timeline window for mobile portrait
    }

    function getTicksForRange(rStart, rEnd) {
      const tickIndices = [];
      SHARED_X_AXIS_VALS.forEach((val, idx) => {
        if (val >= rStart - 120 && val <= rEnd + 120) {
          tickIndices.push(idx);
        }
      });
      return {
        tickvals: tickIndices.map(i => SHARED_X_AXIS_VALS[i]),
        ticktext: tickIndices.map(i => SHARED_X_AXIS_TEXT[i])
      };
    }

    const initialTicks = getTicksForRange(rangeStart, rangeEnd);

    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedDateText = DOM.dateFilter ? DOM.dateFilter.value : "";
    
    let cleanSelected = selectedDateText.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (!/\b20\d{2}\b/.test(cleanSelected)) cleanSelected = `${cleanSelected}, ${currentYear}`;
    const selectedDateParsed = new Date(cleanSelected);
    const startOfSelected = new Date(selectedDateParsed.getFullYear(), selectedDateParsed.getMonth(), selectedDateParsed.getDate()).getTime();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const isToday = !isNaN(startOfSelected) && (startOfSelected === startOfToday);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const shapes = [];
    if (isToday) {
      shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        layer: 'above',
        x0: currentMins,
        x1: currentMins,
        y0: 0,
        y1: 1,
        line: { color: '#ff0000', width: 0.75 }
      });
    }

    const layout = {
      height: calculatedPlotHeight,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      barmode: 'stack',
      bargap: 0.15,      
      autosize: true,
      shapes: shapes,
      margin: { l: 67, r: 0, t: TOP_MARGIN, b: BOTTOM_MARGIN, pad: 0 },
      automargin: false,
      dragmode: isMobilePortrait ? 'pan' : false,
      xaxis: {
        fixedrange: !isMobilePortrait,
        side: 'top',
        type: 'linear',
        range: [rangeStart, rangeEnd],
        tickmode: 'array',
        tickvals: initialTicks.tickvals,
        ticktext: initialTicks.ticktext,
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
        automargin: false,
        ticksuffix: '',
        autorange: 'reversed',
        ticks: 'outside',
        ticklen: 8,
        tickcolor: 'rgba(0,0,0,0)',
        tickmode: 'array',
        tickvals: yTicks,
        ticktext: yTickLabels,
        tickfont: { family: 'Segoe UI, Arial, sans-serif', size: 10, color: '#f3e5ab' }
      },
      showlegend: false
    };

    const config = { responsive: true, displayModeBar: false };

    // Use Plotly.react for high-performance updates without full DOM teardown
    Plotly.react(targetId, traces, layout, config).then(plotDiv => {
      if (!plotDiv._hasRelayoutListener) {
        plotDiv._hasRelayoutListener = true;
        plotDiv.on('plotly_relayout', function(eventData) {
          if (window._isSyncingCharts) return;

          const r0 = eventData['xaxis.range[0]'];
          const r1 = eventData['xaxis.range[1]'];

          if (r0 !== undefined && r1 !== undefined) {
            window._isSyncingCharts = true;
            currentUserXRange = [r0, r1];

            const updatedTicks = getTicksForRange(r0, r1);

            Plotly.relayout(plotDiv, {
              'xaxis.range': [r0, r1],
              'xaxis.tickvals': updatedTicks.tickvals,
              'xaxis.ticktext': updatedTicks.ticktext
            });

            const otherId = (targetId === 'barChart') ? 'digitalChart' : 'barChart';
            const otherDiv = document.getElementById(otherId);
            if (otherDiv && otherDiv.data && otherDiv.data.length > 0) {
              const otherTicks = getTicksForRange(r0, r1);
              Plotly.relayout(otherDiv, {
                'xaxis.range': [r0, r1],
                'xaxis.tickvals': otherTicks.tickvals,
                'xaxis.ticktext': otherTicks.ticktext
              });
            }

            setTimeout(() => {
              window._isSyncingCharts = false;
            }, 50);
          }
        });
      }
    });
  }

  // ===========================================================================
  // 7. GLOBAL TIMERS & EVENT LISTENERS
  // ===========================================================================

  setInterval(() => {
    applyFilters();
  }, 30000);

  setInterval(() => {
    if (typeof refreshActiveCharts === 'function') {
      refreshActiveCharts();
    }
  }, 60000);

  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyFilters();
    }, 150);
  });

});
