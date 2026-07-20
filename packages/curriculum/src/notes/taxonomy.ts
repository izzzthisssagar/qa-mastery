/**
 * The Notes wiki taxonomy — a reference encyclopedia separate from the lesson
 * curriculum. This is the single source of truth for the module → chapter →
 * topic tree across every QA domain. A topic with `planned: true` is a stub the
 * tree shows but no MDX file backs yet; the notes test asserts every leaf is
 * either backed by a file OR marked planned, so content fills in incrementally
 * and CI never breaks on a gap.
 *
 * Slugs are kebab-case and stable — the URL is /notes/<module>/<chapter>/<topic>.
 */

export interface NoteTopic {
  slug: string;
  title: string;
  /** Stub with no MDX yet — rendered greyed-out, excluded from the search index. */
  planned?: boolean;
}

export interface NoteChapter {
  slug: string;
  title: string;
  topics: NoteTopic[];
}

export interface NoteModule {
  slug: string;
  title: string;
  summary: string;
  chapters: NoteChapter[];
}

export const NOTES_TAXONOMY: readonly NoteModule[] = [
  // ── Track A · Computer & Digital Foundations — Module 1 (curriculum v4.1).
  // First module of the from-zero learning path; the full 48-module taxonomy
  // lands module by module as content is written (topic 1 is the approved
  // mentor-format reference note).
  {
    slug: "how-a-computer-works",
    title: "How a computer works",
    summary: "Absolute zero — the physical parts of a computer, what each one does, and how software comes alive on them.",
    chapters: [
      {
        slug: "the-parts-of-a-computer",
        title: "The parts of a computer",
        topics: [
          { slug: "tower-and-laptop-anatomy", title: "Tower & laptop anatomy" },
          { slug: "monitor-keyboard-mouse", title: "Monitor, keyboard, mouse" },
          { slug: "ports-and-cables", title: "Ports & cables" },
          { slug: "turning-it-on-safely", title: "Turning it on safely" },
        ],
      },
      {
        slug: "cpu-memory-and-storage",
        title: "CPU, memory & storage",
        topics: [
          { slug: "what-the-cpu-does", title: "What the CPU does" },
          { slug: "ram-vs-storage", title: "RAM vs storage" },
          { slug: "ghz-gb-tb", title: "GHz, GB, TB" },
          { slug: "why-computers-slow-down", title: "Why computers slow down" },
        ],
      },
      {
        slug: "input-and-output-devices",
        title: "Input & output devices",
        topics: [
          { slug: "input-devices", title: "Input devices" },
          { slug: "output-devices", title: "Output devices" },
          { slug: "peripherals", title: "Peripherals" },
          { slug: "connecting-a-device", title: "Connecting a device" },
        ],
      },
      {
        slug: "how-software-runs",
        title: "How software runs",
        topics: [
          { slug: "hardware-vs-software", title: "Hardware vs software" },
          { slug: "programs-and-processes", title: "Programs & processes" },
          { slug: "booting-up", title: "Booting up" },
          { slug: "apps-vs-the-os", title: "Apps vs the OS" },
        ],
      },
      {
        slug: "types-of-computers",
        title: "Types of computers",
        topics: [
          { slug: "desktops-and-laptops", title: "Desktops & laptops" },
          { slug: "phones-and-tablets", title: "Phones & tablets" },
          { slug: "servers", title: "Servers" },
          { slug: "smart-devices", title: "Smart devices" },
        ],
      },
    ],
  },
  // ── Track A · Module 2 (curriculum v4.1).
  {
    slug: "operating-systems-and-files",
    title: "Operating systems & files",
    summary: "The software that runs the machine — desktops, files, installing things, and your first taste of the command line.",
    chapters: [
      {
        slug: "what-an-os-does",
        title: "What an OS does",
        topics: [
          { slug: "role-of-the-os", title: "Role of the OS" },
          { slug: "the-desktop-and-ui", title: "The desktop & UI" },
          { slug: "managing-hardware", title: "Managing hardware" },
          { slug: "common-os-tasks", title: "Common OS tasks" },
        ],
      },
      {
        slug: "windows-macos-and-linux",
        title: "Windows, macOS & Linux",
        topics: [
          { slug: "windows-tour", title: "Windows tour" },
          { slug: "macos-tour", title: "macOS tour" },
          { slug: "linux-and-open-source", title: "Linux & open source" },
          { slug: "choosing-one", title: "Choosing one" },
        ],
      },
      {
        slug: "files-folders-and-paths",
        title: "Files, folders & paths",
        topics: [
          { slug: "files-and-file-types", title: "Files & file types" },
          { slug: "folders-and-organizing", title: "Folders & organizing" },
          { slug: "file-paths", title: "File paths" },
          { slug: "search-and-shortcuts", title: "Search & shortcuts" },
        ],
      },
      {
        slug: "installing-and-managing-software",
        title: "Installing & managing software",
        topics: [
          { slug: "installing-apps", title: "Installing apps" },
          { slug: "updates", title: "Updates" },
          { slug: "uninstalling", title: "Uninstalling" },
          { slug: "app-stores-vs-downloads", title: "App stores vs downloads" },
        ],
      },
      {
        slug: "first-look-at-the-command-line",
        title: "First look at the command line",
        topics: [
          { slug: "what-a-terminal-is", title: "What a terminal is" },
          { slug: "basic-commands", title: "Basic commands" },
          { slug: "navigating-folders", title: "Navigating folders" },
          { slug: "why-testers-use-it", title: "Why testers use it" },
        ],
      },
    ],
  },
  {
    slug: "the-internet-and-the-web",
    title: "The internet & the web",
    summary: "How machines find each other, how a page arrives on your screen, and the request-response conversation underneath every bug you will ever file.",
    chapters: [
      {
        slug: "how-the-internet-works",
        title: "How the internet works",
        topics: [
          { slug: "networks-and-the-internet", title: "Networks & the internet" },
          { slug: "isps-and-connections", title: "ISPs & connections" },
          { slug: "ip-addresses", title: "IP addresses" },
          { slug: "wifi-vs-wired", title: "Wi-Fi vs wired" },
        ],
      },
      {
        slug: "browsers-and-page-loading",
        title: "Browsers & page loading",
        topics: [
          { slug: "what-a-browser-is", title: "What a browser is"  },
          { slug: "how-a-page-loads", title: "How a page loads"  },
          { slug: "tabs-history-bookmarks", title: "Tabs, history & bookmarks"  },
          { slug: "a-peek-at-dev-tools", title: "A peek at dev tools"  },
        ],
      },
      {
        slug: "client-server-and-http",
        title: "Client, server & HTTP",
        topics: [
          { slug: "client-vs-server", title: "Client vs server"  },
          { slug: "request-and-response", title: "Request & response"  },
          { slug: "http-in-plain-words", title: "HTTP in plain words"  },
          { slug: "what-a-site-is-made-of", title: "What a site is made of"  },
        ],
      },
      {
        slug: "what-the-cloud-is",
        title: "What \"the cloud\" is",
        topics: [
          { slug: "the-cloud-explained", title: "The cloud explained" },
          { slug: "cloud-storage", title: "Cloud storage" },
          { slug: "web-apps", title: "Web apps" },
          { slug: "saas", title: "SaaS" },
        ],
      },
      {
        slug: "domains-urls-and-hosting",
        title: "Domains, URLs & hosting",
        topics: [
          { slug: "anatomy-of-a-url", title: "Anatomy of a URL" },
          { slug: "domains-and-dns", title: "Domains & DNS" },
          { slug: "hosting", title: "Hosting" },
          { slug: "https-and-the-padlock", title: "HTTPS & the padlock" },
        ],
      },
    ],
  },
  {
    slug: "the-web-platform-for-testers",
    title: "The web platform for testers",
    summary: "Reading HTML, CSS and JavaScript is a tester superpower: the DOM is where locators live, the box model is why layouts break, and a stack trace is bug evidence.",
    chapters: [
      {
        slug: "html-essentials",
        title: "HTML essentials",
        topics: [
          { slug: "structure-and-semantic-tags", title: "Structure & semantic tags" },
          { slug: "forms-and-inputs", title: "Forms & inputs" },
          { slug: "ids-classes-and-attributes", title: "Ids, classes & attributes" },
          { slug: "why-semantics-matter", title: "Why semantics matter" },
        ],
      },
      {
        slug: "css-essentials",
        title: "CSS essentials",
        topics: [
          { slug: "selectors-the-locator-superpower", title: "Selectors — the locator superpower" },
          { slug: "the-box-model", title: "The box model" },
          { slug: "flexbox-and-grid", title: "Flexbox & grid, gently" },
          { slug: "why-layouts-break", title: "Why layouts break" },
        ],
      },
      {
        slug: "javascript-for-readers",
        title: "JavaScript for readers",
        topics: [
          { slug: "what-js-does-on-a-page", title: "What JS does on a page" },
          { slug: "events-and-handlers", title: "Events & handlers" },
          { slug: "async-and-loading", title: "Async & loading, gently"  },
          { slug: "reading-errors-and-stack-traces", title: "Reading errors & stack traces"  },
        ],
      },
      {
        slug: "how-browsers-render",
        title: "How browsers render",
        topics: [
          { slug: "dom-and-the-render-tree", title: "DOM & the render tree"  },
          { slug: "reflow-and-repaint", title: "Reflow & repaint, gently"  },
          { slug: "network-plus-render", title: "Network + render = page load"  },
          { slug: "core-web-vitals-awareness", title: "Core Web Vitals awareness"  },
        ],
      },
    ],
  },
  {
    slug: "digital-literacy-and-safety",
    title: "Digital literacy & safety",
    summary: "Accounts, passwords, phishing, the keyboard and the everyday tools. The unglamorous skills that decide whether you can be trusted with production access.",
    chapters: [
      {
        slug: "accounts-passwords-and-2fa",
        title: "Accounts, passwords & 2FA",
        topics: [
          { slug: "accounts-and-sign-in", title: "Accounts & sign-in" },
          { slug: "strong-passwords", title: "Strong passwords" },
          { slug: "password-managers", title: "Password managers" },
          { slug: "two-factor-auth", title: "Two-factor auth" },
        ],
      },
      {
        slug: "staying-safe-online",
        title: "Staying safe online",
        topics: [
          { slug: "phishing-and-scams", title: "Phishing & scams" },
          { slug: "safe-downloads", title: "Safe downloads" },
          { slug: "privacy-basics", title: "Privacy basics" },
          { slug: "updates-and-antivirus", title: "Updates & antivirus" },
        ],
      },
      {
        slug: "keyboard-and-typing",
        title: "Keyboard & typing",
        topics: [
          { slug: "keyboard-layout", title: "Keyboard layout" },
          { slug: "shortcuts", title: "Shortcuts" },
          { slug: "touch-typing", title: "Touch typing" },
          { slug: "efficiency-tips", title: "Efficiency tips" },
        ],
      },
      {
        slug: "everyday-tools",
        title: "Everyday tools",
        topics: [
          { slug: "documents", title: "Documents" },
          { slug: "spreadsheets", title: "Spreadsheets" },
          { slug: "email", title: "Email" },
          { slug: "collaboration-tools", title: "Collaboration tools" },
        ],
      },
    ],
  },
  {
    slug: "programming-basics",
    title: "Programming basics",
    summary: "The logic and coding foundation a tester needs before automating — taught in Java and Python side by side.",
    chapters: [
      {
        slug: "what-is-code-and-a-program",
        title: "What is code & a program",
        topics: [
          { slug: "what-code-is", title: "What code is" },
          { slug: "languages-overview", title: "Languages overview" },
          { slug: "java-vs-python-for-beginners", title: "Java vs Python for beginners" },
          { slug: "your-first-program", title: "Your first program" },
        ],
      },
      {
        slug: "variables-and-data-types",
        title: "Variables & data types",
        topics: [
          { slug: "variables", title: "Variables" },
          { slug: "numbers-text-booleans", title: "Numbers, text, booleans" },
          { slug: "types-in-java-and-python", title: "Types in Java & Python" },
          { slug: "naming", title: "Naming" },
        ],
      },
      {
        slug: "operators-and-expressions",
        title: "Operators & expressions",
        topics: [
          { slug: "arithmetic", title: "Arithmetic" },
          { slug: "comparison", title: "Comparison" },
          { slug: "logical-operators", title: "Logical operators" },
          { slug: "expressions", title: "Expressions" },
        ],
      },
      {
        slug: "input-and-output",
        title: "Input & output",
        topics: [
          { slug: "printing-output", title: "Printing output" },
          { slug: "reading-input", title: "Reading input" },
          { slug: "comments", title: "Comments" },
          { slug: "formatting", title: "Formatting" },
        ],
      },
    ],
  },
  {
    slug: "logic-and-control-flow",
    title: "Logic & control flow",
    summary: "Conditions, loops and functions — the control structures that turn a straight list of statements into a program that decides, repeats and reuses.",
    chapters: [
      {
        slug: "conditions",
        title: "Conditions",
        topics: [
          { slug: "if-else", title: "if / else" },
          { slug: "comparison-and-logic", title: "Comparison & logic" },
          { slug: "nested-conditions", title: "Nested conditions" },
          { slug: "switch-and-match", title: "switch / match" },
        ],
      },
      {
        slug: "loops",
        title: "Loops",
        topics: [
          { slug: "for-loops", title: "for loops" },
          { slug: "while-loops", title: "while loops" },
          { slug: "break-and-continue", title: "break & continue" },
          { slug: "iterating-collections", title: "Iterating collections" },
        ],
      },
      {
        slug: "functions",
        title: "Functions",
        topics: [
          { slug: "defining-functions", title: "Defining functions" },
          { slug: "parameters-and-return", title: "Parameters & return" },
          { slug: "scope", title: "Scope" },
          { slug: "reuse-and-dry", title: "Reuse & DRY" },
        ],
      },
      {
        slug: "first-bugs-and-debugging",
        title: "First bugs & debugging",
        topics: [
          { slug: "reading-errors", title: "Reading errors" },
          { slug: "print-debugging", title: "Print debugging" },
          { slug: "using-a-debugger", title: "Using a debugger" },
          { slug: "common-mistakes", title: "Common mistakes" },
        ],
      },
    ],
  },
  {
    slug: "working-with-data",
    title: "Working with data",
    summary: "The three shapes almost all data comes in — text, lists, and key–value pairs — and the everyday operations and small algorithms a tester uses to pull them apart and check them.",
    chapters: [
      {
        slug: "strings-and-text",
        title: "Strings & text",
        topics: [
          { slug: "string-basics", title: "String basics" },
          { slug: "common-string-methods", title: "Common string methods" },
          { slug: "string-formatting", title: "String formatting" },
          { slug: "string-parsing", title: "String parsing" },
        ],
      },
      {
        slug: "lists-and-arrays",
        title: "Lists & arrays",
        topics: [
          { slug: "creating-lists", title: "Creating lists" },
          { slug: "add-and-remove", title: "Add & remove" },
          { slug: "iterating-and-searching", title: "Iterating & searching" },
          { slug: "sorting-lists", title: "Sorting lists" },
        ],
      },
      {
        slug: "key-value-data",
        title: "Key–value data",
        topics: [
          { slug: "maps-and-dictionaries", title: "Maps & dictionaries" },
          { slug: "objects", title: "Objects" },
          { slug: "nesting", title: "Nesting" },
          { slug: "when-to-use-which", title: "When to use which" },
        ],
      },
      {
        slug: "simple-algorithms",
        title: "Simple algorithms",
        topics: [
          { slug: "problem-solving-steps", title: "Problem-solving steps" },
          { slug: "looping-over-data", title: "Looping over data" },
          { slug: "basic-sort-and-search", title: "Basic sort & search" },
          { slug: "practice-katas", title: "Practice katas" },
        ],
      },
    ],
  },
  {
    slug: "a-first-language-deeper",
    title: "A first language, deeper",
    summary: "Set up a real development environment and go deeper into Java and Python — syntax, object-oriented basics, collections, and exceptions — the working vocabulary of automation code.",
    chapters: [
      {
        slug: "setup-and-ide",
        title: "Setup & IDE",
        topics: [
          { slug: "installing-the-jdk", title: "Installing the JDK" },
          { slug: "installing-python", title: "Installing Python" },
          { slug: "intellij-and-vscode", title: "IntelliJ and VS Code" },
          { slug: "running-programs", title: "Running programs" },
        ],
      },
      {
        slug: "syntax-essentials",
        title: "Syntax essentials",
        topics: [
          { slug: "java-syntax-tour", title: "Java syntax tour" },
          { slug: "python-syntax-tour", title: "Python syntax tour" },
          { slug: "key-differences", title: "Key differences" },
          { slug: "style-conventions", title: "Style conventions" },
        ],
      },
      {
        slug: "object-oriented-basics",
        title: "Object-oriented basics",
        topics: [
          { slug: "classes-and-objects", title: "Classes and objects" },
          { slug: "methods-and-fields", title: "Methods and fields" },
          { slug: "inheritance", title: "Inheritance" },
          { slug: "encapsulation", title: "Encapsulation" },
        ],
      },
      {
        slug: "collections-and-exceptions",
        title: "Collections & exceptions",
        topics: [
          { slug: "lists-maps-sets", title: "Lists, maps & sets" },
          { slug: "exceptions-and-try-catch", title: "Exceptions & try/catch" },
          { slug: "file-io", title: "File I/O" },
          { slug: "packages-and-modules", title: "Packages & modules" },
        ],
      },
    ],
  },
  {
    slug: "version-control-with-git",
    title: "Version control with Git",
    summary: "Why version control exists, the everyday Git workflow, GitHub collaboration — and the tester's superpower: reading diffs and spotting risky changes before they ship.",
    chapters: [
      {
        slug: "why-version-control",
        title: "Why version control",
        topics: [
          { slug: "the-problem-it-solves", title: "The problem it solves" },
          { slug: "what-git-is", title: "What Git is" },
          { slug: "repositories", title: "Repositories" },
          { slug: "local-vs-remote", title: "Local vs remote" },
        ],
      },
      {
        slug: "git-basics",
        title: "Git basics",
        topics: [
          { slug: "init-and-clone", title: "init & clone" },
          { slug: "add-and-commit", title: "add & commit" },
          { slug: "status-and-log", title: "status & log" },
          { slug: "gitignore", title: ".gitignore" },
        ],
      },
      {
        slug: "branches-and-merging",
        title: "Branches & merging",
        topics: [
          { slug: "branches", title: "Branches" },
          { slug: "switching", title: "Switching branches" },
          { slug: "merging", title: "Merging" },
          { slug: "resolving-conflicts", title: "Resolving conflicts" },
        ],
      },
      {
        slug: "github-and-pull-requests",
        title: "GitHub & pull requests",
        topics: [
          { slug: "pushing-to-github", title: "Pushing to GitHub" },
          { slug: "pull-requests", title: "Pull requests" },
          { slug: "code-review", title: "Code review" },
          { slug: "collaboration-flow", title: "The collaboration flow" },
        ],
      },
      {
        slug: "reading-code-as-a-tester",
        title: "Reading code as a tester",
        topics: [
          { slug: "reading-a-diff", title: "Reading a diff" },
          { slug: "understanding-blast-radius", title: "Understanding blast radius" },
          { slug: "white-box-awareness", title: "White-box awareness" },
          { slug: "spotting-risky-changes", title: "Spotting risky changes" },
        ],
      },
    ],
  },
  {
    slug: "linux-for-testers",
    title: "Linux for testers",
    summary: "The server-side survival kit — shell fluency, everyday commands, log investigation, remote servers, permissions and processes, and the first bash scripts that automate a tester's repetitive checks.",
    chapters: [
      {
        slug: "linux-essentials",
        title: "Linux essentials",
        topics: [
          { slug: "why-servers-run-linux", title: "Why servers run Linux" },
          { slug: "distros-and-the-filesystem", title: "Distros & the filesystem" },
          { slug: "the-shell-properly", title: "The shell, properly" },
          { slug: "man-pages-and-getting-help", title: "man pages & getting help" },
        ],
      },
      {
        slug: "everyday-commands",
        title: "Everyday commands",
        topics: [
          { slug: "navigating-and-managing-files", title: "Navigating & managing files" },
          { slug: "find-and-wildcards", title: "find & wildcards" },
          { slug: "viewing-files", title: "Viewing files" },
          { slug: "pipes-and-redirection", title: "Pipes & redirection" },
        ],
      },
      {
        slug: "logs-and-investigation",
        title: "Logs & investigation",
        topics: [
          { slug: "tail-f-a-live-log", title: "tail -f a live log" },
          { slug: "grep-and-basic-regex", title: "grep & basic regex" },
          { slug: "cut-sort-uniq-wc", title: "cut, sort, uniq, wc" },
          { slug: "from-log-line-to-bug-report", title: "From log line to bug report" },
        ],
      },
      {
        slug: "remote-servers",
        title: "Remote servers",
        topics: [
          { slug: "ssh-and-keys", title: "SSH & keys" },
          { slug: "scp-and-rsync", title: "scp & rsync" },
          { slug: "tmux-basics", title: "tmux basics" },
          { slug: "collecting-evidence-remotely", title: "Collecting evidence remotely" },
        ],
      },
      {
        slug: "permissions-and-processes",
        title: "Permissions & processes",
        topics: [
          { slug: "chmod-and-chown", title: "chmod & chown" },
          { slug: "ps-top-kill", title: "ps, top, kill" },
          { slug: "disk-and-memory", title: "Disk & memory" },
          { slug: "environment-variables", title: "Environment variables" },
        ],
      },
      {
        slug: "bash-scripting-for-qa",
        title: "Bash scripting for QA",
        topics: [
          { slug: "variables-ifs-and-loops", title: "Variables, ifs & loops" },
          { slug: "your-first-useful-script", title: "Your first useful script" },
          { slug: "cron-scheduling", title: "cron scheduling" },
          { slug: "automating-repetitive-checks", title: "Automating repetitive checks" },
        ],
      },
    ],
  },
  // ── Track C · QA & Manual Testing — Module 12 (curriculum v4). Chapters are
  // auto-reconciled from disk while M12 drafting is in flight; hand-finalize
  // order at gate time. Full shape = 7 chapters x 4 topics. Supersedes the
  // legacy "foundations" module below — retirement pending Sajan's call.
  // BEGIN qa-foundations
  {
    slug: "qa-foundations",
    title: "QA foundations",
    summary: "How professional testing thinks — what QA is, where it came from, why it matters, the seven principles, the tester's mind, and where testing fits in how software gets built.",
    chapters: [
      {
        slug: "what-is-qa",
        title: "What is QA",
        topics: [
          { slug: "qa-vs-qc-vs-testing", title: "QA vs QC vs testing" },
          { slug: "the-testers-mindset", title: "The tester's mindset" },
          { slug: "quality-defined", title: "Quality, defined" },
          { slug: "roles-on-a-team", title: "Roles on a team" },
        ],
      },
      {
        slug: "where-qa-came-from",
        title: "Where QA came from",
        topics: [
          { slug: "the-1947-moth-story", title: "The 1947 moth story" },
          { slug: "five-eras-debugging-to-prevention", title: "Five eras: debugging to prevention" },
          { slug: "the-pioneers-and-their-big-ideas", title: "The pioneers and their big ideas" },
          { slug: "how-agile-devops-and-ai-reshaped-qa", title: "How agile, DevOps, and AI reshaped QA" },
        ],
      },
      {
        slug: "why-testing-matters",
        title: "Why testing matters",
        topics: [
          { slug: "cost-of-defects", title: "The cost of defects" },
          { slug: "famous-failures", title: "Famous testing failures" },
          { slug: "risk-and-value", title: "Risk and value: what testing actually buys you" },
          { slug: "when-to-stop", title: "When to stop testing" },
        ],
      },
      {
        slug: "the-seven-principles",
        title: "The seven principles",
        topics: [
          { slug: "the-7-principles", title: "The 7 principles of testing" },
          { slug: "defect-clustering", title: "Defect clustering: the 80/20 of bugs" },
          { slug: "applying-them", title: "Applying the seven principles: a daily decision guide" },
          { slug: "testing-myths", title: "Testing myths that refuse to die" },
        ],
      },
      {
        slug: "the-testers-mind",
        title: "The tester's mind",
        topics: [
          { slug: "critical-thinking-for-testers", title: "Critical thinking for testers" },
          { slug: "cognitive-biases", title: "Cognitive biases in testing" },
          { slug: "curiosity-and-questioning", title: "Curiosity and questioning" },
          { slug: "psychology-of-tester-developer-relations", title: "The psychology of tester-developer relations" },
        ],
      },
      {
        slug: "sdlc-and-stlc",
        title: "SDLC & STLC",
        topics: [
          { slug: "sdlc-phases", title: "SDLC phases" },
          { slug: "stlc-phases", title: "STLC phases" },
          { slug: "where-testing-fits", title: "Where testing fits" },
          { slug: "entry-and-exit-criteria", title: "Entry & exit criteria" },
        ],
      },
      {
        slug: "models",
        title: "Models",
        topics: [
          { slug: "v-model", title: "The V-model" },
          { slug: "choosing-a-model", title: "Choosing a model: there's no silver bullet" },
          { slug: "waterfall", title: "Waterfall model" },
          { slug: "agile", title: "Agile model" },
        ],
      },    ],
  },
  // END qa-foundations
  // BEGIN browser-devtools-mastery
  {
    slug: "browser-devtools-mastery",
    title: "Browser DevTools mastery",
    summary: "The manual tester's home turf — inspecting the DOM, reading the console, dissecting network requests, throttling and emulation, storage and state, and Lighthouse audits, panel by panel.",
    chapters: [
      {
        slug: "elements-and-styles",
        title: "Elements & styles",
        topics: [
          { slug: "inspecting-the-dom", title: "Inspecting the DOM" },
          { slug: "editing-html-css-live", title: "Editing HTML & CSS live" },
          { slug: "finding-locators", title: "Finding locators" },
          { slug: "debugging-layout-and-spacing", title: "Debugging layout & spacing" },
        ],
      },
      {
        slug: "console",
        title: "Console",
        topics: [
          { slug: "reading-js-errors", title: "Reading JS errors" },
          { slug: "warnings-vs-errors", title: "Warnings vs errors" },
          { slug: "filtering-the-noise", title: "Filtering the noise" },
          { slug: "what-to-paste-into-a-bug-report", title: "What to paste into a bug report" },
        ],
      },
      {
        slug: "network",
        title: "Network",
        topics: [
          { slug: "anatomy-of-a-request", title: "Anatomy of a request" },
          { slug: "status-timing-and-headers", title: "Status, timing & headers" },
          { slug: "copy-as-curl", title: "Copy as cURL" },
          { slug: "har-export-as-bug-evidence", title: "HAR export as bug evidence" },
        ],
      },
      {
        slug: "throttling-and-emulation",
        title: "Throttling & emulation",
        topics: [
          { slug: "slow-3g-and-offline-mode", title: "Slow 3G & offline mode" },
          { slug: "device-emulation", title: "Device emulation" },
          { slug: "geolocation-and-sensors", title: "Geolocation & sensors" },
          { slug: "testing-what-users-really-feel", title: "Testing what users really feel" },
        ],
      },
      {
        slug: "application-and-storage",
        title: "Application & storage",
        topics: [
          { slug: "cookies-and-local-storage", title: "Cookies & local storage" },
          { slug: "session-and-cache", title: "Session & cache" },
          { slug: "clearing-state-properly", title: "Clearing state properly" },
          { slug: "service-workers-gently", title: "Service workers, gently" },
        ],
      },
      {
        slug: "audits-and-performance",
        title: "Audits & performance",
        topics: [
          { slug: "lighthouse-reports", title: "Lighthouse reports" },
          { slug: "accessibility-signals", title: "Accessibility signals" },
          { slug: "performance-recording-gently", title: "Performance recording, gently" },
          { slug: "when-to-escalate-to-devs", title: "When to escalate to devs" },
        ],
      },
    ],
  },
  // END browser-devtools-mastery
  // BEGIN test-design-techniques
  {
    slug: "test-design-techniques",
    title: "Test design techniques",
    summary: "The five techniques that turn 'test everything' into a manageable, defensible set of cases — equivalence partitioning, boundary value analysis, decision tables, state transition testing, and error guessing, each with a worked example you can reuse verbatim.",
    chapters: [
      {
        slug: "equivalence-partitioning",
        title: "Equivalence partitioning",
        topics: [
          { slug: "valid-and-invalid-classes", title: "Valid & invalid classes" },
          { slug: "picking-representatives", title: "Picking representatives" },
          { slug: "ep-worked-example", title: "Worked example" },
          { slug: "ep-pitfalls", title: "Pitfalls" },
        ],
      },
      {
        slug: "boundary-value-analysis",
        title: "Boundary value analysis",
        topics: [
          { slug: "why-edges-fail", title: "Why edges fail" },
          { slug: "two-and-three-value-bva", title: "2- & 3-value BVA" },
          { slug: "bva-worked-example", title: "Worked example" },
          { slug: "combining-bva-with-ep", title: "Combining with EP" },
        ],
      },
      {
        slug: "decision-tables",
        title: "Decision tables",
        topics: [
          { slug: "conditions-and-actions", title: "Conditions & actions" },
          { slug: "building-a-decision-table", title: "Building a table" },
          { slug: "collapsing-rules", title: "Collapsing rules" },
          { slug: "decision-table-worked-example", title: "Worked example" },
        ],
      },
      {
        slug: "state-transition",
        title: "State transition",
        topics: [
          { slug: "states-and-events", title: "States & events" },
          { slug: "diagrams-and-tables", title: "Diagrams & tables" },
          { slug: "valid-vs-invalid-transitions", title: "Valid vs invalid" },
          { slug: "state-transition-worked-example", title: "Worked example" },
        ],
      },
      {
        slug: "error-guessing-and-use-cases",
        title: "Error guessing & use cases",
        topics: [
          { slug: "error-guessing-technique", title: "Error guessing" },
          { slug: "experience-based-testing", title: "Experience-based" },
          { slug: "use-case-testing-technique", title: "Use-case testing" },
          { slug: "exploratory-link", title: "Exploratory link" },
        ],
      },
    ],
  },
  // END test-design-techniques
  // BEGIN test-artifacts
  {
    slug: "test-artifacts",
    title: "Test artifacts",
    summary: "The documents a professional tester actually produces — scenarios and cases, plans and strategy, a traceability matrix, managed test data, and the discipline of turning an ambiguous requirement into something testable before you write a single case.",
    chapters: [
      {
        slug: "scenarios-and-cases",
        title: "Scenarios & cases",
        topics: [
          { slug: "scenarios-vs-cases", title: "Scenarios vs cases" },
          { slug: "anatomy-of-a-case", title: "Anatomy of a case" },
          { slug: "writing-good-cases", title: "Writing good cases" },
          { slug: "positive-and-negative-cases", title: "Positive & negative" },
        ],
      },
      {
        slug: "test-plans-and-strategy",
        title: "Test plans & strategy",
        topics: [
          { slug: "whats-in-a-plan", title: "What's in a plan" },
          { slug: "test-strategy", title: "Test strategy" },
          { slug: "plan-entry-and-exit-criteria", title: "Entry / exit criteria" },
          { slug: "lightweight-plans", title: "Lightweight plans" },
        ],
      },
      {
        slug: "traceability",
        title: "Traceability",
        topics: [
          { slug: "the-rtm", title: "The RTM" },
          { slug: "traceability-coverage", title: "Coverage" },
          { slug: "linking-to-requirements", title: "Linking to requirements" },
          { slug: "finding-coverage-gaps", title: "Finding gaps" },
        ],
      },
      {
        slug: "test-data",
        title: "Test data",
        topics: [
          { slug: "what-test-data-is", title: "What test data is" },
          { slug: "preparing-test-data", title: "Preparing data" },
          { slug: "data-driven-thinking", title: "Data-driven thinking" },
          { slug: "managing-test-data", title: "Managing data" },
        ],
      },
      {
        slug: "requirements-and-user-stories",
        title: "Testing requirements & user stories",
        topics: [
          { slug: "spotting-ambiguous-requirements", title: "Spotting ambiguous requirements" },
          { slug: "testable-acceptance-criteria", title: "Testable acceptance criteria" },
          { slug: "questioning-requirements-early", title: "Questioning requirements early" },
          { slug: "user-stories-and-three-amigos", title: "User stories & the three amigos" },
        ],
      },
    ],
  },
  // END test-artifacts
  // BEGIN levels-and-types-of-testing
  {
    slug: "levels-and-types-of-testing",
    title: "Levels & types of testing",
    summary: "The vocabulary that sorts every test you'll ever run — unit through acceptance, functional and regression, smoke and sanity, black-box through gray-box, and the static techniques that find defects before any code runs at all.",
    chapters: [
      {
        slug: "test-levels",
        title: "Test levels",
        topics: [
          { slug: "unit", title: "Unit" },
          { slug: "integration", title: "Integration" },
          { slug: "system", title: "System" },
          { slug: "acceptance-uat", title: "Acceptance (UAT)" },
        ],
      },
      {
        slug: "functional-and-regression",
        title: "Functional & regression",
        topics: [
          { slug: "functional-testing", title: "Functional testing" },
          { slug: "regression", title: "Regression" },
          { slug: "retest-vs-regression", title: "Retest vs regression" },
          { slug: "impact-analysis", title: "Impact analysis" },
        ],
      },
      {
        slug: "smoke-and-sanity",
        title: "Smoke & sanity",
        topics: [
          { slug: "smoke-testing", title: "Smoke testing" },
          { slug: "sanity-testing", title: "Sanity testing" },
          { slug: "when-to-run-each", title: "When to run each" },
          { slug: "build-acceptance", title: "Build acceptance" },
        ],
      },
      {
        slug: "box-and-approach",
        title: "Box & approach",
        topics: [
          { slug: "black-vs-white-box", title: "Black vs white box" },
          { slug: "gray-box", title: "Gray box" },
          { slug: "static-vs-dynamic", title: "Static vs dynamic" },
          { slug: "positive-and-negative", title: "Positive / negative" },
        ],
      },
      {
        slug: "static-testing-and-reviews",
        title: "Static testing & reviews",
        topics: [
          { slug: "static-vs-dynamic-properly", title: "Static vs dynamic, properly" },
          { slug: "reviews-informal-to-walkthrough-to-inspection", title: "Reviews: informal → walkthrough → inspection" },
          { slug: "static-analysis-tools", title: "Static analysis tools" },
          { slug: "review-checklists-that-work", title: "Review checklists that work" },
        ],
      },
    ],
  },
  // END levels-and-types-of-testing
  {
    slug: "exploratory-testing",
    title: "Exploratory Testing",
    summary: "Testing that designs, executes, and learns in the same breath — the mindset, the session-based discipline that makes it accountable, the heuristics and tours that give it structure, and the reporting habits that turn a session's findings into evidence a team and its managers can actually trust.",
    chapters: [
      {
        slug: "the-exploratory-mindset",
        title: "The exploratory mindset",
        topics: [
          { slug: "scripted-vs-exploratory", title: "Scripted vs exploratory" },
          { slug: "exploratory-not-ad-hoc", title: "Not ad hoc testing" },
          { slug: "learn-design-execute-at-once", title: "Learn, design, execute at once" },
          { slug: "when-exploratory-wins", title: "When exploratory wins" },
        ],
      },
      {
        slug: "session-based-test-management",
        title: "Session-based test management",
        topics: [
          { slug: "time-boxed-sessions", title: "Time-boxed sessions" },
          { slug: "charters", title: "Charters" },
          { slug: "note-taking-under-pressure", title: "Note-taking under pressure" },
          { slug: "debriefing-and-coverage", title: "Debriefing and coverage" },
        ],
      },
      {
        slug: "heuristics-and-tours",
        title: "Heuristics & tours",
        topics: [
          { slug: "testing-heuristics-sfdpot", title: "SFDPOT" },
          { slug: "tours-the-feature-tour-and-money-tour", title: "Testing tours" },
          { slug: "oracles-how-you-know-its-a-bug", title: "Oracles" },
          { slug: "cheat-sheets-that-travel", title: "Cheat sheets that travel" },
        ],
      },
      {
        slug: "reporting-exploratory-work",
        title: "Reporting exploratory work",
        topics: [
          { slug: "bugs-and-coverage-from-a-session", title: "Bugs and coverage from a session" },
          { slug: "pairing-and-ensemble-testing", title: "Pairing and ensemble testing" },
          { slug: "making-it-visible-to-managers", title: "Making it visible to managers" },
          { slug: "when-to-switch-to-scripted", title: "When to switch to scripted" },
        ],
      },
    ],
  },
  // END exploratory-testing
  {
    slug: "defect-management",
    title: "Defect Management",
    summary: "How a reported problem becomes a tracked, resolved defect — the named states and workflow it moves through, how to write a report a developer trusts, how severity and priority get decided, and the tools teams run it all in.",
    chapters: [
      {
        slug: "the-bug-life-cycle",
        title: "The bug life cycle",
        topics: [
          { slug: "states-of-a-bug", title: "States of a bug" },
          { slug: "the-workflow", title: "The workflow" },
          { slug: "reopen-and-duplicate", title: "Reopen & duplicate" },
          { slug: "triage", title: "Triage" },
        ],
      },
      {
        slug: "writing-bug-reports",
        title: "Writing bug reports",
        topics: [
          { slug: "anatomy-of-a-report", title: "Anatomy of a report" },
          { slug: "repro-steps", title: "Repro steps" },
          { slug: "evidence", title: "Evidence" },
          { slug: "clarity", title: "Clarity" },
        ],
      },
      {
        slug: "severity-vs-priority",
        title: "Severity vs priority",
        topics: [
          { slug: "severity", title: "Severity" },
          { slug: "priority", title: "Priority" },
          { slug: "combinations", title: "Combinations" },
          { slug: "who-sets-what", title: "Who sets what" },
        ],
      },
      {
        slug: "tools",
        title: "Tools",
        topics: [
          { slug: "jira-basics", title: "JIRA basics" },
          { slug: "bugzilla", title: "Bugzilla" },
          { slug: "test-management-tools", title: "Test management tools" },
          { slug: "dashboards", title: "Dashboards" },
        ],
      },
    ],
  },
  // END defect-management
  {
    slug: "testers-toolbox",
    title: "The Tester's Toolbox",
    summary: "The browser extensions and small free tools working testers actually reach for — organized by tool family (specific tools rotate, the families don't), each taught as how, what, when and why, with its 2026 status verified.",
    chapters: [
      {
        slug: "edge-case-and-form-data",
        title: "Edge-case & form data",
        topics: [
          { slug: "bug-magnet-tricky-inputs", title: "Bug Magnet & tricky inputs" },
          { slug: "form-fillers", title: "Form fillers" },
          { slug: "test-credit-cards-and-emails", title: "Test credit cards & emails" },
          { slug: "generating-data-mockaroo-and-faker", title: "Generating data: Mockaroo & Faker" },
        ],
      },
      {
        slug: "link-page-ui-checks",
        title: "Link, page & UI checks",
        topics: [
          { slug: "check-my-links", title: "Check My Links" },
          { slug: "gofullpage-and-screenshots", title: "GoFullPage & screenshot tools" },
          { slug: "window-resizer-responsive-checks", title: "Window Resizer & responsive checks" },
          { slug: "whatfont-perfectpixel-page-ruler", title: "WhatFont, PerfectPixel & Page Ruler" },
        ],
      },
      {
        slug: "cookies-json-sessions",
        title: "Cookies, JSON & sessions",
        topics: [
          { slug: "cookie-editors", title: "Cookie editors" },
          { slug: "json-formatters", title: "JSON formatters" },
          { slug: "clear-cache", title: "Clear Cache" },
          { slug: "multi-account-testing", title: "Managing multi-account testing" },
        ],
      },
      {
        slug: "locator-and-recorder-helpers",
        title: "Locator & recorder helpers",
        topics: [
          { slug: "selectorshub", title: "SelectorsHub" },
          { slug: "css-selector-helpers", title: "CSS selector helpers" },
          { slug: "recorder-extensions", title: "Recorder extensions" },
          { slug: "from-recorder-to-real-script", title: "From recorder to real script" },
        ],
      },
      {
        slug: "accessibility-and-quality",
        title: "Accessibility & quality",
        topics: [
          { slug: "wave", title: "WAVE" },
          { slug: "axe-devtools", title: "axe DevTools" },
          { slug: "contrast-and-screen-reader-checks", title: "Contrast & screen-reader checks" },
          { slug: "lighthouse", title: "Lighthouse as an extension of QA" },
        ],
      },
      {
        slug: "beyond-the-browser",
        title: "Beyond the browser",
        topics: [
          { slug: "debugging-proxies", title: "Debugging proxies" },
          { slug: "email-testing", title: "Email testing" },
          { slug: "tunnels-and-sharing-localhost", title: "Tunnels & sharing localhost" },
          { slug: "screen-recorders-for-bug-repro", title: "Screen recorders for bug repro" },
        ],
      },
      {
        slug: "choosing-tools-wisely",
        title: "Choosing tools wisely",
        topics: [
          { slug: "how-what-when-why-framework", title: "The how / what / when / why framework" },
          { slug: "free-vs-paid-honestly", title: "Free vs paid, honestly" },
          { slug: "tool-sprawl-and-when-to-stop", title: "Tool sprawl & when to stop" },
          { slug: "keeping-your-kit-current", title: "Keeping your kit current" },
        ],
      },
    ],
  },
  // END testers-toolbox
  {
    slug: "ui-ux-design-qa",
    title: "UI/UX Design QA",
    summary: "Verifying the design, not just the function — the laws of usability that explain WHY something feels wrong, the color and type rules that make an interface readable, and the concrete discipline of checking a build against its Figma spec and flagging what devs will actually respect.",
    chapters: [
      {
        slug: "design-principles-and-the-laws-of-ux",
        title: "Design principles & the laws of UX",
        topics: [
          { slug: "nielsens-10-usability-heuristics", title: "Nielsen's 10 usability heuristics" },
          { slug: "fitts-hick-miller-and-jakob", title: "Fitts, Hick, Miller & Jakob" },
          { slug: "gestalt-principles", title: "Gestalt principles" },
          { slug: "heuristics-vs-laws", title: "Heuristics vs laws" },
        ],
      },
      {
        slug: "color-theory-for-testers",
        title: "Color theory for testers",
        topics: [
          { slug: "hue-saturation-and-value", title: "Hue, saturation & value" },
          { slug: "color-harmony", title: "Color harmony" },
          { slug: "contrast-and-wcag-ratios", title: "Contrast & WCAG ratios" },
          { slug: "color-blindness-and-semantic-color", title: "Color blindness & semantic color" },
        ],
      },
      {
        slug: "typography-and-spacing",
        title: "Typography & spacing",
        topics: [
          { slug: "type-hierarchy", title: "Type hierarchy" },
          { slug: "readable-line-lengths", title: "Readable line lengths" },
          { slug: "grids-and-the-8pt-system", title: "Grids & the 8pt system" },
          { slug: "alignment-and-white-space", title: "Alignment & white space" },
        ],
      },
      {
        slug: "design-qa-in-practice",
        title: "Design QA in practice",
        topics: [
          { slug: "reading-a-figma-spec", title: "Reading a Figma spec" },
          { slug: "pixel-perfect-vs-pragmatic", title: "Pixel-perfect vs pragmatic" },
          { slug: "checking-spacing-states-and-breakpoints", title: "Checking spacing, states & breakpoints" },
          { slug: "design-bugs-devs-respect", title: "Design bugs devs respect" },
        ],
      },
      {
        slug: "usability-evaluation",
        title: "Usability evaluation",
        topics: [
          { slug: "running-a-heuristic-evaluation", title: "Running a heuristic evaluation" },
          { slug: "usability-testing-basics", title: "Usability testing basics" },
          { slug: "microcopy-and-ux-writing-checks", title: "Microcopy & UX-writing checks" },
          { slug: "dark-patterns-to-flag", title: "Dark patterns to flag" },
        ],
      },
    ],
  },
  // END ui-ux-design-qa
  {
    slug: "api-testing-fundamentals",
    title: "API Testing Fundamentals",
    summary: "Manual API testing as a core skill, not an automation prerequisite — reading HTTP itself, the status-code/REST vocabulary, driving requests by hand with curl and Postman, the four auth shapes a tester actually meets, and hunting bugs with no UI in front of you.",
    chapters: [
      {
        slug: "http-for-testers",
        title: "HTTP for testers",
        topics: [
          { slug: "request-and-response-anatomy", title: "Request & response anatomy" },
          { slug: "http-methods", title: "Methods (GET/POST/PUT/DELETE)" },
          { slug: "headers-and-bodies", title: "Headers & bodies" },
          { slug: "json-and-xml", title: "JSON & XML" },
        ],
      },
      {
        slug: "status-codes-and-rest",
        title: "Status codes & REST",
        topics: [
          { slug: "status-code-families", title: "2xx / 4xx / 5xx families" },
          { slug: "rest-in-plain-words", title: "REST in plain words" },
          { slug: "idempotency-and-safety", title: "Idempotency & safety" },
          { slug: "reading-api-docs-and-swagger", title: "Reading API docs & Swagger" },
        ],
      },
      {
        slug: "postman-and-curl",
        title: "Postman & curl",
        topics: [
          { slug: "curl-basics", title: "curl basics" },
          { slug: "postman-requests", title: "Postman requests" },
          { slug: "collections-and-environments", title: "Collections & environments" },
          { slug: "postman-tests-and-variables", title: "Postman tests & variables" },
        ],
      },
      {
        slug: "auth-manually",
        title: "Auth, manually",
        topics: [
          { slug: "api-keys", title: "API keys" },
          { slug: "basic-auth", title: "Basic auth" },
          { slug: "bearer-and-jwt", title: "Bearer / JWT" },
          { slug: "oauth2-for-testers", title: "OAuth2, what a tester needs" },
        ],
      },
      {
        slug: "finding-api-bugs",
        title: "Finding API bugs",
        topics: [
          { slug: "testing-without-a-ui", title: "Testing without a UI" },
          { slug: "negative-api-tests", title: "Negative API tests" },
          { slug: "validating-against-the-spec", title: "Validating against the spec" },
          { slug: "your-first-api-bug-hunt", title: "Your first API bug hunt (BuggyAPI)" },
        ],
      },
    ],
  },
  // END api-testing-fundamentals
  {
    slug: "test-frameworks",
    title: "Test frameworks",
    summary: "The runner-level scaffolding underneath any automation suite — lifecycle hooks and annotations, real assertions vs soft ones, grouping and parameterizing tests, and feeding the same test real data from outside the code.",
    chapters: [
      {
        slug: "lifecycle-and-annotations",
        title: "Lifecycle & annotations",
        topics: [
          { slug: "setup-and-teardown-hooks", title: "Setup / teardown hooks" },
          { slug: "test-annotation", title: "@Test" },
          { slug: "testng-vs-junit", title: "TestNG vs JUnit" },
          { slug: "pytest-fixtures", title: "pytest fixtures" },
        ],
      },
      {
        slug: "assertions",
        title: "Assertions",
        topics: [
          { slug: "assertions-basics", title: "Assertions" },
          { slug: "soft-assertions", title: "Soft assertions" },
          { slug: "custom-messages", title: "Custom messages" },
          { slug: "matchers", title: "Matchers" },
        ],
      },
      {
        slug: "groups-and-parameters",
        title: "Groups & parameters",
        topics: [
          { slug: "grouping-tests", title: "Grouping tests" },
          { slug: "parameters", title: "Parameters" },
          { slug: "ordering", title: "Ordering" },
          { slug: "suites", title: "Suites" },
        ],
      },
      {
        slug: "data-driven-testing",
        title: "Data-driven testing",
        topics: [
          { slug: "data-providers", title: "Data providers" },
          { slug: "parameterized-tests", title: "Parameterized tests" },
          { slug: "external-data-csv-excel", title: "External data (CSV/Excel)" },
          { slug: "reuse", title: "Reuse" },
        ],
      },
    ],
  },
  // END test-frameworks
  {
    slug: "framework-design",
    title: "Framework design",
    summary: "Structuring an automation suite so it survives contact with a real, changing application — the Page Object Model, reusable base classes and driver factories, externalized config and test data, and logging/reporting that actually helps when a test fails.",
    chapters: [
      {
        slug: "page-object-model",
        title: "Page Object Model",
        topics: [
          { slug: "the-pom-pattern", title: "The POM pattern" },
          { slug: "page-classes", title: "Page classes" },
          { slug: "returning-pages", title: "Returning pages" },
          { slug: "component-objects", title: "Component objects" },
        ],
      },
      {
        slug: "reusable-components",
        title: "Reusable components",
        topics: [
          { slug: "base-classes", title: "Base classes" },
          { slug: "utilities", title: "Utilities" },
          { slug: "waits-wrapper", title: "Waits wrapper" },
          { slug: "driver-factory", title: "Driver factory" },
        ],
      },
      {
        slug: "config-and-data",
        title: "Config & data",
        topics: [
          { slug: "config-files", title: "Config files" },
          { slug: "environments", title: "Environments" },
          { slug: "test-data", title: "Test data" },
          { slug: "secrets", title: "Secrets" },
        ],
      },
      {
        slug: "logging-and-reporting",
        title: "Logging & reporting",
        topics: [
          { slug: "logging-log4j", title: "Logging (Log4j)" },
          { slug: "extentreports", title: "ExtentReports" },
          { slug: "allure", title: "Allure" },
          { slug: "screenshots-on-failure", title: "Screenshots on failure" },
        ],
      },
    ],
  },
  // END framework-design
  {
    slug: "bdd-with-cucumber",
    title: "BDD with Cucumber",
    summary: "Turning shared understanding into executable specification — Given/When/Then, Gherkin feature files, step definitions in Java and Python, and when living documentation actually earns its keep versus when it becomes overhead.",
    chapters: [
      {
        slug: "bdd-in-plain-words",
        title: "BDD in plain words",
        topics: [
          { slug: "what-bdd-solves", title: "What BDD solves" },
          { slug: "given-when-then", title: "Given / When / Then" },
          { slug: "bdd-vs-test-scripts", title: "BDD vs test scripts" },
          { slug: "the-three-amigos", title: "The three amigos" },
        ],
      },
      {
        slug: "gherkin-and-feature-files",
        title: "Gherkin & feature files",
        topics: [
          { slug: "writing-scenarios", title: "Writing scenarios" },
          { slug: "scenario-outlines-and-examples", title: "Scenario outlines & examples" },
          { slug: "backgrounds-and-tags", title: "Backgrounds & tags" },
          { slug: "good-vs-bad-gherkin", title: "Good vs bad Gherkin" },
        ],
      },
      {
        slug: "step-definitions",
        title: "Step definitions",
        topics: [
          { slug: "glue-code-java", title: "Glue code (Java)" },
          { slug: "behave-and-pytest-bdd-python", title: "behave / pytest-bdd (Python)" },
          { slug: "data-tables", title: "Data tables" },
          { slug: "hooks-and-context", title: "Hooks & context" },
        ],
      },
      {
        slug: "bdd-in-a-framework",
        title: "BDD in a framework",
        topics: [
          { slug: "cucumber-and-selenium", title: "Cucumber + Selenium" },
          { slug: "reports-and-living-documentation", title: "Reports & living documentation" },
          { slug: "when-bdd-helps", title: "When BDD helps" },
          { slug: "when-it-hurts", title: "When it hurts" },
        ],
      },
    ],
  },
  // END bdd-with-cucumber
  {
    slug: "playwright",
    title: "Playwright",
    summary: "Modern end-to-end browser automation in TypeScript — auto-waiting instead of manual sleeps, resilient user-facing locators, first-class tracing and debugging, real parallel/cross-browser runs, and visual regression testing.",
    chapters: [
      {
        slug: "setup-and-auto-waiting",
        title: "Setup & auto-waiting",
        topics: [
          { slug: "installing-playwright", title: "Installing Playwright" },
          { slug: "typescript-setup", title: "TypeScript setup" },
          { slug: "first-test", title: "First test" },
          { slug: "auto-waiting-explained", title: "Auto-waiting explained" },
        ],
      },
      {
        slug: "locators-and-fixtures",
        title: "Locators & fixtures",
        topics: [
          { slug: "user-facing-locators", title: "User-facing locators" },
          { slug: "getbyrole-label-testid", title: "getByRole / Label / TestId" },
          { slug: "fixtures", title: "Fixtures" },
          { slug: "test-isolation", title: "Test isolation" },
        ],
      },
      {
        slug: "tracing-and-debugging",
        title: "Tracing & debugging",
        topics: [
          { slug: "trace-viewer", title: "Trace viewer" },
          { slug: "codegen", title: "Codegen" },
          { slug: "debugging", title: "Debugging" },
          { slug: "screenshots-and-video", title: "Screenshots & video" },
        ],
      },
      {
        slug: "parallel-and-cross-browser",
        title: "Parallel & cross-browser",
        topics: [
          { slug: "projects-and-browsers", title: "Projects & browsers" },
          { slug: "parallelism-and-sharding", title: "Parallelism & sharding" },
          { slug: "retries", title: "Retries" },
          { slug: "config", title: "Config" },
        ],
      },
      {
        slug: "visual-regression-testing",
        title: "Visual regression testing",
        topics: [
          { slug: "pixel-vs-ai-diffing", title: "Pixel vs AI diffing" },
          { slug: "playwright-snapshots", title: "Playwright snapshots" },
          { slug: "percy-applitools-backstopjs", title: "Percy / Applitools / BackstopJS" },
          { slug: "taming-false-positives", title: "Taming false positives" },
        ],
      },
    ],
  },
  // END playwright
  {
    slug: "automation-in-cicd",
    title: "Automation in CI/CD",
    summary: "Make automated tests useful to the whole team — run them reliably in CI, configure GitHub Actions, Jenkins and GitLab pipelines, publish evidence, enforce quality gates, and manage flakes without hiding failures.",
    chapters: [
      {
        slug: "running-tests-in-ci",
        title: "Running tests in CI",
        topics: [
          { slug: "what-ci-is", title: "What CI is" },
          { slug: "running-the-suite", title: "Running the suite" },
          { slug: "headless-mode", title: "Headless mode" },
          { slug: "artifacts", title: "Artifacts" },
        ],
      },
      {
        slug: "github-actions",
        title: "GitHub Actions",
        topics: [
          { slug: "workflow-basics", title: "Workflow basics" },
          { slug: "triggers", title: "Triggers" },
          { slug: "matrix-runs", title: "Matrix runs" },
          { slug: "caching", title: "Caching" },
        ],
      },
      {
        slug: "jenkins",
        title: "Jenkins",
        topics: [
          { slug: "jobs-and-the-classic-ui", title: "Jobs & the classic UI" },
          { slug: "jenkinsfile-pipeline-as-code", title: "Jenkinsfile — pipeline as code" },
          { slug: "agents-and-plugins", title: "Agents & plugins" },
          { slug: "when-teams-still-pick-jenkins", title: "When teams still pick Jenkins" },
        ],
      },
      {
        slug: "gitlab-ci-and-quality-gates",
        title: "GitLab CI & quality gates",
        topics: [
          { slug: "stages-jobs-and-runners", title: "Stages, jobs & runners" },
          { slug: "gitlab-ci-yml", title: ".gitlab-ci.yml" },
          { slug: "quality-gates-coverage-and-sonar", title: "Quality gates (coverage, Sonar)" },
          { slug: "blocking-a-merge-on-failure", title: "Blocking a merge on failure" },
        ],
      },
      {
        slug: "scheduling-and-reporting",
        title: "Scheduling & reporting",
        topics: [
          { slug: "scheduled-runs", title: "Scheduled runs" },
          { slug: "publishing-reports", title: "Publishing reports" },
          { slug: "notifications", title: "Notifications" },
          { slug: "dashboards", title: "Dashboards" },
        ],
      },
      {
        slug: "flake-management",
        title: "Flake management",
        topics: [
          { slug: "detecting-flakes", title: "Detecting flakes" },
          { slug: "quarantine", title: "Quarantine" },
          { slug: "retries", title: "Retries" },
          { slug: "stability-practices", title: "Stability practices" },
        ],
      },
    ],
  },
  // END automation-in-cicd
  {
    slug: "api-test-automation",
    title: "API Test Automation",
    summary: "Move from manual API checks to maintainable automation with REST Assured, pytest and Requests, schema and contract testing, GraphQL and SOAP, Newman in CI, production-shaped suites, and controlled service virtualization.",
    chapters: [
      {
        slug: "rest-assured-java",
        title: "REST Assured (Java)",
        topics: [
          { slug: "setup-and-first-test", title: "Setup & first test" },
          { slug: "given-when-then-style", title: "Given / when / then style" },
          { slug: "validating-json-and-status", title: "Validating JSON & status" },
          { slug: "auth-in-rest-assured", title: "Auth in REST Assured" },
        ],
      },
      {
        slug: "python-api-testing",
        title: "Python API testing",
        topics: [
          { slug: "requests-and-pytest", title: "Requests + pytest" },
          { slug: "fixtures-for-apis", title: "Fixtures for APIs" },
          { slug: "parameterized-endpoint-tests", title: "Parameterized endpoint tests" },
          { slug: "sessions-and-auth", title: "Sessions & auth" },
        ],
      },
      {
        slug: "contract-and-schema-testing",
        title: "Contract & schema testing",
        topics: [
          { slug: "openapi-as-the-contract", title: "OpenAPI as the contract" },
          { slug: "schema-validation", title: "Schema validation" },
          { slug: "consumer-driven-contracts", title: "Consumer-driven contracts" },
          { slug: "breaking-change-detection", title: "Breaking-change detection" },
        ],
      },
      {
        slug: "graphql-and-soap-testing",
        title: "GraphQL & SOAP testing",
        topics: [
          { slug: "graphql-vs-rest", title: "How GraphQL differs from REST" },
          { slug: "queries-mutations-and-schema", title: "Queries, mutations & the schema" },
          { slug: "testing-a-graphql-api", title: "Testing a GraphQL API" },
          { slug: "soap-wsdl-when-you-meet-it", title: "SOAP/WSDL, when you meet it" },
        ],
      },
      {
        slug: "api-tests-in-ci-newman",
        title: "API tests in CI (Newman)",
        topics: [
          { slug: "running-postman-collections-headlessly", title: "Running Postman collections headlessly" },
          { slug: "newman-and-ci-pipeline", title: "Newman + CI pipeline" },
          { slug: "scheduled-api-regression", title: "Scheduled API regression" },
          { slug: "reporting-api-results", title: "Reporting API results" },
        ],
      },
      {
        slug: "real-world-api-suites",
        title: "Real-world API suites",
        topics: [
          { slug: "test-pyramids-for-apis", title: "Test pyramids for APIs" },
          { slug: "data-setup-via-api", title: "Data setup via API" },
          { slug: "chaining-and-state", title: "Chaining & state" },
          { slug: "full-api-suite-on-buggyapi", title: "Full API suite on BuggyAPI" },
        ],
      },
      {
        slug: "mocking-and-service-virtualization",
        title: "Mocking & service virtualization",
        topics: [
          { slug: "stubs-mocks-and-fakes", title: "Stubs, mocks & fakes" },
          { slug: "wiremock-hands-on", title: "WireMock hands-on" },
          { slug: "record-and-playback", title: "Record & playback" },
          { slug: "simulating-errors-latency-and-chaos", title: "Simulating errors, latency & chaos" },
        ],
      },
    ],
  },
  // END api-test-automation
  {
    slug: "relational-databases-engineer-level",
    title: "Relational Databases, Engineer-Level",
    summary: "Build production-grade relational database judgment through advanced SQL, schema design, indexing and execution plans, transaction concurrency, programmable database objects, and integrity verification at scale.",
    chapters: [
      {
        slug: "sql-mastery",
        title: "SQL mastery",
        topics: [
          { slug: "subqueries-and-ctes", title: "Subqueries & CTEs" },
          { slug: "window-functions", title: "Window functions" },
          { slug: "set-operators", title: "Set operators" },
          { slug: "date-time-and-timezone-handling", title: "Date, time & timezone handling" },
        ],
      },
      {
        slug: "schema-design",
        title: "Schema design",
        topics: [
          { slug: "er-modeling-from-requirements", title: "ER modeling from requirements" },
          { slug: "keys-and-relationships", title: "Keys & relationships" },
          { slug: "normalization-1nf-to-3nf", title: "Normalization: 1NF to 3NF" },
          { slug: "when-to-denormalize", title: "When to denormalize" },
        ],
      },
      {
        slug: "indexes-and-performance",
        title: "Indexes & performance",
        topics: [
          { slug: "how-an-index-works", title: "How an index works" },
          { slug: "clustered-vs-non-clustered", title: "Clustered vs non-clustered" },
          { slug: "reading-explain-and-execution-plans", title: "Reading EXPLAIN & execution plans" },
          { slug: "query-tuning-and-over-indexing-writes", title: "Query tuning & over-indexing writes" },
        ],
      },
      {
        slug: "transactions-and-concurrency",
        title: "Transactions & concurrency",
        topics: [
          { slug: "acid-properly", title: "ACID, properly" },
          { slug: "isolation-levels-and-anomalies", title: "Isolation levels & anomalies" },
          { slug: "locks-and-deadlocks", title: "Locks & deadlocks" },
          { slug: "testing-concurrent-behavior", title: "Testing concurrent behavior" },
        ],
      },
      {
        slug: "programmable-objects",
        title: "Programmable objects",
        topics: [
          { slug: "stored-procedures-and-functions", title: "Stored procedures & functions" },
          { slug: "triggers", title: "Triggers" },
          { slug: "testing-procedures", title: "Testing procedures" },
          { slug: "error-handling-in-sql", title: "Error handling in SQL" },
        ],
      },
      {
        slug: "data-integrity-at-scale",
        title: "Data integrity at scale",
        topics: [
          { slug: "constraints-and-referential-integrity", title: "Constraints & referential integrity" },
          { slug: "finding-orphans-and-duplicates", title: "Finding orphans & duplicates" },
          { slug: "migrations-and-etl-verification", title: "Migrations & ETL verification" },
          { slug: "auditing-data-changes", title: "Auditing data changes" },
        ],
      },
    ],
  },
  // END relational-databases-engineer-level
  {
    slug: "nosql-and-modern-data",
    title: "NoSQL & Modern Data",
    summary: "Choose and test non-relational data models honestly: document, key-value, graph, and wide-column trade-offs; MongoDB modeling; Redis cache failure modes; and distributed-data behavior.",
    chapters: [
      {
        slug: "the-nosql-landscape",
        title: "The NoSQL landscape",
        topics: [
          { slug: "document-key-value-graph-columnar", title: "Document, key-value, graph & columnar" },
          { slug: "sql-vs-nosql-choosing-honestly", title: "SQL vs NoSQL: choosing honestly" },
          { slug: "cap-theorem-in-plain-words", title: "CAP theorem in plain words" },
          { slug: "where-each-shines", title: "Where each shines" },
        ],
      },
      {
        slug: "mongodb-hands-on",
        title: "MongoDB hands-on",
        topics: [
          { slug: "documents-and-collections", title: "Documents & collections" },
          { slug: "crud-and-query-operators", title: "CRUD & query operators" },
          { slug: "embedding-vs-referencing", title: "Embedding vs referencing" },
          { slug: "aggregation-pipeline-gently", title: "Aggregation pipeline, gently" },
        ],
      },
      {
        slug: "redis-and-caching-bugs",
        title: "Redis & caching bugs",
        topics: [
          { slug: "what-caching-solves", title: "What caching solves" },
          { slug: "ttls-and-eviction", title: "TTLs & eviction" },
          { slug: "stale-data-bugs-and-cache-invalidation", title: "Stale-data bugs & cache invalidation" },
          { slug: "testing-around-a-cache", title: "Testing around a cache" },
        ],
      },
      {
        slug: "distributed-data-gently",
        title: "Distributed data, gently",
        topics: [
          { slug: "replication-and-sharding", title: "Replication & sharding" },
          { slug: "eventual-consistency-bugs", title: "Eventual-consistency bugs" },
          { slug: "backups-and-recovery-checks", title: "Backups & recovery checks" },
          { slug: "testing-data-pipelines", title: "Testing data pipelines" },
        ],
      },
    ],
  },
  // END nosql-and-modern-data
  {
    slug: "docker-and-containers-for-testers",
    title: "Docker & Containers for Testers",
    summary: "Eliminate environment guesswork with container fundamentals, practical Docker diagnostics, reproducible Dockerfiles and Compose stacks, and disposable infrastructure for automated tests and CI.",
    chapters: [
      {
        slug: "containers-in-plain-words",
        title: "Containers in plain words",
        topics: [
          { slug: "vm-vs-container", title: "VM vs container" },
          { slug: "images-containers-and-registries", title: "Images, containers & registries" },
          { slug: "why-qa-cares", title: "Why QA cares" },
          { slug: "install-and-first-run", title: "Install & first run" },
        ],
      },
      {
        slug: "docker-hands-on",
        title: "Docker hands-on",
        topics: [
          { slug: "run-exec-logs-and-stop", title: "Run / exec / logs / stop" },
          { slug: "ports-and-volumes", title: "Ports & volumes" },
          { slug: "environment-variables-and-networks", title: "Environment variables & networks" },
          { slug: "debugging-a-container", title: "Debugging a container" },
        ],
      },
      {
        slug: "dockerfiles-and-compose",
        title: "Dockerfiles & Compose",
        topics: [
          { slug: "writing-a-dockerfile", title: "Writing a Dockerfile" },
          { slug: "multi-stage-builds", title: "Multi-stage builds" },
          { slug: "compose-app-and-database", title: "Compose: app + database" },
          { slug: "disposable-test-environment", title: "A disposable test environment" },
        ],
      },
      {
        slug: "containers-in-automation",
        title: "Containers in automation",
        topics: [
          { slug: "selenium-grid-in-docker", title: "Selenium Grid in Docker" },
          { slug: "running-your-suite-in-a-container", title: "Running your suite in a container" },
          { slug: "testcontainers-for-database-fixtures", title: "Testcontainers for database fixtures" },
          { slug: "containers-in-ci", title: "Containers in CI" },
        ],
      },
    ],
  },
  // END docker-and-containers-for-testers
  {
    slug: "foundations",
    title: "QA Foundations",
    summary: "The vocabulary and mental models every tester needs.",
    chapters: [
      {
        slug: "principles",
        title: "Testing principles",
        topics: [
          { slug: "what-is-qa", title: "What is QA?" },
          { slug: "seven-principles", title: "The seven testing principles" },
          { slug: "verification-vs-validation", title: "Verification vs validation" },
          { slug: "sdlc-and-stlc", title: "SDLC & STLC" },
        ],
      },
    ],
  },
  {
    slug: "manual",
    title: "Manual Testing",
    summary: "Exploratory testing, test cases, and defect reporting done well.",
    chapters: [
      {
        slug: "exploratory",
        title: "Exploratory testing",
        topics: [
          { slug: "session-based", title: "Session-based test management" },
          { slug: "heuristics", title: "Testing heuristics & tours" },
        ],
      },
    ],
  },
  {
    slug: "automation",
    title: "Test Automation",
    summary: "Selenium, Playwright, frameworks, and the automation pyramid.",
    chapters: [
      {
        slug: "fundamentals",
        title: "Automation fundamentals",
        topics: [
          { slug: "automation-pyramid", title: "The test automation pyramid" },
          { slug: "locators", title: "Locators & selectors" },
          { slug: "page-object-model", title: "The Page Object Model" },
          { slug: "waits-and-sync", title: "Waits & synchronization" },
        ],
      },
      {
        slug: "frameworks",
        title: "Frameworks & tooling",
        topics: [
          { slug: "selenium-java", title: "Selenium with Java" },
          { slug: "playwright", title: "Playwright" },
          { slug: "testng-junit", title: "TestNG & JUnit" },
        ],
      },
    ],
  },
  {
    slug: "api",
    title: "API Testing",
    summary: "HTTP, REST, contracts, auth, and the tools that exercise them.",
    chapters: [
      {
        slug: "http",
        title: "HTTP & REST",
        topics: [
          { slug: "http-fundamentals", title: "HTTP fundamentals" },
          { slug: "status-codes", title: "Status codes that matter" },
          { slug: "rest-principles", title: "REST principles" },
        ],
      },
      {
        slug: "practice",
        title: "Testing APIs in practice",
        topics: [
          { slug: "auth-schemes", title: "Auth schemes (key, Basic, Bearer, OAuth2)" },
          { slug: "contract-testing", title: "Contract testing" },
          { slug: "postman-and-curl", title: "Postman & curl" },
        ],
      },
    ],
  },
  {
    slug: "performance",
    title: "Performance Testing",
    summary: "Load, stress, and the metrics that reveal how systems behave under pressure.",
    chapters: [
      {
        slug: "concepts",
        title: "Concepts",
        topics: [
          { slug: "load-vs-stress", title: "Load vs stress vs soak" },
          { slug: "key-metrics", title: "Latency, throughput & percentiles" },
        ],
      },
    ],
  },
  {
    slug: "security",
    title: "Security Testing",
    summary: "The OWASP Top 10 and a tester's role in shipping secure software.",
    chapters: [
      {
        slug: "owasp",
        title: "OWASP essentials",
        topics: [
          { slug: "owasp-top-10", title: "The OWASP Top 10" },
          { slug: "injection", title: "Injection & XSS" },
          { slug: "auth-failures", title: "Broken authentication" },
        ],
      },
    ],
  },
  {
    slug: "database",
    title: "Database Testing",
    summary: "SQL for testers, data integrity, and validating the layer under the app.",
    chapters: [
      {
        slug: "sql",
        title: "SQL for testers",
        topics: [
          { slug: "select-basics", title: "SELECT, JOIN & aggregate basics" },
          { slug: "data-integrity", title: "Data-integrity checks" },
        ],
      },
    ],
  },
  {
    slug: "cicd",
    title: "CI/CD & DevOps",
    summary: "Where tests run in the pipeline and how quality gates are enforced.",
    chapters: [
      {
        slug: "pipelines",
        title: "Pipelines",
        topics: [
          { slug: "ci-basics", title: "CI basics & quality gates" },
          { slug: "test-in-pipeline", title: "Running tests in the pipeline" },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    title: "Mobile Testing",
    summary: "The extra dimensions — devices, gestures, networks — mobile adds.",
    chapters: [
      {
        slug: "concepts",
        title: "Concepts",
        topics: [
          { slug: "device-matrix", title: "The device & OS matrix" },
          { slug: "mobile-specifics", title: "Gestures, interrupts & networks" },
        ],
      },
    ],
  },
  // ── Approved-map modules #22–26 (Curriculum/generator-master-map.py), never
  // built when the codebase jumped ahead to Test frameworks → Playwright.
  // Appended here (not inserted at map position) to avoid renumbering any
  // in-flight session's "repository M<n>" labels — identity is by slug.
  {
    slug: "system-design-for-testers",
    title: "How systems are built — system design for testers",
    summary: "Testers must know the system they test, not just its screens — the big picture, architecture styles, scaling building blocks, where bugs live by layer, and turning architecture into test strategy.",
    chapters: [
      {
        slug: "the-big-picture",
        title: "The big picture",
        topics: [
          { slug: "frontend-backend-and-the-database", title: "Frontend, backend & the database" },
          { slug: "life-of-a-request-end-to-end", title: "Life of a request, end to end" },
          { slug: "client-side-vs-server-side-rendering", title: "Client-side vs server-side rendering" },
          { slug: "reading-an-architecture-diagram", title: "Reading an architecture diagram" },
        ],
      },
      {
        slug: "architecture-styles",
        title: "Architecture styles",
        topics: [
          { slug: "monolith-vs-microservices", title: "Monolith vs microservices" },
          { slug: "layers-and-mvc-gently", title: "Layers & MVC, gently" },
          { slug: "apis-as-the-glue", title: "APIs as the glue" },
          { slug: "third-party-services-and-webhooks", title: "Third-party services & webhooks" },
        ],
      },
      {
        slug: "scaling-building-blocks",
        title: "Scaling building blocks",
        topics: [
          { slug: "load-balancers", title: "Load balancers" },
          { slug: "caching-redis-and-its-bugs", title: "Caching (Redis) & its bugs" },
          { slug: "message-queues-and-async-work", title: "Message queues & async work" },
          { slug: "cdns-and-static-assets", title: "CDNs & static assets" },
        ],
      },
      {
        slug: "where-bugs-live-by-layer",
        title: "Where bugs live, layer by layer",
        topics: [
          { slug: "ui-layer-bug-families", title: "UI-layer bug families" },
          { slug: "api-and-integration-bug-families", title: "API & integration bug families" },
          { slug: "data-layer-bug-families", title: "Data-layer bug families" },
          { slug: "infra-and-config-bug-families", title: "Infra & config bug families" },
        ],
      },
      {
        slug: "from-architecture-to-test-strategy",
        title: "From architecture to test strategy",
        topics: [
          { slug: "what-to-test-at-which-layer", title: "What to test at which layer" },
          { slug: "integration-points-are-risk", title: "Integration points = risk" },
          { slug: "asking-devs-the-right-questions", title: "Asking devs the right questions" },
          { slug: "drawing-the-system-before-testing-it", title: "Drawing the system before testing it" },
        ],
      },
    ],
  },
  {
    slug: "sql-and-databases-for-testers",
    title: "SQL & databases for testers",
    summary: "SQL comes before automation — verifying data is daily manual-QA work. Reading data, verifying the app against the DB, and the tools/habits that keep a tester's queries safe.",
    chapters: [
      {
        slug: "databases-in-plain-words",
        title: "Databases in plain words",
        topics: [
          { slug: "what-a-database-is", title: "What a database is" },
          { slug: "tables-rows-and-columns", title: "Tables, rows, columns" },
          { slug: "relational-vs-nosql", title: "Relational vs NoSQL" },
          { slug: "where-your-apps-data-lives", title: "Where your app's data lives" },
        ],
      },
      {
        slug: "reading-data",
        title: "Reading data",
        topics: [
          { slug: "select-and-where", title: "SELECT & WHERE" },
          { slug: "sorting-and-limits", title: "Sorting & limits" },
          { slug: "joins-gently", title: "JOINs, gently" },
          { slug: "aggregates-and-group-by", title: "Aggregates & GROUP BY" },
        ],
      },
      {
        slug: "verifying-the-app-against-the-db",
        title: "Verifying the app against the DB",
        topics: [
          { slug: "ui-action-to-db-check", title: "UI action → DB check" },
          { slug: "crud-verification", title: "CRUD verification" },
          { slug: "finding-data-bugs", title: "Finding data bugs" },
          { slug: "test-data-setup-and-cleanup", title: "Test data setup & cleanup" },
        ],
      },
      {
        slug: "tools-and-habits",
        title: "Tools & habits",
        topics: [
          { slug: "db-clients", title: "DB clients (DBeaver, TablePlus)" },
          { slug: "connecting-safely", title: "Connecting safely" },
          { slug: "read-only-discipline", title: "Read-only discipline" },
          { slug: "query-snippets-library", title: "Query snippets library" },
        ],
      },
    ],
  },
  {
    slug: "non-functional-testing-intro",
    title: "Non-functional testing (intro)",
    summary: "Beyond does-it-work: performance, security, usability & accessibility, compatibility, and localization — the five non-functional dimensions every tester should recognize even before specializing in one.",
    chapters: [
      {
        slug: "performance",
        title: "Performance",
        topics: [
          { slug: "what-it-measures", title: "What it measures" },
          { slug: "load-vs-stress", title: "Load vs stress" },
          { slug: "key-metrics", title: "Key metrics" },
          { slug: "tools-overview", title: "Tools overview" },
        ],
      },
      {
        slug: "security",
        title: "Security",
        topics: [
          { slug: "why-it-matters", title: "Why it matters" },
          { slug: "common-risks", title: "Common risks" },
          { slug: "a-testers-role", title: "A tester's role" },
          { slug: "owasp-preview", title: "OWASP preview" },
        ],
      },
      {
        slug: "usability-and-accessibility",
        title: "Usability & accessibility",
        topics: [
          { slug: "usability-testing", title: "Usability testing", planned: true },
          { slug: "ux-heuristics", title: "UX heuristics", planned: true },
          { slug: "accessibility-wcag", title: "Accessibility (WCAG)", planned: true },
          { slug: "assistive-tech", title: "Assistive tech", planned: true },
        ],
      },
      {
        slug: "compatibility",
        title: "Compatibility",
        topics: [
          { slug: "cross-browser", title: "Cross-browser", planned: true },
          { slug: "cross-device", title: "Cross-device", planned: true },
          { slug: "os-and-versions", title: "OS / versions", planned: true },
          { slug: "responsive-checks", title: "Responsive checks", planned: true },
        ],
      },
      {
        slug: "localization-and-i18n",
        title: "Localization & i18n",
        topics: [
          { slug: "i18n-vs-l10n-in-plain-words", title: "i18n vs l10n in plain words", planned: true },
          { slug: "text-expansion-truncation-and-rtl", title: "Text expansion, truncation & RTL", planned: true },
          { slug: "dates-currencies-and-formats", title: "Dates, currencies & formats", planned: true },
          { slug: "pseudo-localization-tricks", title: "Pseudo-localization tricks", planned: true },
        ],
      },
    ],
  },
  {
    slug: "automation-foundations",
    title: "Automation foundations",
    summary: "Turning manual know-how into code starts before the first script: why and when to automate, the automation pyramid, the tool landscape, and the pitfalls that sink suites early.",
    chapters: [
      {
        slug: "why-and-when-to-automate",
        title: "Why & when to automate",
        topics: [
          { slug: "benefits", title: "Benefits" },
          { slug: "what-to-automate", title: "What to automate" },
          { slug: "what-not-to-automate", title: "What NOT to" },
          { slug: "manual-vs-automated", title: "Manual vs automated" },
        ],
      },
      {
        slug: "the-automation-pyramid",
        title: "The automation pyramid",
        topics: [
          { slug: "unit-integration-e2e", title: "Unit / integration / E2E" },
          { slug: "ice-cream-cone-anti-pattern", title: "Ice-cream-cone anti-pattern" },
          { slug: "balancing-the-suite", title: "Balancing the suite" },
          { slug: "roi", title: "ROI" },
        ],
      },
      {
        slug: "the-tool-landscape",
        title: "The tool landscape",
        topics: [
          { slug: "selenium", title: "Selenium", planned: true },
          { slug: "playwright-tool", title: "Playwright", planned: true },
          { slug: "cypress", title: "Cypress", planned: true },
          { slug: "choosing-a-tool", title: "Choosing a tool", planned: true },
        ],
      },
      {
        slug: "pitfalls",
        title: "Pitfalls",
        topics: [
          { slug: "flaky-tests", title: "Flaky tests", planned: true },
          { slug: "maintenance-cost", title: "Maintenance cost", planned: true },
          { slug: "over-automation", title: "Over-automation", planned: true },
          { slug: "false-confidence", title: "False confidence", planned: true },
        ],
      },
    ],
  },
  {
    slug: "selenium-webdriver",
    title: "Selenium WebDriver",
    summary: "WebDriver architecture, locators, waits and synchronization, and the actions/navigation API — the hands-on core every Java/Python automation engineer builds on.",
    chapters: [
      {
        slug: "setup-and-architecture",
        title: "Setup & architecture",
        topics: [
          { slug: "webdriver-architecture", title: "WebDriver architecture", planned: true },
          { slug: "drivers-and-selenium-manager", title: "Drivers & Selenium Manager", planned: true },
          { slug: "first-script-java", title: "First script (Java)", planned: true },
          { slug: "first-script-python", title: "First script (Python)", planned: true },
        ],
      },
      {
        slug: "locators",
        title: "Locators",
        topics: [
          { slug: "id-name-css-xpath", title: "id / name / css / xpath", planned: true },
          { slug: "locator-strategy", title: "Locator strategy", planned: true },
          { slug: "relative-locators", title: "Relative locators", planned: true },
          { slug: "robust-selectors", title: "Robust selectors", planned: true },
        ],
      },
      {
        slug: "waits-and-sync",
        title: "Waits & sync",
        topics: [
          { slug: "implicit-vs-explicit", title: "Implicit vs explicit", planned: true },
          { slug: "fluent-waits", title: "Fluent waits", planned: true },
          { slug: "avoiding-sleeps", title: "Avoiding sleeps", planned: true },
          { slug: "handling-async", title: "Handling async", planned: true },
        ],
      },
      {
        slug: "actions-and-navigation",
        title: "Actions & navigation",
        topics: [
          { slug: "clicks-and-input", title: "Clicks & input", planned: true },
          { slug: "dropdowns-and-alerts", title: "Dropdowns & alerts", planned: true },
          { slug: "frames-and-windows", title: "Frames & windows", planned: true },
          { slug: "actions-api", title: "Actions API", planned: true },
        ],
      },
    ],
  },
  {
    slug: "kubernetes-and-test-infrastructure",
    title: "Kubernetes & test infrastructure",
    summary: "Intro-level on purpose — enough to work with real deployments and stand out in interviews, not to become a cluster admin. Pods and kubectl, running test workloads on a cluster, and what QA verifies around a release.",
    chapters: [
      {
        slug: "kubernetes-in-plain-words",
        title: "Kubernetes in plain words",
        topics: [
          { slug: "what-k8s-solves", title: "What K8s solves" },
          { slug: "pods-deployments-services", title: "Pods, deployments, services" },
          { slug: "kubectl-survival-kit", title: "kubectl survival kit" },
          { slug: "namespaces-and-contexts", title: "Namespaces & contexts" },
        ],
      },
      {
        slug: "test-workloads-on-k8s",
        title: "Test workloads on K8s",
        topics: [
          { slug: "running-tests-as-jobs", title: "Running tests as Jobs" },
          { slug: "selenium-grid-on-k8s", title: "Selenium Grid on K8s (dynamic grid)" },
          { slug: "reading-pod-logs", title: "Reading pod logs" },
          { slug: "port-forward-to-debug", title: "Port-forward to debug" },
        ],
      },
      {
        slug: "releases-and-environments",
        title: "Releases & environments",
        topics: [
          { slug: "how-teams-deploy", title: "How teams deploy" },
          { slug: "staging-vs-production", title: "Staging vs production" },
          { slug: "config-and-secrets", title: "Config & secrets" },
          { slug: "what-qa-verifies-after-a-deploy", title: "What QA verifies after a deploy" },
        ],
      },
    ],
  },
  {
    slug: "performance-testing",
    title: "Performance testing",
    summary: "Load, stress, and soak testing; the metrics that reveal system behavior; and practical introductions to JMeter and k6.",
    chapters: [
      {
        slug: "load-vs-stress-vs-soak",
        title: "Load vs stress vs soak",
        topics: [
          { slug: "types-of-perf-testing", title: "Types of performance testing" },
          { slug: "goals", title: "Goals" },
          { slug: "recovery", title: "Recovery" },
          { slug: "scalability", title: "Scalability" },
        ],
      },
      {
        slug: "metrics",
        title: "Metrics",
        topics: [
          { slug: "latency-and-throughput", title: "Latency & throughput" },
          { slug: "percentiles-vs-averages", title: "Percentiles vs averages" },
          { slug: "error-rate", title: "Error rate" },
          { slug: "resource-use", title: "Resource use" },
        ],
      },
      {
        slug: "tools-intro",
        title: "Tools intro",
        topics: [
          { slug: "jmeter", title: "JMeter", planned: true },
          { slug: "k6", title: "k6", planned: true },
          { slug: "designing-a-test", title: "Designing a test", planned: true },
          { slug: "reading-results", title: "Reading results", planned: true },
        ],
      },
    ],
  },
  {
    slug: "security-testing-web",
    title: "Security testing — web",
    summary: "Hands-on, authorization-bounded web security testing across OWASP risks, injection, authentication, authorization, tools, and reporting.",
    chapters: [
      {
        slug: "owasp-top-10-properly",
        title: "OWASP Top 10, properly",
        topics: [
          { slug: "the-2021-list-and-how-to-use-it", title: "The 2021 list & how to use it" },
          { slug: "broken-access-control", title: "Broken access control" },
          { slug: "cryptographic-and-config-failures", title: "Cryptographic & config failures" },
          { slug: "mapping-findings-to-the-list", title: "Mapping findings to the list" },
        ],
      },
      {
        slug: "injection-and-client-side",
        title: "Injection & client-side",
        topics: [
          { slug: "sql-injection-by-hand", title: "SQL injection by hand", planned: true },
          { slug: "xss-reflected-stored-dom", title: "XSS: reflected / stored / DOM", planned: true },
          { slug: "command-and-template-injection", title: "Command & template injection", planned: true },
          { slug: "csrf-and-clickjacking", title: "CSRF & clickjacking", planned: true },
        ],
      },
      {
        slug: "authentication-testing",
        title: "Authentication testing",
        topics: [
          { slug: "auth-vs-authorization-distinct-skills", title: "Auth vs authorization (distinct skills)", planned: true },
          { slug: "session-and-cookie-attacks", title: "Session & cookie attacks", planned: true },
          { slug: "password-and-reset-flows", title: "Password & reset flows", planned: true },
          { slug: "mfa-bypass-patterns", title: "MFA bypass patterns", planned: true },
        ],
      },
      {
        slug: "authorization-and-access",
        title: "Authorization & access",
        topics: [
          { slug: "idor-bola-by-hand", title: "IDOR / BOLA by hand", planned: true },
          { slug: "privilege-escalation", title: "Privilege escalation", planned: true },
          { slug: "forced-browsing", title: "Forced browsing", planned: true },
          { slug: "function-level-checks-bfla", title: "Function-level checks (BFLA)", planned: true },
        ],
      },
      {
        slug: "tools-and-reporting",
        title: "Tools & reporting",
        topics: [
          { slug: "burp-suite-basics", title: "Burp Suite basics", planned: true },
          { slug: "owasp-zap", title: "OWASP ZAP", planned: true },
          { slug: "writing-a-security-finding-devs-act-on", title: "Writing a security finding devs act on", planned: true },
          { slug: "responsible-disclosure", title: "Responsible disclosure", planned: true },
        ],
      },
    ],
  },
  {
    slug: "api-and-modern-security",
    title: "API & modern security",
    summary: "Authorization-bounded testing for REST, tokens, GraphQL, and complete API security audits using modern threat models.",
    chapters: [
      {
        slug: "owasp-api-security-top-10-2023",
        title: "OWASP API Security Top 10 (2023)",
        topics: [
          { slug: "bola-and-bfla", title: "BOLA & BFLA" },
          { slug: "broken-auth-for-apis", title: "Broken auth for APIs" },
          { slug: "unrestricted-resource-consumption", title: "Unrestricted resource consumption" },
          { slug: "the-full-api-list", title: "The full API list" },
        ],
      },
      {
        slug: "rest-api-attacks",
        title: "REST API attacks",
        topics: [
          { slug: "mass-assignment", title: "Mass assignment", planned: true },
          { slug: "ssrf", title: "SSRF", planned: true },
          { slug: "rate-limit-and-abuse-testing", title: "Rate-limit & abuse testing", planned: true },
          { slug: "excessive-data-exposure", title: "Excessive data exposure", planned: true },
        ],
      },
      {
        slug: "jwt-and-token-attacks",
        title: "JWT & token attacks",
        topics: [
          { slug: "alg-none-and-weak-secrets", title: "alg:none & weak secrets", planned: true },
          { slug: "expiry-and-replay", title: "Expiry & replay", planned: true },
          { slug: "scope-and-audience-abuse", title: "Scope & audience abuse", planned: true },
          { slug: "key-confusion", title: "Key confusion", planned: true },
        ],
      },
      {
        slug: "graphql-security",
        title: "GraphQL security",
        topics: [
          { slug: "introspection-leakage", title: "Introspection leakage", planned: true },
          { slug: "query-depth-and-complexity-dos", title: "Query depth & complexity DoS", planned: true },
          { slug: "batching-and-alias-abuse", title: "Batching & alias abuse", planned: true },
          { slug: "field-level-auth-and-mutation-mass-assignment", title: "Field-level auth & mutation mass assignment", planned: true },
        ],
      },
      {
        slug: "auditing-buggyapi",
        title: "Auditing BuggyAPI",
        topics: [
          { slug: "threat-modeling-an-api", title: "Threat-modeling an API", planned: true },
          { slug: "a-repeatable-audit-checklist", title: "A repeatable audit checklist", planned: true },
          { slug: "chaining-findings", title: "Chaining findings", planned: true },
          { slug: "the-write-up-like-a-real-report", title: "The write-up (like a real report)", planned: true },
        ],
      },
    ],
  },
  {
    slug: "accessibility-testing",
    title: "Accessibility testing",
    summary: "Manual and automated accessibility testing grounded in WCAG 2.2, assistive technology, semantic HTML, and actionable reporting.",
    chapters: [
      {
        slug: "why-accessibility-matters",
        title: "Why accessibility matters",
        topics: [
          { slug: "disabilities-and-assistive-tech", title: "Disabilities & assistive tech" },
          { slug: "the-business-and-legal-case-ada-eaa", title: "The business & legal case (ADA/EAA)" },
          { slug: "wcag-2-2-a-aa-aaa", title: "WCAG 2.2 A / AA / AAA" },
          { slug: "pour-principles", title: "POUR principles" },
        ],
      },
      {
        slug: "manual-a11y-testing",
        title: "Manual a11y testing",
        topics: [
          { slug: "keyboard-only-navigation", title: "Keyboard-only navigation", planned: true },
          { slug: "screen-readers-nvda-voiceover", title: "Screen readers (NVDA / VoiceOver)", planned: true },
          { slug: "focus-order-and-visible-focus", title: "Focus order & visible focus", planned: true },
          { slug: "contrast-and-zoom-reflow", title: "Contrast & zoom / reflow", planned: true },
        ],
      },
      {
        slug: "automated-a11y-audits",
        title: "Automated a11y audits",
        topics: [
          { slug: "axe-devtools-and-lighthouse", title: "axe DevTools & Lighthouse", planned: true },
          { slug: "wave", title: "WAVE", planned: true },
          { slug: "what-automation-catches-vs-misses", title: "What automation catches vs misses", planned: true },
          { slug: "ci-a11y-checks", title: "CI a11y checks", planned: true },
        ],
      },
      {
        slug: "reporting-and-fixing",
        title: "Reporting & fixing",
        topics: [
          { slug: "writing-a11y-findings-devs-act-on", title: "Writing a11y findings devs act on", planned: true },
          { slug: "aria-help-and-harm", title: "ARIA: help & harm", planned: true },
          { slug: "semantic-html-first", title: "Semantic HTML first", planned: true },
          { slug: "re-testing-a-fix", title: "Re-testing a fix", planned: true },
        ],
      },
    ],
  },
  {
    slug: "mobile-testing",
    title: "Mobile testing",
    summary: "Device matrices, mobile interactions, Appium fundamentals, and the lifecycle, permission, performance, and store checks unique to mobile apps.",
    chapters: [
      {
        slug: "device-and-os-matrix",
        title: "Device & OS matrix",
        topics: [
          { slug: "fragmentation", title: "Fragmentation" },
          { slug: "building-a-matrix", title: "Building a matrix" },
          { slug: "real-vs-emulated", title: "Real vs emulated" },
          { slug: "device-farms", title: "Device farms" },
        ],
      },
      {
        slug: "gestures-interrupts-networks",
        title: "Gestures, interrupts, networks",
        topics: [
          { slug: "touch-gestures", title: "Touch gestures", planned: true },
          { slug: "interrupts", title: "Interrupts", planned: true },
          { slug: "network-conditions", title: "Network conditions", planned: true },
          { slug: "orientation", title: "Orientation", planned: true },
        ],
      },
      {
        slug: "appium-intro",
        title: "Appium intro",
        topics: [
          { slug: "what-appium-is", title: "What Appium is", planned: true },
          { slug: "setup", title: "Setup", planned: true },
          { slug: "first-mobile-test", title: "First mobile test", planned: true },
          { slug: "mobile-locators", title: "Mobile locators", planned: true },
        ],
      },
      {
        slug: "mobile-specifics",
        title: "Mobile specifics",
        topics: [
          { slug: "permissions", title: "Permissions", planned: true },
          { slug: "battery-and-performance", title: "Battery & performance", planned: true },
          { slug: "app-lifecycle", title: "App lifecycle", planned: true },
          { slug: "store-testing", title: "Store testing", planned: true },
        ],
      },
    ],
  },
  {
    slug: "agile-and-devops-for-testers",
    title: "Agile & DevOps for testers",
    summary: "How testers contribute in Scrum and Kanban, work inside a sprint, and build quality into continuous delivery pipelines.",
    chapters: [
      {
        slug: "scrum-and-kanban",
        title: "Scrum & Kanban",
        topics: [
          { slug: "scrum-roles-and-ceremonies", title: "Scrum roles & ceremonies" },
          { slug: "kanban", title: "Kanban" },
          { slug: "backlog-and-stories", title: "Backlog & stories" },
          { slug: "estimation", title: "Estimation" },
        ],
      },
      {
        slug: "tester-in-a-sprint",
        title: "Tester in a sprint",
        topics: [
          { slug: "definition-of-done", title: "Definition of done", planned: true },
          { slug: "in-sprint-testing", title: "In-sprint testing", planned: true },
          { slug: "acceptance-criteria", title: "Acceptance criteria", planned: true },
          { slug: "collaboration", title: "Collaboration", planned: true },
        ],
      },
      {
        slug: "shift-left-and-cicd",
        title: "Shift-left & CI/CD",
        topics: [
          { slug: "shift-left", title: "Shift-left", planned: true },
          { slug: "the-cicd-pipeline", title: "The CI/CD pipeline", planned: true },
          { slug: "quality-gates", title: "Quality gates", planned: true },
          { slug: "continuous-testing", title: "Continuous testing", planned: true },
        ],
      },
    ],
  },
  {
    slug: "test-management-and-reporting",
    title: "Test management & reporting",
    summary: "The tools, metrics, communication, environment controls, and risk decisions that make testing visible and actionable across a team.",
    chapters: [
      {
        slug: "test-management-tools",
        title: "Test management tools",
        topics: [
          { slug: "jira-and-boards-deeper", title: "JIRA & boards, deeper" },
          { slug: "testrail-xray-zephyr", title: "TestRail / Xray / Zephyr" },
          { slug: "organizing-suites-and-runs", title: "Organizing suites & runs" },
          { slug: "linking-bugs-to-cases", title: "Linking bugs to cases" },
        ],
      },
      {
        slug: "metrics-and-reporting",
        title: "Metrics & reporting",
        topics: [
          { slug: "test-summary-reports", title: "Test summary reports", planned: true },
          { slug: "coverage-and-pass-rate-metrics", title: "Coverage & pass-rate metrics", planned: true },
          { slug: "dashboards", title: "Dashboards", planned: true },
          { slug: "reporting-to-stakeholders", title: "Reporting to stakeholders", planned: true },
        ],
      },
      {
        slug: "docs-and-communication",
        title: "Docs & communication",
        topics: [
          { slug: "confluence-and-wikis", title: "Confluence / wikis", planned: true },
          { slug: "writing-for-developers", title: "Writing for developers", planned: true },
          { slug: "status-updates", title: "Status updates", planned: true },
          { slug: "async-communication", title: "Async communication", planned: true },
        ],
      },
      {
        slug: "environments-and-test-data",
        title: "Environments & test data",
        topics: [
          { slug: "dev-qa-staging-prod", title: "Dev / QA / staging / prod", planned: true },
          { slug: "environment-parity-and-config", title: "Environment parity & config", planned: true },
          { slug: "test-data-management-and-anonymization", title: "Test data management & anonymization", planned: true },
          { slug: "gdpr-and-sensitive-data-in-tests", title: "GDPR & sensitive data in tests", planned: true },
        ],
      },
      {
        slug: "risk-and-estimation",
        title: "Risk & estimation",
        topics: [
          { slug: "risk-based-testing", title: "Risk-based testing", planned: true },
          { slug: "prioritizing-what-to-test-first", title: "Prioritizing what to test first", planned: true },
          { slug: "test-estimation-techniques", title: "Test estimation techniques", planned: true },
          { slug: "saying-no-with-data", title: "Saying no with data", planned: true },
        ],
      },
    ],
  },
  {
    slug: "ai-and-the-modern-tester",
    title: "AI & the modern tester",
    summary: "Using AI critically in testing, automating with AI, evaluating AI systems, and building durable tester judgment as tools change.",
    chapters: [
      {
        slug: "ai-as-your-testing-copilot",
        title: "AI as your testing copilot",
        topics: [
          { slug: "llms-for-test-ideas-and-cases", title: "LLMs for test ideas & cases", planned: true },
          { slug: "prompting-for-qa-work", title: "Prompting for QA work", planned: true },
          { slug: "generating-test-data-with-ai", title: "Generating test data with AI", planned: true },
          { slug: "reviewing-ai-output-critically", title: "Reviewing AI output critically", planned: true },
        ],
      },
      {
        slug: "ai-powered-test-automation",
        title: "AI-powered test automation",
        topics: [
          { slug: "self-healing-tests", title: "Self-healing tests", planned: true },
          { slug: "ai-test-generation-tools", title: "AI test generation tools", planned: true },
          { slug: "autonomous-testing-agents", title: "Autonomous testing agents", planned: true },
          { slug: "when-ai-automation-lies", title: "When AI automation lies", planned: true },
        ],
      },
      {
        slug: "testing-ai-systems",
        title: "Testing AI systems",
        topics: [
          { slug: "why-ai-apps-break-differently", title: "Why AI apps break differently", planned: true },
          { slug: "evaluating-llm-outputs", title: "Evaluating LLM outputs (DeepEval / RAGAS ideas)", planned: true },
          { slug: "hallucinations-bias-and-safety", title: "Hallucinations, bias & safety", planned: true },
          { slug: "regression-for-prompts-and-models", title: "Regression for prompts & models", planned: true },
        ],
      },
      {
        slug: "staying-employable-in-the-ai-era",
        title: "Staying employable in the AI era",
        topics: [
          { slug: "what-ai-wont-replace", title: "What AI won't replace", planned: true },
          { slug: "the-testers-judgment-premium", title: "The tester's judgment premium", planned: true },
          { slug: "learning-loop-for-new-tools", title: "Learning loop for new tools", planned: true },
          { slug: "ai-on-your-resume-honestly", title: "AI on your resume, honestly", planned: true },
        ],
      },
    ],
  },
  {
    slug: "a-portfolio-that-gets-interviews",
    title: "A portfolio that gets interviews",
    summary: "Three focused repositories, clear evidence of QA work, and credible public profiles that make practical skills easy to inspect.",
    chapters: [
      {
        slug: "the-3-repo-portfolio",
        title: "The 3-repo portfolio",
        topics: [
          { slug: "repo-1-documented-manual-project", title: "Repo 1: documented manual project" },
          { slug: "repo-2-ui-automation-suite", title: "Repo 2: UI automation suite" },
          { slug: "repo-3-api-suite-and-ci", title: "Repo 3: API suite + CI" },
          { slug: "readmes-that-sell", title: "READMEs that sell" },
        ],
      },
      {
        slug: "show-your-work",
        title: "Show your work",
        topics: [
          { slug: "packaging-buggyshop-and-buggyapi-work", title: "Packaging BuggyShop / BuggyAPI work", planned: true },
          { slug: "architecture-diagrams", title: "Architecture diagrams", planned: true },
          { slug: "demo-gifs-and-reports", title: "Demo GIFs & reports", planned: true },
          { slug: "what-recruiters-actually-open", title: "What recruiters actually open", planned: true },
        ],
      },
      {
        slug: "profiles",
        title: "Profiles",
        topics: [
          { slug: "github-profile-polish", title: "GitHub profile polish", planned: true },
          { slug: "linkedin-for-qa", title: "LinkedIn for QA", planned: true },
          { slug: "personal-brand-basics", title: "Personal brand basics", planned: true },
          { slug: "posting-your-progress", title: "Posting your progress", planned: true },
        ],
      },
    ],
  },
  {
    slug: "resume-and-applications",
    title: "Résumé & applications",
    summary: "Evidence-led QA résumés, targeted applications, and an honest framework for deciding whether certifications support a specific goal.",
    chapters: [
      {
        slug: "the-qa-resume",
        title: "The QA résumé",
        topics: [
          { slug: "structure-that-works", title: "Structure that works", planned: true },
          { slug: "skills-and-keywords-ats", title: "Skills & keywords (ATS)", planned: true },
          { slug: "numbers-and-impact", title: "Numbers & impact", planned: true },
          { slug: "common-mistakes", title: "Common mistakes", planned: true },
        ],
      },
      {
        slug: "applying-smart",
        title: "Applying smart",
        topics: [
          { slug: "reading-job-posts", title: "Reading job posts", planned: true },
          { slug: "tailoring-per-role", title: "Tailoring per role", planned: true },
          { slug: "cover-letters-short", title: "Cover letters, short", planned: true },
          { slug: "tracking-applications", title: "Tracking applications", planned: true },
        ],
      },
      {
        slug: "certifications-honestly",
        title: "Certifications, honestly",
        topics: [
          { slug: "istqb-worth-it-or-not", title: "ISTQB — worth it or not", planned: true },
          { slug: "when-certs-matter", title: "When certs matter", planned: true },
          { slug: "free-alternatives", title: "Free alternatives", planned: true },
          { slug: "learning-in-public", title: "Learning in public", planned: true },
        ],
      },
    ],
  },
  {
    slug: "interviews",
    title: "Interviews",
    summary: "Practical preparation for manual, technical, behavioral, and mock interview rounds without pretending one answer fits every employer.",
    chapters: [
      {
        slug: "manual-qa-questions",
        title: "Manual QA questions",
        topics: [
          { slug: "classic-questions-and-answers", title: "Classic questions & answers" },
          { slug: "test-design-exercises", title: "Test-design exercises" },
          { slug: "test-this-pen-scenarios", title: "Test this pen scenarios" },
          { slug: "talking-through-bugs", title: "Talking through bugs" },
        ],
      },
      {
        slug: "technical-rounds",
        title: "Technical rounds",
        topics: [
          { slug: "automation-and-coding-questions", title: "Automation & coding questions", planned: true },
          { slug: "sql-questions", title: "SQL questions", planned: true },
          { slug: "api-questions", title: "API questions", planned: true },
          { slug: "take-home-assignments", title: "Take-home assignments", planned: true },
        ],
      },
      {
        slug: "behavioral-and-scenarios",
        title: "Behavioral & scenarios",
        topics: [
          { slug: "star-stories", title: "STAR stories", planned: true },
          { slug: "conflict-and-priority-scenarios", title: "Conflict & priority scenarios", planned: true },
          { slug: "questions-to-ask-them", title: "Questions to ask them", planned: true },
          { slug: "salary-conversations", title: "Salary conversations", planned: true },
        ],
      },
      {
        slug: "mock-practice",
        title: "Mock practice",
        topics: [
          { slug: "mock-interview-drills", title: "Mock interview drills", planned: true },
          { slug: "recording-yourself", title: "Recording yourself", planned: true },
          { slug: "feedback-loops", title: "Feedback loops", planned: true },
          { slug: "handling-rejection", title: "Handling rejection", planned: true },
        ],
      },
    ],
  },
  {
    slug: "your-first-90-days",
    title: "Your first 90 days",
    summary: "A practical path through onboarding, solo-QA constraints, continued growth, and deliberate exploration of testing specializations.",
    chapters: [
      {
        slug: "landing-well",
        title: "Landing well",
        topics: [
          { slug: "onboarding-as-a-qa", title: "Onboarding as a QA" },
          { slug: "learning-the-product-fast", title: "Learning the product fast" },
          { slug: "your-first-bug-report-at-work", title: "Your first bug report at work" },
          { slug: "building-trust", title: "Building trust" },
        ],
      },
      {
        slug: "working-solo-the-mentor-gap",
        title: "Working solo (the mentor gap)",
        topics: [
          { slug: "being-the-only-qa", title: "Being the only QA", planned: true },
          { slug: "asking-good-questions", title: "Asking good questions", planned: true },
          { slug: "using-the-community", title: "Using the community", planned: true },
          { slug: "when-to-escalate", title: "When to escalate", planned: true },
        ],
      },
      {
        slug: "growing-from-here",
        title: "Growing from here",
        topics: [
          { slug: "junior-to-mid-roadmap", title: "Junior → mid roadmap", planned: true },
          { slug: "specializing", title: "Specializing", planned: true },
          { slug: "keeping-a-brag-doc", title: "Keeping a brag doc", planned: true },
          { slug: "continued-learning", title: "Continued learning", planned: true },
        ],
      },
      {
        slug: "domains-and-specializations",
        title: "Domains & specializations",
        topics: [
          { slug: "payments-and-fintech-testing", title: "Payments & fintech testing", planned: true },
          { slug: "erp-crm-and-enterprise", title: "ERP / CRM & enterprise", planned: true },
          { slug: "games-iot-and-embedded", title: "Games, IoT & embedded", planned: true },
          { slug: "picking-a-niche-deliberately", title: "Picking a niche deliberately", planned: true },
        ],
      },
    ],
  },
] as const;

/** Flat list of every (module, chapter, topic) leaf with its URL parts. */
export interface NoteLeaf {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  title: string;
  planned: boolean;
}

export function allNoteLeaves(): NoteLeaf[] {
  const out: NoteLeaf[] = [];
  for (const m of NOTES_TAXONOMY) {
    for (const c of m.chapters) {
      for (const t of c.topics) {
        out.push({
          moduleSlug: m.slug,
          chapterSlug: c.slug,
          topicSlug: t.slug,
          title: t.title,
          planned: t.planned ?? false,
        });
      }
    }
  }
  return out;
}

export function findNoteModule(slug: string): NoteModule | undefined {
  return NOTES_TAXONOMY.find((m) => m.slug === slug);
}

export function findNoteLeaf(
  moduleSlug: string,
  chapterSlug: string,
  topicSlug: string,
): NoteLeaf | undefined {
  return allNoteLeaves().find(
    (l) => l.moduleSlug === moduleSlug && l.chapterSlug === chapterSlug && l.topicSlug === topicSlug,
  );
}
