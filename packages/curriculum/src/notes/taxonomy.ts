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
          { slug: "form-fillers", title: "Form fillers", planned: true },
          { slug: "test-credit-cards-and-emails", title: "Test credit cards & emails", planned: true },
          { slug: "generating-data-mockaroo-and-faker", title: "Generating data: Mockaroo & Faker", planned: true },
        ],
      },
      {
        slug: "link-page-ui-checks",
        title: "Link, page & UI checks",
        topics: [
          { slug: "check-my-links", title: "Check My Links", planned: true },
          { slug: "gofullpage-and-screenshots", title: "GoFullPage & screenshot tools", planned: true },
          { slug: "window-resizer-responsive-checks", title: "Window Resizer & responsive checks", planned: true },
          { slug: "whatfont-perfectpixel-page-ruler", title: "WhatFont, PerfectPixel & Page Ruler", planned: true },
        ],
      },
      {
        slug: "cookies-json-sessions",
        title: "Cookies, JSON & sessions",
        topics: [
          { slug: "cookie-editors", title: "Cookie editors", planned: true },
          { slug: "json-formatters", title: "JSON formatters", planned: true },
          { slug: "clear-cache", title: "Clear Cache", planned: true },
          { slug: "multi-account-testing", title: "Managing multi-account testing", planned: true },
        ],
      },
      {
        slug: "locator-and-recorder-helpers",
        title: "Locator & recorder helpers",
        topics: [
          { slug: "selectorshub", title: "SelectorsHub", planned: true },
          { slug: "css-selector-helpers", title: "CSS selector helpers", planned: true },
          { slug: "recorder-extensions", title: "Recorder extensions", planned: true },
          { slug: "from-recorder-to-real-script", title: "From recorder to real script", planned: true },
        ],
      },
      {
        slug: "accessibility-and-quality",
        title: "Accessibility & quality",
        topics: [
          { slug: "wave", title: "WAVE", planned: true },
          { slug: "axe-devtools", title: "axe DevTools", planned: true },
          { slug: "contrast-and-screen-reader-checks", title: "Contrast & screen-reader checks", planned: true },
          { slug: "lighthouse", title: "Lighthouse as an extension of QA", planned: true },
        ],
      },
      {
        slug: "beyond-the-browser",
        title: "Beyond the browser",
        topics: [
          { slug: "debugging-proxies", title: "Debugging proxies", planned: true },
          { slug: "email-testing", title: "Email testing", planned: true },
          { slug: "tunnels-and-sharing-localhost", title: "Tunnels & sharing localhost", planned: true },
          { slug: "screen-recorders-for-bug-repro", title: "Screen recorders for bug repro", planned: true },
        ],
      },
      {
        slug: "choosing-tools-wisely",
        title: "Choosing tools wisely",
        topics: [
          { slug: "how-what-when-why-framework", title: "The how / what / when / why framework", planned: true },
          { slug: "free-vs-paid-honestly", title: "Free vs paid, honestly", planned: true },
          { slug: "tool-sprawl-and-when-to-stop", title: "Tool sprawl & when to stop", planned: true },
          { slug: "keeping-your-kit-current", title: "Keeping your kit current", planned: true },
        ],
      },
    ],
  },
  // END testers-toolbox
  {
    slug: "playwright",
    title: "Playwright",
    summary: "Modern end-to-end browser automation in TypeScript — auto-waiting instead of manual sleeps, resilient user-facing locators, first-class tracing and debugging, real parallel/cross-browser runs, and visual regression testing.",
    chapters: [
      {
        slug: "setup-and-auto-waiting",
        title: "Setup & auto-waiting",
        topics: [
          { slug: "installing-playwright", title: "Installing Playwright", planned: true },
          { slug: "typescript-setup", title: "TypeScript setup", planned: true },
          { slug: "first-test", title: "First test", planned: true },
          { slug: "auto-waiting-explained", title: "Auto-waiting explained", planned: true },
        ],
      },
      {
        slug: "locators-and-fixtures",
        title: "Locators & fixtures",
        topics: [
          { slug: "user-facing-locators", title: "User-facing locators", planned: true },
          { slug: "getbyrole-label-testid", title: "getByRole / Label / TestId", planned: true },
          { slug: "fixtures", title: "Fixtures", planned: true },
          { slug: "test-isolation", title: "Test isolation", planned: true },
        ],
      },
      {
        slug: "tracing-and-debugging",
        title: "Tracing & debugging",
        topics: [
          { slug: "trace-viewer", title: "Trace viewer", planned: true },
          { slug: "codegen", title: "Codegen", planned: true },
          { slug: "debugging", title: "Debugging", planned: true },
          { slug: "screenshots-and-video", title: "Screenshots & video", planned: true },
        ],
      },
      {
        slug: "parallel-and-cross-browser",
        title: "Parallel & cross-browser",
        topics: [
          { slug: "projects-and-browsers", title: "Projects & browsers", planned: true },
          { slug: "parallelism-and-sharding", title: "Parallelism & sharding", planned: true },
          { slug: "retries", title: "Retries", planned: true },
          { slug: "config", title: "Config", planned: true },
        ],
      },
      {
        slug: "visual-regression-testing",
        title: "Visual regression testing",
        topics: [
          { slug: "pixel-vs-ai-diffing", title: "Pixel vs AI diffing", planned: true },
          { slug: "playwright-snapshots", title: "Playwright snapshots", planned: true },
          { slug: "percy-applitools-backstopjs", title: "Percy / Applitools / BackstopJS", planned: true },
          { slug: "taming-false-positives", title: "Taming false positives", planned: true },
        ],
      },
    ],
  },
  // END playwright
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
