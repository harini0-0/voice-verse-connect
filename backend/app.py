from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from translate import Translator
from gtts import gTTS
from faster_whisper import WhisperModel  # Updated import
import os
import tempfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
# Load the whisper model (will download on first run)
model = WhisperModel("base", device="cpu", compute_type="int8")

def text_to_text(text, target_language):
    try:
        translator = Translator(to_lang=target_language)
        translation = translator.translate(text)
        return {
            'success': True,
            'translated_text': translation
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def text_to_speech(text, language):
    try:
        tts = gTTS(text=text, lang=language)
        # Create temporary file for audio
        temp_audio = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
        tts.save(temp_audio.name)
        return {
            'success': True,
            'audio_path': temp_audio.name
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def speech_to_text(audio_file_path, source_language='en'):
    try:
        # Transcribe audio using faster-whisper
        segments, _ = model.transcribe(audio_file_path, language=source_language)
        text = " ".join([segment.text for segment in segments])
        return {
            'success': True,
            'text': text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def speech_to_speech(audio_path, source_language, target_language):
    try:
        # First convert speech to text
        result = speech_to_text(audio_path, source_language)
        if not result['success']:
            return result
        
        # Then translate the text
        translation = text_to_text(result['text'], target_language)
        if not translation['success']:
            return translation
        
        # Finally convert translated text to speech
        return text_to_speech(translation['translated_text'], target_language)
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def handle_text_translation(text, target_language, to_speech=False):
    try:
        # First translate the text
        translation = text_to_text(text, target_language)
        if not translation['success']:
            return jsonify({'error': translation['error']}), 500
            
        if to_speech:
            # Convert translated text to speech
            result = text_to_speech(translation['translated_text'], target_language)
            if result['success']:
                return send_file(
                    result['audio_path'],
                    mimetype='audio/mp3',
                    as_attachment=True,
                    download_name='translation.mp3'
                )
            return jsonify({'error': result['error']}), 500
        else:
            return jsonify({'translated_text': translation['translated_text']})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_speech_translation(audio_file, source_language, target_language, to_speech=False):
    try:
        # Save the uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(temp_dir, secure_filename(audio_file.filename))
        audio_file.save(audio_path)
        
        if to_speech:
            # Convert speech to speech
            result = speech_to_speech(audio_path, source_language, target_language)
            if result['success']:
                return send_file(
                    result['audio_path'],
                    mimetype='audio/mp3',
                    as_attachment=True,
                    download_name='translation.mp3'
                )
            return jsonify({'error': result['error']}), 500
        else:
            # Convert speech to text
            result = speech_to_text(audio_path, source_language)
            if not result['success']:
                return jsonify({'error': result['error']}), 500
                
            # Translate the text
            translation = text_to_text(result['text'], target_language)
            if not translation['success']:
                return jsonify({'error': translation['error']}), 500
                
            return jsonify({'translated_text': translation['translated_text']})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        # Cleanup temporary files
        try:
            os.remove(audio_path)
            os.rmdir(temp_dir)
        except:
            pass

@app.route("/translate", methods=['POST'])
def translate():
    try:
        if 'option' not in request.form:
            return jsonify({'error': 'Missing option parameter'}), 400
            
        option = request.form['option']
        target_language = request.form.get('language', 'en')
        source_language = request.form.get('source_language', 'en')
        
        # Handle text-based translations
        if option in ['text-to-text', 'text-to-speech']:
            if 'text' not in request.form:
                return jsonify({'error': 'Missing text parameter'}), 400
            
            return handle_text_translation(
                request.form['text'],
                target_language,
                to_speech=(option == 'text-to-speech')
            )
        
        # Handle speech-based translations
        elif option in ['speech-to-text', 'speech-to-speech']:
            if 'audio' not in request.files:
                return jsonify({'error': 'Missing audio file'}), 400
            
            audio_file = request.files['audio']
            if audio_file.filename == '':
                return jsonify({'error': 'No selected audio file'}), 400
            
            return handle_speech_translation(
                audio_file,
                source_language,
                target_language,
                to_speech=(option == 'speech-to-speech')
            )
        
        return jsonify({'error': 'Invalid option'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/health", methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)