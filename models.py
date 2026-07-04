from database import db
from datetime import datetime

class Candidate(db.Model):
    __tablename__ = 'candidates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    email = db.Column(db.String(255), nullable=True, index=True)
    phone = db.Column(db.String(50), nullable=True)
    skills = db.Column(db.JSON, nullable=False, default=list)
    education = db.Column(db.Text, nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    raw_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'skills': self.skills,
            'education': self.education,
            'filename': self.filename,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
