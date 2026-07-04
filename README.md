# AI-Powered Resume Parser & Talent Analytics

A modern, high-fidelity web application to extract, categorize, and search candidate resume details (PDF, DOCX, DOC, TXT). Featuring a beautiful glassmorphic dark-theme dashboard frontend and a robust Python backend with a dual-mode NLP extraction pipeline.

## 🚀 Key Features

* **Dual-Mode Parsing Engine**: Attempts to use spaCy Named Entity Recognition (NER) for names and PhraseMatcher for skill matching. If spaCy is not installed or supported on the host environment (e.g., Python 3.14 compilation locks), the parser seamlessly falls back to a custom, pure-Python pattern heuristic engine.
* **Multipart Text Extractor**: Extracts structured text cleanly from PDF files (via `pdfplumber`) and Word documents (via `python-docx`), including tables and layout blocks.
* **RESTful API Endpoint**: Fully featured backend services:
  * `/api/upload` (POST): Accept, save, parse, and commit candidate details to the database.
  * `/api/candidates` (GET): Search and filter profiles by keyword, name, education, or skill tag overlaps.
  * `/api/candidates/<id>` (GET): Retrieve full details including raw parsed text.
  * `/api/candidates/<id>` (DELETE): Delete database record and physical upload folder files.
* **Interactive Dashboard UI**:
  * Real-time metrics widgets (Total Resumes, Average Skills, Unique Skills count).
  * Smooth drag-and-drop multi-file uploads with active progress indicators.
  * Live-updating candidate listings table with skill badges, education previews, and quick delete controls.
  * Detail Slide-out Drawer to view contact information, education breakdown, skill clouds, and raw document preview.
* **Database Support**: Built on SQLAlchemy. Defaults to SQLite (`resumes.db`) for immediate zero-config setup, with full PostgreSQL support configurable via environment variables.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5 (Semantic Structure), Vanilla CSS3 (Custom Variables, Flexbox/Grid, Backdrop Filters, Keyframe Animations), JavaScript (AJAX Fetch, DOM events).
* **Backend**: Python 3.x, Flask (REST API), Flask-SQLAlchemy (ORM).
* **Parsers**: PDFPlumber, python-docx, spaCy NLP (Optional).
* **Database**: SQLite (Default) / PostgreSQL.

---

## 💻 Quick Start & Setup

### 1. Prerequisites
Make sure Python 3.x is installed on your system.

### 2. Install Dependencies
Navigate to the project root directory and run:
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory by copying the template:
```bash
cp .env.example .env
```
*By default, the application runs on SQLite (`sqlite:///resumes.db`). To connect to a PostgreSQL server instead, uncomment and configure the `DATABASE_URL` line inside `.env`:*
```env
DATABASE_URL=postgresql://username:password@localhost:5432/resume_db
```

### 4. Launch Application
Start the Flask web server:
```bash
python app.py
```
Open your browser and navigate to the application url (typically `http://127.0.0.1:5050` or `http://localhost:5000` depending on terminal port settings).

### 5. Running Validation Tests
To run unit tests on the extraction parser:
```bash
python test_parser.py
```

---

## 📁 Repository Structure

```
resume-parser/
├── app.py                # Flask application initialization and REST API routes
├── parser.py             # Parser engine with pdf/docx readers & hybrid NLP extractors
├── models.py             # SQLAlchemy Candidate schema definitions
├── database.py           # Database object wrapper
├── config.py             # Application settings & environment loaders
├── requirements.txt      # Project packages list
├── test_parser.py        # Local extraction test suite
├── .env                  # Project configuration variables (private)
├── .env.example          # Environment variables template
├── .gitignore            # Excludes caches, databases, and uploaded files from Git
├── uploads/              # Storage directory for physical uploaded resume files
│   └── .gitkeep          # Tracks folder structure in Git
├── templates/
│   └── index.html        # Main SPA markup layout
└── static/
    ├── css/
    │   └── style.css     # Dark mode glassmorphic styling
    └── js/
        └── app.js        # File upload queue, search, and drawer interaction logic
```
