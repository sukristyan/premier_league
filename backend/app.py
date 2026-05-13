import os

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import requests

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    static_folder=os.path.join(_BASE_DIR, "static"),
    template_folder=os.path.join(_BASE_DIR, "templates"),
)

CORS(app)


@app.route("/")
def index():
    return render_template("index.html")


API_KEY = "4da351778ae44a7fb74bcfcb0550db61"
BASE_URL = "http://api.football-data.org/v4/competitions/PL"
HEADERS = {
    "X-Auth-Token": API_KEY
}

#! Endpoint to fetch Premier League standings
@app.route('/api/standings', methods=['GET'])
def get_standings():
    try:
        response = requests.get(f"{BASE_URL}/standings", headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        standings = data['standings'][0]['table']

        # response json format
        return jsonify({
            "status": "success",
            "data": standings
        }), 200
    
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch standings data: {str(e)}")

        return jsonify({
            "status": "error",
            "message": "Failed to retrieve Premier League standings data."
        }), 500

#! Endpoint to fetch Premier League fixtures
@app.route('/api/fixtures', methods=['GET'])
def get_fixtures():
    # catch team query parameter from url, example: /api/fixtures?team=arsenal
    team_query = request.args.get('team')

    try:
        response = requests.get(f"{BASE_URL}/matches?status=SCHEDULED", headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        matches  = data.get('matches', [])

        # logic filter matches by team name
        if team_query:
            filtered_matches = [
                match for match in matches
                if team_query.lower() in match['homeTeam']['name'].lower() 
                or team_query.lower() in match['awayTeam']['name'].lower()
            ]
            matches = filtered_matches
        else:
            matches = matches[:10] # Return only the first 10 matches

        return jsonify({
            "status": "success",
            "data": matches
        }), 200
    
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch fixtures data: {str(e)}")

        return jsonify({
            "status": "error",
            "message": "Failed to retrieve Premier League fixtures data."
        }), 500

#! Endpoint to fetch Premier League top scorers
@app.route('/api/top-scorers', methods=['GET'])
def get_top_scorers():
    try:
        response = requests.get(f"{BASE_URL}/scorers", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        scorers = data.get('scorers', [])
        return jsonify({
            "status": "success", 
            "data": scorers
        }), 200
        
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch top scorers data: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Failed to retrieve top scorers data."
        }), 500
    
#! Endpoint to fetch Premier League top assists
@app.route('/api/top-assists', methods=['GET'])
def get_top_assists():
    try:
        response = requests.get(f"{BASE_URL}/scorers", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        players = data.get('scorers', [])
        
        assists_data = [p for p in players if p.get('assists') is not None and p.get('assists') > 0]
        sorted_assists = sorted(assists_data, key=lambda x: x['assists'], reverse=True)

        return jsonify({
            "status": "success", 
            "data": sorted_assists
        }), 200

    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch top assists data: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Failed to retrieve top assists data."
        }), 500

#! Endpoint to fetch Premier League match results
@app.route('/api/results', methods=['GET'])
def get_results():
    team_query = request.args.get('team')

    try:
        response = requests.get(f"{BASE_URL}/matches?status=FINISHED", headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        matches = data.get('matches', [])
        matches = sorted(matches, key=lambda x: x['utcDate'], reverse=True)

        if (team_query):
            filtered_matches = [
                match for match in matches
                if team_query.lower() in match['homeTeam']['name'].lower() 
                or team_query.lower() in match['awayTeam']['name'].lower()
            ]
            matches = filtered_matches[:10]
        else:
            matches = matches[:10]

        return jsonify({
            "status": "success", 
            "data": matches
        }), 200
    
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch match results data: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Failed to retrieve match results data."
        }), 500

#! Endpoint to fetch Premier League teams
@app.route('/api/teams', methods=['GET'])
def get_teams():
    team_query = request.args.get('team')

    try:
        response = requests.get(f"{BASE_URL}/teams", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        teams = data.get('teams', [])
        
        team_info = []
        for t in teams:
            team_info.append({
                "id": t.get('id'),
                "name": t.get('name'),
                "shortName": t.get('shortName'),
                "crest": t.get('crest'),
                "venue": t.get('venue'),
                "clubColors": t.get('clubColors'),
                "website": t.get('website'),
                "founded": t.get('founded')
            })
            
        if team_query:
            filtered_teams = [
                team for team in team_info 
                if team_query.lower() in str(team['name']).lower() 
                or team_query.lower() in str(team['shortName']).lower()
            ]
            team_info = filtered_teams
            
        return jsonify({
            "status": "success", 
            "data": team_info
        }), 200
        
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch teams data: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Failed to retrieve teams data."
        }), 500

#! Endpoint to fetch Premier League team details by team ID
@app.route('/api/squad/<int:team_id>', methods=['GET'])
def get_squad(team_id):
    try:
        url = f"http://api.football-data.org/v4/teams/{team_id}"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        squad = data.get('squad', [])
        coach = data.get('coach', {})

        squad_info = []
        for player in squad:
            squad_info.append({
                "id": player.get('id'),
                "name": player.get('name'),
                "position": player.get('position'),
                "dateOfBirth": player.get('dateOfBirth'),
                "nationality": player.get('nationality'),
                "shirtNumber": player.get('shirtNumber') or "N/A",
            })
        
        return jsonify({
            "status": "success",
            "teamName": data.get('name'),
            "coach": coach.get('name') if coach else "Unknown",
            "data": squad_info
        }), 200
    
    except requests.exceptions.RequestException as e:
        print(f"[Error] Failed to fetch squad data for team ID {team_id}: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": "Failed to retrieve team squad data."
        }), 500

if __name__ == '__main__':
    print("[Info] App running at http://127.0.0.1:5000/ (API + frontend)")
    app.run(debug=True)
