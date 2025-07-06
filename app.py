from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import uuid
from image_upscaling_api import upload_image, get_uploaded_images

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PROCESSED_FOLDER'] = 'processed'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

# Client ID - generate your own 32-digit hex string
CLIENT_ID = "481d40602d3f4570487432044df03a52"

# Ensure upload directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        # Save original file
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get parameters
        scale = int(request.form.get('scale', 4))
        face_enhance = request.form.get('face_enhance', 'false') == 'true'
        
        # Call the upscaling API
        try:
            upload_image(
                filepath, 
                CLIENT_ID,
                use_face_enhance=face_enhance,
                scale=scale
            )
            
            return jsonify({
                'success': True,
                'message': 'Image uploaded for processing',
                'filename': filename
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/status/<filename>')
def check_status(filename):
    try:
        waiting, completed, in_progress = get_uploaded_images(CLIENT_ID)
        
        # In a real implementation, you would match the filename with the API response
        # This is simplified for demonstration
        if filename in completed:
            return jsonify({
                'status': 'completed',
                'processed_filename': f"processed_{filename}"
            })
        elif filename in in_progress:
            return jsonify({'status': 'processing'})
        else:
            return jsonify({'status': 'queued'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(
        app.config['PROCESSED_FOLDER'],
        filename,
        as_attachment=True
    )

if __name__ == '__main__':
    app.run(debug=True)
