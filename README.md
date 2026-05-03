# ⚽ Premier League API

A lightweight REST API built with **Flask** that wraps the [football-data.org](https://www.football-data.org/) API to serve Premier League data — standings, fixtures, results, top scorers, assists, teams, and squad details.

---

## 🚀 Features

- 📊 **Standings** — Real-time Premier League table
- 📅 **Fixtures** — Upcoming scheduled matches (filterable by team)
- 🏁 **Results** — Latest finished matches (filterable by team)
- 🥇 **Top Scorers** — Leading goal scorers this season
- 🎯 **Top Assists** — Players with most assists this season
- 🏟️ **Teams** — All PL clubs with info (crest, venue, colors, etc.)
- 👥 **Squad** — Full squad & coach details by team ID

---

## 🛠️ Tech Stack

- **Python** + **Flask**
- **Flask-CORS** — Cross-origin support
- **Requests** — HTTP client for football-data.org API
- **football-data.org v4 API**

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Sultvnnnn/premier_league.git
cd premier_league
```

### 2. Create & activate virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up API Key

Get your free API key from [football-data.org](https://www.football-data.org/), then update `app.py`:

```python
API_KEY = "your_api_key_here"
```

> Alternatively, use a `.env` file to keep your key secure (recommended).

### 5. Run the server

```bash
python app.py
```

Server will run at **`http://127.0.0.1:5000`**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/standings` | Premier League standings table |
| `GET` | `/api/fixtures` | Upcoming fixtures (top 10) |
| `GET` | `/api/fixtures?team=arsenal` | Fixtures filtered by team name |
| `GET` | `/api/results` | Latest 10 finished matches |
| `GET` | `/api/results?team=chelsea` | Results filtered by team name |
| `GET` | `/api/top-scorers` | Top goal scorers this season |
| `GET` | `/api/top-assists` | Top assist providers this season |
| `GET` | `/api/teams` | All Premier League teams |
| `GET` | `/api/teams?team=liverpool` | Search team by name |
| `GET` | `/api/squad/<team_id>` | Squad & coach details by team ID |

---

## 📦 Response Format

All endpoints return a consistent JSON structure:

```json
{
  "status": "success",
  "data": [ ... ]
}
```

On error:

```json
{
  "status": "error",
  "message": "Failed to retrieve data."
}
```

---

## 📁 Project Structure

```
premier_league/
├── app.py              # Main Flask application & all API routes
├── requirements.txt    # Python dependencies
├── .gitignore          # Ignored files (venv, .env, __pycache__)
└── README.md
```

---

## 📝 Notes

- This API uses the **free tier** of football-data.org, which has rate limits.
- CORS is enabled, so this backend can be consumed by any frontend (React, Vue, etc.).
- The `.env` file is gitignored — never commit your API key to version control.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
