import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename

# Import database instances
from config import Config
from database import db
from models import Candidate
from parser import parse_resume, get_nlp

# Create the Flask application
app = Flask(__name__, template_folder='templates', static_folder='static')
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[-1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Serve the single-page application dashboard."""
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_resume():
    """Upload and parse a candidate resume."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Ensure a unique filename if it already exists to avoid collisions
        base, extension = os.path.splitext(filename)
        counter = 1
        unique_filename = filename
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)):
            unique_filename = f"{base}_{counter}{extension}"
            counter += 1
            
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        try:
            # Parse the resume file
            parsed_data = parse_resume(file_path, unique_filename)
            
            # Create a database record
            candidate = Candidate(
                name=parsed_data['name'],
                email=parsed_data['email'],
                phone=parsed_data['phone'],
                skills=parsed_data['skills'],
                education=parsed_data['education'],
                filename=unique_filename,
                raw_text=parsed_data['raw_text']
            )
            
            db.session.add(candidate)
            db.session.commit()
            
            return jsonify({
                'message': 'Resume uploaded and parsed successfully',
                'candidate': candidate.to_dict()
            }), 201
            
        except Exception as e:
            # Remove file if parsing failed
            if os.path.exists(file_path):
                os.remove(file_path)
            db.session.rollback()
            return jsonify({'error': f'Failed to process resume: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Supported types: PDF, DOCX, DOC, TXT'}), 400

@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    """Retrieve, search, and filter candidates."""
    query_param = request.args.get('query', '').strip()
    skill_filter = request.args.get('skills', '').strip()
    
    query = Candidate.query
    
    # Apply keyword/name search
    if query_param:
        search_filter = f"%{query_param}%"
        query = query.filter(
            (Candidate.name.ilike(search_filter)) |
            (Candidate.email.ilike(search_filter)) |
            (Candidate.education.ilike(search_filter)) |
            (Candidate.raw_text.ilike(search_filter))
        )
        
    # Get all candidates (we'll filter skills in python for flex-match, or use SQLite/PG compatible JSON query)
    candidates = query.order_by(Candidate.created_at.desc()).all()
    
    # Apply skill filter if provided
    if skill_filter:
        skills_to_match = [s.strip().lower() for s in skill_filter.split(',') if s.strip()]
        filtered_candidates = []
        for c in candidates:
            candidate_skills_lower = [s.lower() for s in c.skills]
            # Check if candidate has all of the requested skills
            if all(skill in candidate_skills_lower for skill in skills_to_match):
                filtered_candidates.append(c)
        candidates = filtered_candidates
        
    return jsonify([c.to_dict() for c in candidates])

@app.route('/api/candidates/<int:candidate_id>', methods=['GET'])
def get_candidate_detail(candidate_id):
    """Retrieve detailed information about a single candidate including raw text."""
    candidate = Candidate.query.get_or_404(candidate_id)
    result = candidate.to_dict()
    # Add raw text for detail viewing in UI
    result['raw_text'] = candidate.raw_text
    return jsonify(result)

@app.route('/api/candidates/<int:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    """Delete a candidate record and their uploaded resume file."""
    candidate = Candidate.query.get_or_404(candidate_id)
    
    # Try deleting the physical file
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], candidate.filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error removing physical file: {e}")
            
    try:
        db.session.delete(candidate)
        db.session.commit()
        return jsonify({'message': 'Candidate record deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete candidate: {str(e)}'}), 500

@app.route('/api/skills', methods=['GET'])
def get_all_skills():
    """Retrieve a list of all skills defined in the parser system dictionary."""
    from parser import SKILLS_LIST
    return jsonify(SKILLS_LIST)

# Serve resume downloads/previews if desired (optional utility)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Initialize spaCy model on startup if needed
    print("Verifying spaCy language model...")
    get_nlp()
    
    # Initialize database tables
    with app.app_context():
        db.create_all()
        print("Database initialized.")
        
    # Start server
    app.run(host='0.0.0.0', port=5050, debug=True)
