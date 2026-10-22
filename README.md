# Live Sports Broadcast Dashboard

An interactive, single-page web dashboard designed to simplify your daily live sports viewing experience each week. Built with **HTML5, CSS3, JavaScript (ES6+), Bootstrap 5**, and **Plotly.js**, this dashboard provides a sleek, dark-mode visual grid of broadcast and streaming schedules across major American professional sports leagues and collegiate athletics with real-time dynamic filtering.

![Live Sports Dashboard Banner](images/headerBanner.png)

---

## Live Demo

Check out the live interactive application hosted on GitHub Pages:  
👉 **[https://matthewkilleen0830.github.io/Sports-Viewing-Schedule/](https://matthewkilleen0830.github.io/Sports-Viewing-Schedule/)**

---

## ✨ Features & Functionality

- **Dual Synchronized Timelines**:
  * **National Broadcast Networks**: Visual timeline tracking major linear networks (e.g., CBS, FOX, ESPN, etc.).
  * **Streaming Providers**: Dedicated schedule tracking for digital-only streams (e.g., ESPN+, Peacock, Prime Video, etc.).
  * **Synchronized Bounds & Post-Game Filtering**: Both timeline charts automatically calculate intelligent x-axis bounds—starting at the earliest scheduled matchup and dynamically filtering out games 30 minutes after their completion time to eliminate dead air.
- **Comprehensive League & Professional Coverage**:
  * Integrates broad coverage across both major **American professional sports leagues** and **NCAA collegiate athletics**.
- **Fully Inter-Adaptive Filter Architecture**:
  * **Team Search Filter**: Adaptive real-time text input filter to quickly pinpoint specific teams across all schedules.
  * **Day/Date Selection**: Instant focus on specific days within the rolling dataset.
  * **Sports/League Toggle**: Multi-select filter with optimized default settings to minimize visual clutter on initial load.
  * **Ranked Teams Toggle**: One-click toggle to isolate ranked collegiate matchups.
  * **Game Time Slicer**: Dynamic multi-select filter adapting to active game start times.
  * **Conference Slicer**: Dynamic conference filter cross-adapting with active day, league, team, and time selections to eliminate dead-end choices.
- **API-Driven Data Pipeline**:
  * Powered by an automated data extraction and transformation pipeline that standardizes multi-sport schedules, handles time zone normalization (`America/Chicago`), transforms incoming data, passes validation checks, and aggregates live game datasets into `weekFull.csv`.
- **Art Deco Dark Theme**:
  * Clean, polished, custom CSS UI tailored with gold accents and responsive sidebar controls.
  * Custom team color branding and high-contrast timeline bars for seamless visual scanning.
- **Full Analytics Integration**:
  * Integrated **Google Analytics 4 (GA4)** for tracking real-time user activity, slicer interactions, and device metrics.
  * Configured with dual IPv4 & IPv6 internal traffic exclusion rules to keep development metrics clean.
- **SEO & Social Share Ready**:
  * Fully equipped with **Open Graph** and **Twitter Card** metadata for rich media link previews across iMessage, X, LinkedIn, and Discord.
  * Embedded **Schema.org (JSON-LD)** structured data for enhanced search engine indexing.

---

## 🛠️ Tech Stack & Libraries

| Category | Technology / Library |
| :--- | :--- |
| **Frontend Framework** | HTML5, Modern CSS3, JavaScript (Vanilla ES6+) |
| **UI Layout** | Bootstrap 5.3 |
| **Data Visualization** | Plotly.js |
| **Data Pipeline** | Python (API Extraction & Schedule Aggregation), Power Query (Transformation Rules) |
| **Hosting & Deployment**| GitHub Pages |
| **Analytics** | Google Analytics 4 (gtag.js) |
| **Typography & Assets**| Google Fonts, Custom SVG Icons |

---

## 📁 Repository Structure

```text
├── currentWeek/          # Active schedule data directory
│   └── weekFull.csv      # API-aggregated rolling matchup dataset
├── images/               # Visual asset directory
│   ├── favicon.png       # Browser favicon icon
│   └── headerBanner.png  # Dashboard header banner & Open Graph preview image
├── gameDashboard.js      # Inter-adaptive filter logic, timeline synchronization, and Plotly rendering
├── index.html            # Main HTML entry point with layout & SEO metadata
├── README.md             # Project documentation
├── styles.css            # Custom dark-theme styling, animations & responsive rules
└── teamColors.js         # Key-value map of team names to hex color codes
