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
    "Paramount+", "PTB Live", "ESPN Unlmtd", "BDG Sports"
  ];

  const SHARED_X_AXIS_VALS = [
    0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 
    720, 780, 840, 900, 960, 1020, 1080, 1140, 1200, 1260, 1320, 1380, 
    1440, 1500, 1560
  ];
  const SHARED_X_AXIS_TEXT = [
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', 
    '12:00 AM', '1:00 AM', '2:00 AM'
  ];

  const DOM = {
    dateFilter: document.getElementById("dateFilter"),
    leagueFilter: document.getElementById("leagueFilter"),
    rankedFilter: document.getElementById("rankedFilter"),
    timeFilter: document.getElementById("timeFilter"),
    conferenceFilter: document.getElementById("conferenceFilter"),
    networkDropdown: document.getElementById("networkDropdown"),
    networkDropdownBtn: document.getElementById("networkDropdownBtn"),
    networkDropdownMenu: document.getElementById("networkDropdownMenu"),
    networkFilter: document.getElementById("networkFilter"),
    networkSearchInput: document.getElementById("networkSearchInput"),
    networkSearchClear: document.getElementById("networkSearchClear"),
    matchupDropdown: document.getElementById("matchupDropdown"),
    matchupDropdownBtn: document.getElementById("matchupDropdownBtn"),
    matchupDropdownMenu: document.getElementById("matchupDropdownMenu"),
    matchupFilter: document.getElementById("matchupFilter"),
    matchupSearchInput: document.getElementById("matchupSearchInput"),
    matchupSearchClear: document.getElementById("matchupSearchClear"),
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
    networks: [],
    isNetworkAll: true,
    matchups: [],
    isMatchupAll: true,
    top25Only: false,
    date: null
  };

  // ===========================================================================
  // EXCEL-STYLE DROPDOWN OPEN / CLOSE / OUTSIDE-CLICK HANDLERS
  // ===========================================================================

  function setupExcelDropdown(dropdownEl, btnEl, menuEl, searchInputEl, clearBtnEl) {
    if (!dropdownEl || !btnEl || !menuEl) return;

    btnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menuEl.classList.contains("show");

      document.querySelectorAll(".excel-dropdown-menu.show").forEach(m => {
        m.classList.remove("show");
        m.previousElementSibling?.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        menuEl.classList.add("show");
        btnEl.setAttribute("aria-expanded", "true");
        if (searchInputEl) {
          setTimeout(() => searchInputEl.focus(), 10);
        }
      }
    });

    menuEl.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    if (searchInputEl && clearBtnEl) {
      searchInputEl.addEventListener("input", () => {
        clearBtnEl.classList.toggle("d-none", searchInputEl.value.length === 0);
      });

      clearBtnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        searchInputEl.value = "";
        clearBtnEl.classList.add("d-none");
        searchInputEl.dispatchEvent(new Event("input"));
        searchInputEl.focus();
      });
    }
  }

  setupExcelDropdown(
    DOM.networkDropdown,
    DOM.networkDropdownBtn,
    DOM.networkDropdownMenu,
    DOM.networkSearchInput,
    DOM.networkSearchClear
  );

  setupExcelDropdown(
    DOM.matchupDropdown,
    DOM.matchupDropdownBtn,
    DOM.matchupDropdownMenu,
    DOM.matchupSearchInput,
    DOM.matchupSearchClear
  );

  document.addEventListener("click", () => {
    document.querySelectorAll(".excel-dropdown-menu.show").forEach(menu => {
      menu.classList.remove("show");
      menu.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
  });

  // ===========================================================================
  // 3. OPTIMIZED TIMEZONE CONVERSION & ROBUST SEASON YEAR MAPPING
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

  function centralDateTimeToEpoch(dateStr, timeStr, defaultYear) {
    if (!dateStr || !timeStr) return 0;
    
    let cleanStr = dateStr.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (!/\b20\d{2}\b/.test(cleanStr)) {
      cleanStr = `${cleanStr}, ${defaultYear}`;
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
  // 4. DATA LOADING & INITIALIZATION WITH CROSS-YEAR RESOLUTION
  // ===========================================================================
  
  d3.csv("currentWeek/weekFull.csv", raw => {
    const clean = {};
    Object.keys(raw).forEach(key => {
      const normalizedKey = key.replace(/^\uFEFF/, "");
      clean[normalizedKey] = raw[key];
    });
    return clean;
  }).then(rawRows => {
    const baseSystemYear = new Date().getFullYear();

    // Pre-pass to map sequential multi-year schedules accurately across Dec/Jan boundaries
    let rollingYear = baseSystemYear;
    let lastMonth = -1;

    const processedRowsWithYears = rawRows.map(d => {
      let cleanStr = d.Date?.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '') || "";
      if (!/\b20\d{2}\b/.test(cleanStr)) {
        cleanStr = `${cleanStr}, ${baseSystemYear}`;
      }
      const parsedDate = new Date(cleanStr);
      const m = !isNaN(parsedDate) ? parsedDate.getMonth() : 0;
      
      if (lastMonth !== -1 && m < lastMonth && (lastMonth >= 10 && m <= 2)) {
        rollingYear++;
      }
      lastMonth = m;

      return { row: d, inferredYear: rollingYear };
    });

    window.gameData = processedRowsWithYears.map(({ row: d, inferredYear }) => {
      const startEpoch = centralDateTimeToEpoch(d.Date, d.Start_Time, inferredYear);
      const endEpoch = centralDateTimeToEpoch(d.Date, d.End_Time, inferredYear);
      
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
        cleanStr = `${cleanStr}, ${inferredYear}`;
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

    DOM.networkSearchInput?.addEventListener("input", () => {
      const subset = getFilteredDataExcept("network");
      updateNetworkSlicer(subset);
    });

    DOM.matchupSearchInput?.addEventListener("input", () => {
      const subset = getFilteredDataExcept("matchup");
      updateMatchupSlicer(subset);
    });

    DOM.searchInput?.addEventListener("input", () => {
      userHasModifiedFilters = true;
      currentUserXRange = null;
      const searchQuery = DOM.searchInput.value.trim().toLowerCase();
      if (searchQuery) {
        const matchingGames = window.gameData.filter(d => {
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
      const currentDOMLeagues = Array.from(
        document.querySelectorAll("#leagueFilter .league-checkbox:checked")
      ).map(cb => cb.value);

      if (!filterState.isLeagueAll) {
        const domCheckboxes = Array.from(document.querySelectorAll("#leagueFilter .league-checkbox"));
        const domValues = new Set(domCheckboxes.map(cb => cb.value));
        const unrenderedSelected = filterState.leagues.filter(v => !domValues.has(v));
        filterState.leagues = Array.from(new Set([...unrenderedSelected, ...currentDOMLeagues]));
      } else {
        filterState.leagues = [];
      }
    }

    const timeAllEl = document.getElementById("time_all");
    if (timeAllEl) {
      filterState.isTimeAll = timeAllEl.checked;
      const currentDOMTimes = Array.from(
        document.querySelectorAll("#timeFilter .time-checkbox:checked")
      ).map(cb => cb.value);

      if (!filterState.isTimeAll) {
        const domCheckboxes = Array.from(document.querySelectorAll("#timeFilter .time-checkbox"));
        const domValues = new Set(domCheckboxes.map(cb => cb.value));
        const unrenderedSelected = filterState.times.filter(v => !domValues.has(v));
        filterState.times = Array.from(new Set([...unrenderedSelected, ...currentDOMTimes]));
      } else {
        filterState.times = [];
      }
    }

    const confAllEl = document.getElementById("conf_all");
    if (confAllEl) {
      filterState.isConfAll = confAllEl.checked;
      const currentDOMConfs = Array.from(
        document.querySelectorAll("#conferenceFilter .conf-checkbox:checked")
      ).map(cb => cb.value);

      if (!filterState.isConfAll) {
        const domCheckboxes = Array.from(document.querySelectorAll("#conferenceFilter .conf-checkbox"));
        const domValues = new Set(domCheckboxes.map(cb => cb.value));
        const unrenderedSelected = filterState.conferences.filter(v => !domValues.has(v));
        filterState.conferences = Array.from(new Set([...unrenderedSelected, ...currentDOMConfs]));
      } else {
        filterState.conferences = [];
      }
    }

    const networkAllEl = document.getElementById("network_all");
    if (networkAllEl) {
      filterState.isNetworkAll = networkAllEl.checked;
      const currentDOMNetworks = Array.from(
        document.querySelectorAll("#networkFilter .network-checkbox:checked")
      ).map(cb => cb.value);

      if (!filterState.isNetworkAll) {
        const domCheckboxes = Array.from(document.querySelectorAll("#networkFilter .network-checkbox"));
        const domValues = new Set(domCheckboxes.map(cb => cb.value));
        const unrenderedSelected = filterState.networks.filter(v => !domValues.has(v));
        filterState.networks = Array.from(new Set([...unrenderedSelected, ...currentDOMNetworks]));
      } else {
        filterState.networks = [];
      }
    }

    const matchupAllEl = document.getElementById("matchup_all");
    if (matchupAllEl) {
      filterState.isMatchupAll = matchupAllEl.checked;
      const currentDOMMatchups = Array.from(
        document.querySelectorAll("#matchupFilter .matchup-checkbox:checked")
      ).map(cb => cb.value);

      if (!filterState.isMatchupAll) {
        const domCheckboxes = Array.from(document.querySelectorAll("#matchupFilter .matchup-checkbox"));
        const domValues = new Set(domCheckboxes.map(cb => cb.value));
        const unrenderedSelected = filterState.matchups.filter(v => !domValues.has(v));
        filterState.matchups = Array.from(new Set([...unrenderedSelected, ...currentDOMMatchups]));
      } else {
        filterState.matchups = [];
      }
    }
  }

  function getActiveSelections() {
    syncStateFromDOM();
    return filterState;
  }

  function getFilteredDataExcept(excludedFilter = null) {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    const isExcluded = (name) => {
      if (!excludedFilter) return false;
      if (Array.isArray(excludedFilter)) return excludedFilter.includes(name);
      return excludedFilter === name;
    };

    return window.gameData.filter(d => {
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

      if (!isExcluded("network")) {
        if (!state.isNetworkAll && state.networks.length === 0) return false;
        if (!state.isNetworkAll && !state.networks.includes(d.TV_Network)) return false;
      }

      if (!isExcluded("matchup")) {
        if (!state.isMatchupAll && state.matchups.length === 0) return false;
        if (!state.isMatchupAll && !state.matchups.includes(d.Matchup)) return false;
      }

      return true;
    });
  }

  function getRankedScopeData() {
    const state = getActiveSelections();
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.trim().toLowerCase() : "";

    return window.gameData.filter(d => {
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

  // ===========================================================================
  // EXCEL-STYLE DROPDOWN RENDERER (WITH SEARCH-AWARE SELECT ALL & SUMMARY TEXT)
  // ===========================================================================

  function updateExcelButtonLabel(btnEl, allLabel, allItems, selectedSet, isAllState) {
    if (!btnEl) return;
    const textSpan = btnEl.querySelector(".excel-btn-text");
    if (!textSpan) return;

    if (isAllState) {
      textSpan.textContent = allLabel;
    } else if (selectedSet.size === 0) {
      textSpan.textContent = "None selected";
    } else if (selectedSet.size === 1) {
      textSpan.textContent = Array.from(selectedSet)[0];
    } else {
      textSpan.textContent = `${selectedSet.size} selected`;
    }
  }

  function renderExcelDropdownSlicer({
    containerEl,
    btnEl,
    searchInputEl,
    allId,
    itemClass,
    allLabel,
    allItems,
    stateKeyAll,
    stateKeyList,
    onChangeCallback
  }) {
    if (!containerEl) return;

    const scrollTop = containerEl.scrollTop;
    containerEl.innerHTML = "";

    const query = searchInputEl ? searchInputEl.value.trim().toLowerCase() : "";
    const visibleItems = query
      ? allItems.filter(item => item.toLowerCase().includes(query))
      : allItems;

    const isAllState = filterState[stateKeyAll];
    const selectedSet = isAllState
      ? new Set(allItems)
      : new Set([...filterState[stateKeyList]]);

    updateExcelButtonLabel(btnEl, allLabel, allItems, selectedSet, isAllState);

    if (allItems.length === 0) {
      containerEl.innerHTML = `<div class="text-muted small p-2">No items available</div>`;
      return;
    }

    if (visibleItems.length === 0) {
      containerEl.innerHTML = `<div class="text-muted small p-2">No matches for "${searchInputEl.value}"</div>`;
      return;
    }

    const allVisibleChecked = visibleItems.every(item => selectedSet.has(item));
    const someVisibleChecked = visibleItems.some(item => selectedSet.has(item));
    const masterLabelText = query ? `(Select All Search Results)` : `(Select All)`;

    const allDiv = document.createElement("div");
    allDiv.className = "form-check excel-select-all";
    allDiv.innerHTML = `
      <input class="form-check-input" type="checkbox" id="${allId}" ${allVisibleChecked ? 'checked' : ''}>
      <label class="form-check-label fw-bold" for="${allId}">${masterLabelText}</label>
    `;
    containerEl.appendChild(allDiv);

    const allCheckbox = document.getElementById(allId);
    if (allCheckbox && !allVisibleChecked && someVisibleChecked) {
      allCheckbox.indeterminate = true;
    }

    visibleItems.forEach((item, idx) => {
      const isChecked = selectedSet.has(item);
      const div = document.createElement("div");
      div.className = "form-check excel-item-row";
      div.innerHTML = `
        <input class="form-check-input ${itemClass}" type="checkbox" value="${item.replace(/"/g, '&quot;')}" id="${allId}_${idx}" ${isChecked ? 'checked' : ''}>
        <label class="form-check-label" for="${allId}_${idx}">${item}</label>
      `;
      containerEl.appendChild(div);
    });

    const itemCheckboxes = containerEl.querySelectorAll(`.${itemClass}`);

    allCheckbox?.addEventListener("change", (e) => {
      userHasModifiedFilters = true;
      const shouldSelect = e.target.checked;
      itemCheckboxes.forEach(cb => cb.checked = shouldSelect);
      allCheckbox.indeterminate = false;

      filterState[stateKeyAll] = shouldSelect;
      if (shouldSelect) {
        filterState[stateKeyList] = [];
      } else {
        const visibleSet = new Set(visibleItems);
        filterState[stateKeyList] = filterState[stateKeyList].filter(v => !visibleSet.has(v));
      }

      const updatedSet = filterState[stateKeyAll] ? new Set(allItems) : new Set(filterState[stateKeyList]);
      updateExcelButtonLabel(btnEl, allLabel, allItems, updatedSet, filterState[stateKeyAll]);
      onChangeCallback();
    });

    itemCheckboxes.forEach(cb => {
      cb.addEventListener("change", (e) => {
        userHasModifiedFilters = true;
        const val = e.target.value;

        if (filterState[stateKeyAll]) {
          filterState[stateKeyAll] = false;
          filterState[stateKeyList] = allItems.filter(item => item !== val);
        } else {
          const nextSet = new Set(filterState[stateKeyList]);
          if (e.target.checked) {
            nextSet.add(val);
          } else {
            nextSet.delete(val);
          }
          filterState[stateKeyList] = Array.from(nextSet);
        }

        const updatedSet = new Set(filterState[stateKeyList]);
        const nowAllVis = visibleItems.every(item => updatedSet.has(item));
        const nowSomeVis = visibleItems.some(item => updatedSet.has(item));
        if (allCheckbox) {
          allCheckbox.checked = nowAllVis;
          allCheckbox.indeterminate = !nowAllVis && nowSomeVis;
        }

        updateExcelButtonLabel(btnEl, allLabel, allItems, updatedSet, filterState[stateKeyAll]);
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
      "All Sports/Leagues",
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

  function updateNetworkSlicer(filteredData) {
    const uniqueNetworks = Array.from(new Set(filteredData.map(d => d.TV_Network))).filter(Boolean).sort();
    renderExcelDropdownSlicer({
      containerEl: DOM.networkFilter,
      btnEl: DOM.networkDropdownBtn,
      searchInputEl: DOM.networkSearchInput,
      allId: "network_all",
      itemClass: "network-checkbox",
      allLabel: "All Networks/Platforms",
      allItems: uniqueNetworks,
      stateKeyAll: "isNetworkAll",
      stateKeyList: "networks",
      onChangeCallback: () => {
        refreshAllSlicersExcept("network");
        applyFilters();
      }
    });
  }

  function updateMatchupSlicer(filteredData) {
    const uniqueMatchups = Array.from(new Set(filteredData.map(d => d.Matchup))).filter(Boolean).sort();
    renderExcelDropdownSlicer({
      containerEl: DOM.matchupFilter,
      btnEl: DOM.matchupDropdownBtn,
      searchInputEl: DOM.matchupSearchInput,
      allId: "matchup_all",
      itemClass: "matchup-checkbox",
      allLabel: "All Matchups/Events",
      allItems: uniqueMatchups,
      stateKeyAll: "isMatchupAll",
      stateKeyList: "matchups",
      onChangeCallback: () => {
        refreshAllSlicersExcept("matchup");
        applyFilters();
      }
    });
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
      filterState.networks = [];
      filterState.isNetworkAll = true;
      filterState.matchups = [];
      filterState.isMatchupAll = true;
      filterState.top25Only = false;

      if (DOM.networkSearchInput) DOM.networkSearchInput.value = "";
      if (DOM.networkSearchClear) DOM.networkSearchClear.classList.add("d-none");
      if (DOM.matchupSearchInput) DOM.matchupSearchInput.value = "";
      if (DOM.matchupSearchClear) DOM.matchupSearchClear.classList.add("d-none");
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
      const confSubset = getFilteredDataExcept("conference");
      updateConferenceSlicer(confSubset, filterState.conferences, filterState.isConfAll);
    }

    if (targetSource !== "network") {
      const networkSubset = getFilteredDataExcept("network");
      updateNetworkSlicer(networkSubset);
    }

    if (targetSource !== "matchup") {
      const matchupSubset = getFilteredDataExcept("matchup");
      updateMatchupSlicer(matchupSubset);
    }
  }

  function getFirstAvailableDate(allData) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const uniqueDates = Array.from(new Set(allData.map(d => d.Date))).filter(Boolean);
    if (uniqueDates.length === 0) return null;

    const parsedDates = uniqueDates.map(dateStr => {
      const matchingGame = allData.find(d => d.Date === dateStr);
      const normalizedTime = matchingGame ? matchingGame._gameNormalizedTime : 0;
      return { originalStr: dateStr, parsedDate: new Date(normalizedTime) };
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
          const thresholdTime = new Date(latestEndDateTime.getTime() + 30 * 60000);
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

    // Sort chronologically using pre-calculated game timestamps (handles cross-year Dec -> Jan transitions)
    uniqueDates.sort((a, b) => {
      const gameA = filteredData.find(d => d.Date === a);
      const gameB = filteredData.find(d => d.Date === b);
      const timeA = gameA ? gameA._gameNormalizedTime : 0;
      const timeB = gameB ? gameB._gameNormalizedTime : 0;
      return timeA - timeB;
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

    const now = new Date();
    const currentYear = now.getFullYear();
    let cleanSelected = selectedDateText.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (!/\b20\d{2}\b/.test(cleanSelected)) cleanSelected = `${cleanSelected}, ${currentYear}`;
    const selectedDateParsed = new Date(cleanSelected);
    const startOfSelected = !isNaN(selectedDateParsed) ? new Date(selectedDateParsed.getFullYear(), selectedDateParsed.getMonth(), selectedDateParsed.getDate()).getTime() : 0;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const isToday = !isNaN(startOfSelected) && (startOfSelected === startOfToday);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const fullDayMinStart = Math.max(0, earliestStart - 15);
    const fullDayMaxEnd = Math.max(fullDayMinStart + 60, latestEnd + 30);

    let initialStart = fullDayMinStart;
    if (isToday && (currentMins - earliestStart > 150)) {
      initialStart = Math.max(fullDayMinStart, currentMins - 40);
    }

    const initialEnd = Math.max(initialStart + 60, fullDayMaxEnd);
    const syncedXRange = [initialStart, initialEnd];
    const fullBoundsRange = [fullDayMinStart, fullDayMaxEnd];

    const primaryData = filtered.filter(d => !DIGITAL_NETWORKS.includes(d.TV_Network));
    const digitalData = filtered.filter(d => DIGITAL_NETWORKS.includes(d.TV_Network));

    renderChart('barChart', primaryData, false, syncedXRange, fullBoundsRange);
    renderChart('digitalChart', digitalData, true, syncedXRange, fullBoundsRange);
  }

  const LEAGUE_COLORS = {  // Add any future exact League overrides here
    "NCAA Football (Bowl)": "#2B5B84",
    "NCAA Football (CFP)": "#D4AF37",
    "NASCAR": "#E4002B",
    "Formula 1": "#fe1d00",
    "UFC": "#d20a0a",
    "TGL": "#164a6c",
    "WTGL": "#ec2c3f",
    "NHRA": "#ef3a43"
  };

  function getHomeTeamColor(matchup, league = "") {
    if (!matchup) return '#FFFFFF';

    const cleanLeague = league ? league.trim() : "";
    if (Object.prototype.hasOwnProperty.call(LEAGUE_COLORS, cleanLeague)) {
      return LEAGUE_COLORS[cleanLeague];
    }

    if (/\bArmy-Navy\b/.test(matchup)) return '#B22234';

    if (/\bBig Noon Kickoff\b/.test(matchup)) return '#002a54';
    if (/\bCollege GameDay\b/.test(matchup)) return '#f16722';
    if (/\bACC Huddle\b/.test(matchup)) return '#017684';
    if (/\bSEC Nation\b/.test(matchup)) return '#1d366c';
    if (/\bB1G Tailgate\b/.test(matchup)) return '#0f87c9';
    if (/\bCFP Rankings\b/.test(matchup)) return '#C28C19';

    
    if (/\bNCAA Tournament Selection Show\b/.test(matchup)) return '#0f7cc1';

    if (/\bLive From\b/.test(matchup)) return '#003a6f';
    if (/\bBreakfast\b/.test(matchup)) return '#593987';

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
  // 6. CHART RENDERING & VISUALIZATION (PLOTLY)
  // ===========================================================================

  function bindChartSyncListener(plotDiv, targetId, container) {
    if (!plotDiv || typeof plotDiv.on !== 'function') return;

    if (typeof plotDiv.removeAllListeners === 'function') {
      plotDiv.removeAllListeners('plotly_relayout');
    }

    plotDiv.on('plotly_relayout', function (eventData) {
      if (window._isSyncingCharts || !eventData) return;

      let r0 = eventData['xaxis.range[0]'];
      let r1 = eventData['xaxis.range[1]'];

      if ((r0 === undefined || r1 === undefined) && Array.isArray(eventData['xaxis.range'])) {
        r0 = eventData['xaxis.range'][0];
        r1 = eventData['xaxis.range'][1];
      }

      if (r0 !== undefined && r1 !== undefined) {
        window._isSyncingCharts = true;

        const minBound = container._minBound;
        const maxBound = container._maxBound;
        const totalBoundsSpan = maxBound - minBound;
        const span = Math.min(r1 - r0, totalBoundsSpan);
        let clamped = false;

        if (r0 < minBound) {
          r0 = minBound;
          r1 = minBound + span;
          clamped = true;
        } else if (r1 > maxBound) {
          r1 = maxBound;
          r0 = maxBound - span;
          clamped = true;
        }

        currentUserXRange = [r0, r1];

        const tasks = [];
        if (clamped) {
          tasks.push(Plotly.relayout(plotDiv, { 'xaxis.range': [r0, r1] }));
        }

        const otherId = (targetId === 'barChart') ? 'digitalChart' : 'barChart';
        const otherDiv = document.getElementById(otherId);
        if (otherDiv && otherDiv.data && otherDiv.data.length > 0 && otherDiv.layout) {
          tasks.push(Plotly.relayout(otherDiv, { 'xaxis.range': [r0, r1] }));
        }

        Promise.all(tasks).finally(() => {
          setTimeout(() => {
            window._isSyncingCharts = false;
          }, 30);
        });
      }
    });
  }

  function renderChart(targetId, data, isDigital = false, xAxisRange = [480, 1500], fullBoundsRange = null) {
    const container = document.getElementById(targetId);
    if (!container) return;

    if (!data || data.length === 0) {
      container.style.height = '120px';
      container._lastDragMode = null;
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

    const isNarrow = window.innerWidth < 1275;
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
        const teamHexColor = getHomeTeamColor(game.Matchup, game.League);
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

    const ROW_HEIGHT = 58;
    const TOP_MARGIN = 45;
    const BOTTOM_MARGIN = 29;
    
    const totalRows = yTicks.length;
    const calculatedPlotHeight = (totalRows * ROW_HEIGHT) + TOP_MARGIN + BOTTOM_MARGIN;

    container.style.height = `${calculatedPlotHeight}px`;

    const [rawRangeStart, rawRangeEnd] = xAxisRange;
    const [boundStart, boundEnd] = fullBoundsRange || xAxisRange;
    container._minBound = boundStart;
    container._maxBound = boundEnd;

    let rangeStart = rawRangeStart;
    let rangeEnd = rawRangeEnd;

    if (currentUserXRange) {
      const totalBoundsSpan = boundEnd - boundStart;
      const preservedSpan = Math.min(currentUserXRange[1] - currentUserXRange[0], totalBoundsSpan);
      rangeStart = Math.max(boundStart, Math.min(currentUserXRange[0], boundEnd - preservedSpan));
      rangeEnd = rangeStart + preservedSpan;
    } else if (isNarrow) {
      const visibleMinutes = isMobilePortrait
        ? 165
        : Math.max(240, Math.round(window.innerWidth * 0.36));

      rangeEnd = Math.min(rawRangeEnd, rangeStart + visibleMinutes);
    }

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

    const hasScrollableTimeline = (boundStart < rawRangeStart) || (boundEnd > rawRangeEnd);
    const allowHorizontalPan = isNarrow || hasScrollableTimeline;
    const desiredDragMode = allowHorizontalPan ? 'pan' : false;

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
      dragmode: desiredDragMode,
      xaxis: {
        fixedrange: !allowHorizontalPan,
        side: 'top',
        type: 'linear',
        range: [rangeStart, rangeEnd],
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

    const config = { responsive: true, displayModeBar: false, scrollZoom: false };

    const modeChanged = container._lastDragMode !== desiredDragMode;
    container._lastDragMode = desiredDragMode;
    const renderFn = modeChanged ? Plotly.newPlot : Plotly.react;

    renderFn(targetId, traces, layout, config).then(plotDiv => {
      bindChartSyncListener(plotDiv, targetId, container);
    });
  }

  // ===========================================================================
  // 7. OPTIMIZED LIVE TIME LINE TIMER & GLOBAL EVENT LISTENERS
  // ===========================================================================

  function updateLiveTimeLine() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedDateText = DOM.dateFilter ? DOM.dateFilter.value : "";
    if (!selectedDateText) return;

    let cleanSelected = selectedDateText.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '');
    if (!/\b20\d{2}\b/.test(cleanSelected)) cleanSelected = `${cleanSelected}, ${currentYear}`;
    const selectedDateParsed = new Date(cleanSelected);
    const startOfSelected = new Date(selectedDateParsed.getFullYear(), selectedDateParsed.getMonth(), selectedDateParsed.getDate()).getTime();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const isToday = !isNaN(startOfSelected) && (startOfSelected === startOfToday);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    ['barChart', 'digitalChart'].forEach(chartId => {
      const chartDiv = document.getElementById(chartId);
      if (chartDiv && chartDiv.layout) {
        if (isToday) {
          Plotly.relayout(chartId, { 'shapes[0].x0': currentMins, 'shapes[0].x1': currentMins });
        } else {
          Plotly.relayout(chartId, { 'shapes': [] });
        }
      }
    });
  }

  // Optimized lightweight 30-second live time line update (avoids full chart re-render)
  setInterval(updateLiveTimeLine, 30000);

  setInterval(() => {
    if (typeof refreshActiveCharts === 'function') {
      refreshActiveCharts();
    }
  }, 60000);

  let lastWindowWidth = window.innerWidth;
  let lastOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  let resizeTimer;

  function handleViewportChange() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      if (window.innerWidth !== lastWindowWidth || currentOrientation !== lastOrientation) {
        lastWindowWidth = window.innerWidth;
        lastOrientation = currentOrientation;
        currentUserXRange = null;
        window._isSyncingCharts = false;
      }
      applyFilters();
    }, 150);
  }

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);

});
